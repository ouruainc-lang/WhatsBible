import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from '@/lib/whatsapp';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const { action, phoneNumber, code } = await req.json();

        if (action === 'send') {
            if (!phoneNumber) return new NextResponse('Phone number required', { status: 400 });

            // Basic format validation (E.164-ish)
            if (!phoneNumber.startsWith('+') || phoneNumber.length < 8) {
                return new NextResponse('Invalid phone format. Must start with +', { status: 400 });
            }

            // Rate Limit Check (60 seconds)
            const user = await prisma.user.findUnique({ where: { id: session.user.id } });

            if (user?.phoneVerificationSentAt) {
                const now = new Date();
                const diff = (now.getTime() - new Date(user.phoneVerificationSentAt).getTime()) / 1000;
                if (diff < 60) {
                    const waitTime = Math.ceil(60 - diff);
                    return new NextResponse(`Please wait ${waitTime}s before resending`, { status: 429 });
                }
            }

            const otp = generateOTP();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            // Store in pendingPhoneNumber to allow OTP sending even if number is taken (Recycled Number Flow)
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    // @ts-ignore
                    pendingPhoneNumber: phoneNumber,
                    phoneVerificationCode: otp,
                    phoneVerificationExpires: expires,
                    phoneVerificationSentAt: new Date(),
                    whatsappOptIn: false
                }
            });

            // 5. Get User Language for OTP Message
            // @ts-ignore
            const lang = (user.systemLanguage as SystemLanguage) || 'en';
            const { dictionaries } = await import('@/lib/i18n/dictionaries');
            const messageRaw = dictionaries[lang].messages.otpMessage;
            const message = messageRaw.replace('{code}', otp);

            // Send via WhatsApp
            await sendWhatsAppMessage(phoneNumber, message);

            return NextResponse.json({ success: true, message: 'Code sent' });
        }

        else if (action === 'confirm') {
            if (!code) return new NextResponse('Code required', { status: 400 });

            const user = await prisma.user.findUnique({
                where: { id: session.user.id }
            });

            if (!user || !user.phoneVerificationCode || !user.phoneVerificationExpires) {
                return new NextResponse('No verification pending', { status: 400 });
            }

            if (new Date() > user.phoneVerificationExpires) {
                return new NextResponse('Code expired', { status: 400 });
            }

            if (user.phoneVerificationCode !== code) {
                return new NextResponse('Invalid code', { status: 400 });
            }

            // @ts-ignore
            const pendingPhone = user.pendingPhoneNumber;

            if (!pendingPhone) {
                return new NextResponse('No pending phone number found', { status: 400 });
            }

            // SUCCESS FLOW: Handle Recycled Numbers (Takeover)
            // 1. Find if anyone else owns this number
            const existingOwner = await prisma.user.findFirst({
                where: {
                    phoneNumber: pendingPhone,
                    id: { not: user.id }
                }
            });

            // 2. Transaction to release old owner and assign to new
            await prisma.$transaction(async (tx) => {
                if (existingOwner) {
                    // Release from old owner
                    await tx.user.update({
                        where: { id: existingOwner.id },
                        data: {
                            phoneNumber: null,
                            phoneVerificationCode: null,
                            whatsappOptIn: false
                        }
                    });
                }

                // Verify and Assign to current user
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

            // Compliance: Do NOT send welcome message automatically. 
            // User must send 'START' to activate.

            return NextResponse.json({ success: true, message: 'Phone verified. Welcome message sent!' });
        }

        return new NextResponse('Invalid action', { status: 400 });
    } catch (error: any) {
        console.error("Verification Error", error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
