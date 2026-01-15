import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, formatTruncatedMessage } from '@/lib/whatsapp';
import { getDailyReadings } from '@/lib/lectionary';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

        // Strict Command Matching
        // Prevents triggering on "I loved the reading today" (Conversational)
        // We compare the exact trimmed string.
        const isReadingReq = ['READING', 'FULL READING', 'READINGS'].includes(text);
        const isSummaryReq = ['SUMMARY', 'REFLECTION', 'DAILY REFLECTION', 'WORD', 'SUMMARY & REFLECTION'].includes(text);

        // Fetch User Globally
        const user = await prisma.user.findFirst({
            where: { phoneNumber: cleanPhone }
        });

        if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'CANCEL') {
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: false }
            });
            console.log(`[TWILIO] Opt-out processed for ${cleanPhone}`);
        }
        else if (text === 'START' || text === 'UNSTOP') {
            // Check if user exists first
            // Already fetched above

            if (!user) {
                console.log(`[TWILIO] START received from UNREGISTERED number: ${cleanPhone}`);
                const notRegisteredMsg = `*👋 Welcome to DailyWord*

It looks like this number isn't registered yet.

To start receiving daily Bible readings:
1.  Visit ${process.env.NEXTAUTH_URL}
2.  Sign up and subscribe.
3.  Verify this phone number in your dashboard.

Once verified, simply reply *START* here to activate! 🙏`;
                await sendWhatsAppMessage(cleanPhone, notRegisteredMsg);
            } else {
                // Determine if this is a first-time activation or a resume
                const isFirstTime = user.deliveryStatus === 'pending_activation' || !user.deliveryStatus;

                // User exists - Activate
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        whatsappOptIn: true,
                        deliveryStatus: 'active',
                        lastUserMessageAt: new Date()
                    }
                });

                if (isFirstTime) {
                    const welcomeMsg = `*📖 DailyWord – Welcome*

Hello 👋
Welcome to DailyWord.

You’re now activated to receive daily Bible readings delivered privately to you on WhatsApp — a quiet, personal space with the Word of God.

*🙏 What to Expect*

Each day, you’ll receive:
• A curated Bible reading
• Sent at your chosen time
• Delivered 1-to-1 (not a group)
• No noise, no distractions

*✍️ Use This Chat as Your Private Journal*

You can reply directly to the daily reading with your thoughts, prayers, or reflections.
This chat is your personal space to engage with Scripture — just between you and the Word.

*⚙️ Manage Your Subscription*

You can manage your plan, delivery time, or subscription anytime here:
${process.env.NEXTAUTH_URL}/dashboard

*ℹ️ Need Help?*
Drop us an email at support@dailyword.space

Thank you for allowing DailyWord to be part of your daily walk.
May the Word guide and encourage you each day. 🙏

— DailyWord`;

                    await sendWhatsAppMessage(cleanPhone, welcomeMsg);
                } else {
                    // Resuming from Pause/Stop
                    await sendWhatsAppMessage(cleanPhone, "Messages Activated! 🕊️\n\nYour daily readings will continue arriving at your scheduled time.");
                }
            }
        }
        else if (text === 'NO-OTP' || text === 'NO OTP') {
            console.log(`[TWILIO] User sent NO-OTP to open session: ${cleanPhone}`);
            // Just acknowledging this message opens the 24h window
            await sendWhatsAppMessage(cleanPhone, `✅ Support Session Active.
             
You can now receive your verification code.

Please return to the dashboard to request the code again:
${process.env.NEXTAUTH_URL}/dashboard`);
        }
        else if (isReadingReq) {
            console.log(`[TWILIO] User asked for READING`);
            // Compliance: Extend 24h Window
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: {
                    lastUserMessageAt: new Date(),
                    deliveryStatus: 'active'
                }
            });
            try {
                const r = await getDailyReadings(new Date(), user?.bibleVersion || 'NABRE');
                const dateStr = new Date().toLocaleDateString();
                const link = `${process.env.NEXTAUTH_URL}/readings/${new Date().toLocaleDateString('en-CA')}`;

                // 1. Reading 1 (Send first)
                const msg1Raw = `*Daily Readings for ${dateStr}*\n\n📖 *Reading 1*\n${r.reading1.reference}\n${r.reading1.text}`;
                const msg1 = formatTruncatedMessage(msg1Raw, link);
                await sendWhatsAppMessage(cleanPhone, msg1);
                await delay(2000); // Wait 2s to ensure order

                // 2. Psalm
                const msgPsalmRaw = `🎵 *Psalm*\n${r.psalm.reference}\n${r.psalm.text}`;
                await sendWhatsAppMessage(cleanPhone, formatTruncatedMessage(msgPsalmRaw, link));
                await delay(2000);

                // 3. Reading 2 (Optional)
                if (r.reading2) {
                    const msg2Raw = `📜 *Reading 2*\n${r.reading2.reference}\n${r.reading2.text}`;
                    await sendWhatsAppMessage(cleanPhone, formatTruncatedMessage(msg2Raw, link));
                    await delay(2000);
                }

                // 4. Gospel & Link
                const msg3 = `✨ *Gospel*\n${r.gospel.reference}\n${r.gospel.text}\n\nRead full: ${link}\n\nYou’re welcome to respond with 🙏 Amen or share a reflection.`;
                await sendWhatsAppMessage(cleanPhone, formatTruncatedMessage(msg3, link));
            } catch (e) {
                console.error("Reading Fetch Error", e);
                await sendWhatsAppMessage(cleanPhone, "Sorry, I couldn't fetch the readings. Please try again later.");
            }
        }
        // ... (rest of file)
        else if (isSummaryReq) {
            console.log(`[TWILIO] User asked for SUMMARY`);
            // Compliance: Extend 24h Window
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: {
                    lastUserMessageAt: new Date(),
                    deliveryStatus: 'active'
                }
            });
            const dateKey = new Date().toLocaleDateString('en-CA');
            const dateStr = new Date().toLocaleDateString();
            const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

            const lang = (user?.bibleVersion === 'ABTAG2001') ? 'Tagalog' : 'English';

            let dailyReflection = await prisma.dailyReflection.findUnique({
                where: { date_language: { date: dateKey, language: lang } }
            });

            // On-demand fallback
            if (!dailyReflection) {
                const { generateReflection } = await import('@/lib/gemini');
                const { getDailyReadings } = await import('@/lib/lectionary');
                try {
                    const r = await getDailyReadings(new Date(), user?.bibleVersion || 'NABRE');
                    if (r) {
                        // @ts-ignore
                        const generated = await generateReflection({ ...r, date: dateKey }, lang);
                        if (generated) {
                            dailyReflection = await prisma.dailyReflection.create({
                                data: { date: dateKey, language: lang, content: generated }
                            });
                        }
                    }
                } catch (e) {
                    console.error("On-demand reflection gen failed", e);
                }
            }

            if (dailyReflection) {
                let raw = dailyReflection.content;

                // 1. Convert Pipes to Newlines (Double spacing for sections)
                let formatted = raw.replace(/ \| /g, "\n\n");

                // 2. Clean Markdown: WhatsApp uses * for bold, not **. 
                // We convert standard MD bold (**) to WhatsApp bold (*).
                formatted = formatted.replace(/\*\*/g, '*');

                // 2. Format Headers: Remove Markdown Bold (*), Add Newline
                // Matches "📖 *Word:* Content" -> "📖 Word:\nContent" or "📖 *Word:* " -> "📖 Word:\n"
                formatted = formatted
                    .replace(/📖 \*Word:\* ?/g, "📖 Word:\n")
                    .replace(/🕊️ \*Reflection:\* ?/g, "🕊️ Reflection:\n")
                    .replace(/🙏 \*Prayer:\* ?/g, "🙏 Prayer:\n");

                // 3. Assemble full message
                // Safety: Hard truncate to 1550 to prevent Twilio 1600 char limit error
                const finalMsg = `*Daily Word • ${dateStr}*\n\n${formatted}\n\nRead full: ${link}\n\nYou’re welcome to respond with 🙏 Amen or share a reflection.`.substring(0, 1550);

                await sendWhatsAppMessage(cleanPhone, finalMsg);
            } else {
                await sendWhatsAppMessage(cleanPhone, "Today's reflection is not ready yet. Please check back shortly.");
            }
        }
        else {
            // Generic Catch-All (e.g. "Amen", "Thanks", "Hello")
            // This IS considered a resume intent.
            console.log(`[TWILIO] User resumed via generic message: ${text.substring(0, 20)}`);
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: {
                    lastUserMessageAt: new Date(),
                    deliveryStatus: 'active'
                }
            });
        }

        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error) {
        console.error('[TWILIO WEBHOOK] Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
