import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import twilio from 'twilio';

// Use a separate webhook for Twilio since the payload is different from Meta
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const Body = formData.get('Body') as string;
        const From = formData.get('From') as string; // "whatsapp:+123..."

        // Normalize: Twilio sends "whatsapp:+123456"
        const cleanPhone = From.replace('whatsapp:', '');

        const text = Body?.trim().toUpperCase();

        console.log(`[TWILIO WEBHOOK] From: ${cleanPhone}, Body: ${text}`);

        if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'CANCEL') {
            const updated = await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: false }
            });
            console.log(`[TWILIO] Opt-out processed for ${cleanPhone}: ${updated.count} records`);

            // Twilio automatically sends a standard reply for STOP, so we don't strictly need to reply here.
            // But we can if we want to override via Messaging Service settings.
        }
        else if (text === 'START' || text === 'UNSTOP') {
            // User re-subscribing.
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: true }
            });
            console.log(`[TWILIO] Opt-in processed for ${cleanPhone}`);
        }

        // Return TwiML to suppress any default auto-reply if needed, or just 200 OK.
        // Returning 200 OK with empty body tells Twilio "We handled it".
        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('[TWILIO WEBHOOK] Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
