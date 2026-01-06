import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getUSCCBReadings } from '@/lib/lectionary';

// Use a separate webhook for Twilio since the payload is different from Meta
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const Body = formData.get('Body') as string;
        const From = formData.get('From') as string; // "whatsapp:+123..."

        // Normalize: Twilio sends "whatsapp:+123456"
        const cleanPhone = From.replace('whatsapp:', '');
        const text = Body?.trim().toUpperCase() || "";

        console.log(`[TWILIO WEBHOOK] From: ${cleanPhone}, Body: ${text}`);

        const isReadingReq = text.includes('READING') || text.includes('FULL READING');
        const isSummaryReq = text.includes('SUMMARY') || text.includes('REFLECTION');

        if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'CANCEL') {
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: false }
            });
            console.log(`[TWILIO] Opt-out processed for ${cleanPhone}`);
        }
        else if (text === 'START' || text === 'UNSTOP') {
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: true }
            });
            await sendWhatsAppMessage(cleanPhone, "Welcome back! 🕊️");
        }
        else if (isReadingReq) {
            console.log(`[TWILIO] User asked for READING`);
            try {
                const r = await getUSCCBReadings(new Date());

                let content = `*Daily Readings for ${new Date().toLocaleDateString()}*\n\n`;
                content += `📖 *Reading 1*\n${r.reading1.reference}\n${r.reading1.text}\n\n`;
                content += `🎵 *Psalm*\n${r.psalm.reference}\n${r.psalm.text}\n\n`;
                content += `✨ *Gospel*\n${r.gospel.reference}\n${r.gospel.text}\n\n`;

                if (r.reading2) {
                    content += `📜 *Reading 2*\n${r.reading2.reference}\n${r.reading2.text}\n\n`;
                }

                const link = `${process.env.NEXTAUTH_URL}/readings/${new Date().toLocaleDateString('en-CA')}`;
                content += `Read full: ${link}`;

                await sendWhatsAppMessage(cleanPhone, content);
            } catch (e) {
                console.error("Reading Fetch Error", e);
                await sendWhatsAppMessage(cleanPhone, "Sorry, I couldn't fetch the readings. Please try again later.");
            }
        }
        else if (isSummaryReq) {
            console.log(`[TWILIO] User asked for SUMMARY`);
            const dateKey = new Date().toLocaleDateString('en-CA');
            let dailyReflection = await prisma.dailyReflection.findUnique({ where: { date: dateKey } });

            if (dailyReflection) {
                // Format: Separation with newlines
                // Data might be: "... | ... | ..."
                let niceBody = dailyReflection.content.replace(/ \| /g, "\n\n");
                await sendWhatsAppMessage(cleanPhone, niceBody);
            } else {
                await sendWhatsAppMessage(cleanPhone, "Today's reflection is not ready yet. Please check back shortly.");
            }
        }

        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('[TWILIO WEBHOOK] Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
