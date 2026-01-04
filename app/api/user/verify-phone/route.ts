
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

            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    phoneNumber: phoneNumber, // Update the number they want to verify
                    phoneVerificationCode: otp,
                    phoneVerificationExpires: expires,
                    phoneVerificationSentAt: new Date(), // Set cooldown start
                    whatsappOptIn: false // Reset opt-in until verified
                }
            });

            // Send via WhatsApp
            await sendWhatsAppMessage(phoneNumber, `Your WhatsBible verification code is: *${otp}*\n\nThis code expires in 10 minutes.`);

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

            // Success
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    phoneVerificationCode: null,
                    phoneVerificationExpires: null,
                    whatsappOptIn: true // Enable messages!
                }
            });

            return NextResponse.json({ success: true, message: 'Phone verified' });
        }

        return new NextResponse('Invalid action', { status: 400 });
    } catch (error) {
        console.error("Verification Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
