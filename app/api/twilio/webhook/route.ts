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
                const dateStr = new Date().toLocaleDateString();
                const link = `${process.env.NEXTAUTH_URL}/readings/${new Date().toLocaleDateString('en-CA')}`;

                // 1. Reading 1 (Send first)
                // Safety truncate to avoid 1600 limit even for single message
                const msg1 = `*Daily Readings for ${dateStr}*\n\n📖 *Reading 1*\n${r.reading1.reference}\n${r.reading1.text}`.substring(0, 1550);
                await sendWhatsAppMessage(cleanPhone, msg1);

                // 2. Psalm & Reading 2
                let msg2 = `🎵 *Psalm*\n${r.psalm.reference}\n${r.psalm.text}`;
                if (r.reading2) {
                    msg2 += `\n\n📜 *Reading 2*\n${r.reading2.reference}\n${r.reading2.text}`;
                }
                await sendWhatsAppMessage(cleanPhone, msg2.substring(0, 1550));

                // 3. Gospel & Link
                const msg3 = `✨ *Gospel*\n${r.gospel.reference}\n${r.gospel.text}\n\nRead full: ${link}`.substring(0, 1550);
                await sendWhatsAppMessage(cleanPhone, msg3);

            } catch (e) {
                console.error("Reading Fetch Error", e);
                await sendWhatsAppMessage(cleanPhone, "Sorry, I couldn't fetch the readings. Please try again later.");
            }
        }
        else if (isSummaryReq) {
            console.log(`[TWILIO] User asked for SUMMARY`);
            const dateKey = new Date().toLocaleDateString('en-CA');
            const dateStr = new Date().toLocaleDateString();
            const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

            let dailyReflection = await prisma.dailyReflection.findUnique({ where: { date: dateKey } });

            if (dailyReflection) {
                let raw = dailyReflection.content;

                // 1. Convert Pipes to Newlines (Double spacing for sections)
                let formatted = raw.replace(/ \| /g, "\n\n");

                // 2. Format Headers: Remove Markdown Bold (*), Add Newline
                // Matches "📖 *Word:* Content" -> "📖 Word:\nContent" or "📖 *Word:* " -> "📖 Word:\n"
                formatted = formatted
                    .replace(/📖 \*Word:\* ?/g, "📖 Word:\n")
                    .replace(/🕊️ \*Reflection:\* ?/g, "🕊️ Reflection:\n")
                    .replace(/🙏 \*Prayer:\* ?/g, "🙏 Prayer:\n");

                // 3. Assemble full message
                const finalMsg = `*Daily Word • ${dateStr}*\n\n${formatted}\n\nRead full: ${link}`;

                await sendWhatsAppMessage(cleanPhone, finalMsg);
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
