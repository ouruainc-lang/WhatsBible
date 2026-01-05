import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode, checkVerificationCode } from '@/lib/whatsapp';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { action, phoneNumber, code } = await req.json();

        if (action === 'send') {
            if (!phoneNumber) return new NextResponse('Phone number required', { status: 400 });

            // Basic format validation
            if (!phoneNumber.startsWith('+') || phoneNumber.length < 8) {
                return new NextResponse('Invalid phone format. Must start with +', { status: 400 });
            }

            // Rate Limit Check (30 seconds)
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (user?.phoneVerificationSentAt) {
                const now = new Date();
                const diff = (now.getTime() - new Date(user.phoneVerificationSentAt).getTime()) / 1000;
                if (diff < 30) {
                    const waitTime = Math.ceil(30 - diff);
                    return new NextResponse(`Please wait ${waitTime}s before resending`, { status: 429 });
                }
            }

            // Send via Twilio Verify API
            await sendVerificationCode(phoneNumber);

            // Update DB to track pending verification
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    // @ts-ignore
                    pendingPhoneNumber: phoneNumber,
                    phoneVerificationCode: "TWILIO_VERIFY", // Sentinel value
                    phoneVerificationSentAt: new Date(),
                    whatsappOptIn: false
                }
            });

            return NextResponse.json({ success: true, message: 'Verification code sent via WhatsApp' });
        }

        else if (action === 'confirm') {
            if (!code) return new NextResponse('Code required', { status: 400 });

            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            });

            // @ts-ignore
            const pendingPhone = user?.pendingPhoneNumber;

            if (!pendingPhone) {
                return new NextResponse('No pending phone verification found', { status: 400 });
            }

            // Verify with Twilio
            const isValid = await checkVerificationCode(pendingPhone, code);

            if (!isValid) {
                return new NextResponse('Invalid code or expired', { status: 400 });
            }

            // SUCCESS FLOW: Handle Recycled Numbers (Takeover)
            const existingOwner = await prisma.user.findFirst({
                where: {
                    phoneNumber: pendingPhone,
                    id: { not: user.id }
                }
            });

            // Transaction to finalize
            await prisma.$transaction(async (tx) => {
                if (existingOwner) {
                    await tx.user.update({
                        where: { id: existingOwner.id },
                        data: {
                            phoneNumber: null,
                            phoneVerificationCode: null,
                            whatsappOptIn: false
                        }
                    });
                }

                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        phoneNumber: pendingPhone,
                        // @ts-ignore
                        pendingPhoneNumber: null,
                        phoneVerificationCode: "VERIFIED",
                        phoneVerificationExpires: null,
                        whatsappOptIn: true
                    }
                });
            });

            // Send Welcome Template
            const { sendWhatsAppTemplate } = await import('@/lib/whatsapp');
            try {
                const welcomeTemplate = process.env.WHATSAPP_TEMPLATE_WELCOME || "HXa22877988d6033668434c1fc651ed58d";
                await sendWhatsAppTemplate(pendingPhone, welcomeTemplate, {});
            } catch (error) {
                console.error("Failed to send welcome message", error);
            }

            return NextResponse.json({ success: true, message: 'Phone verified. Welcome message sent!' });
        }

        return new NextResponse('Invalid action', { status: 400 });
    } catch (error: any) {
        console.error("Verification Error", error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
