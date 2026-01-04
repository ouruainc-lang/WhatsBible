import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Meta Verification Token from .env
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update or message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
            const message = value.messages[0];
            const from = message.from; // e.g., "15551234567"
            const text = message.text?.body?.toUpperCase().trim();

            if (text === 'START') {
                // Format phone number: Meta sends without '+', but we might store with '+' or not.
                // let's stick to storing numbers as clean digits or E.164.
                // Ideally we sanitize `from` to be consistent. 

                await prisma.user.upsert({
                    where: { phoneNumber: from },
                    update: { whatsappOptIn: true },
                    create: {
                        phoneNumber: from,
                        whatsappOptIn: true,
                        email: `user_${from}@temp.dailyword.space` // Placeholder email if they start via WA
                    }
                });

                // Reply with text (Works because it's a user-initiated 24h window)
                await sendWhatsAppMessage(from, "Welcome to DailyWord! You are subscribed. Reply STOP to cancel.");

            } else if (text === 'STOP') {
                await prisma.user.updateMany({
                    where: { phoneNumber: from },
                    data: { whatsappOptIn: false }
                });
                await sendWhatsAppMessage(from, "You have been unsubscribed.");
            } else {
                // Echo or ignore
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Webhook Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
