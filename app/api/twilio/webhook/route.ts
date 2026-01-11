import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getUSCCBReadings } from '@/lib/lectionary';
import { generateReflection, translateReadingsToPortuguese } from '@/lib/gemini';

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
        const isReadingReq = ['READING', 'FULL READING', 'READINGS', 'LEITURA', 'LEITURAS'].includes(text);
        const isSummaryReq = ['SUMMARY', 'REFLECTION', 'DAILY REFLECTION', 'WORD', 'SUMMARY & REFLECTION', 'REFLEXAO', 'REFLEXÃO', 'RESUMO'].includes(text);

        if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'CANCEL') {
            await prisma.user.updateMany({
                where: { phoneNumber: cleanPhone },
                data: { whatsappOptIn: false }
            });
            console.log(`[TWILIO] Opt-out processed for ${cleanPhone}`);
        }
        else if (text === 'START' || text === 'UNSTOP') {
            // Check if user exists first
            const user = await prisma.user.findFirst({
                where: { phoneNumber: cleanPhone }
            });

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
        else if (isReadingReq) {
            console.log(`[TWILIO] User asked for READING`);

            // Fetch user to determine language
            const user = await prisma.user.findFirst({
                where: { phoneNumber: cleanPhone }
            });

            // Compliance: Extend 24h Window
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastUserMessageAt: new Date(),
                        deliveryStatus: 'active'
                    }
                });
            }

            const isPt = user?.bibleVersion === 'AVE_MARIA';

            try {
                const rRaw = await getUSCCBReadings(new Date());
                let r = rRaw;

                if (isPt) {
                    const translated = await translateReadingsToPortuguese(rRaw);
                    if (translated) r = translated;
                }

                const dateStr = new Date().toLocaleDateString(isPt ? 'pt-BR' : 'en-US');
                const link = `${process.env.NEXTAUTH_URL}/readings/${new Date().toLocaleDateString('en-CA')}`;

                if (isPt) {
                    // -- PORTUGUESE --
                    const msg1 = `*Leituras de Hoje: ${dateStr}*\n\n📖 *1ª Leitura*\n${r.reading1.reference}\n${r.reading1.text}`.substring(0, 1550);
                    await sendWhatsAppMessage(cleanPhone, msg1);
                    await delay(2000);

                    let msg2 = `🎵 *Salmo*\n${r.psalm.reference}\n${r.psalm.text}`;
                    if (r.reading2) {
                        msg2 += `\n\n📜 *2ª Leitura*\n${r.reading2.reference}\n${r.reading2.text}`;
                    }
                    await sendWhatsAppMessage(cleanPhone, msg2.substring(0, 1550));
                    await delay(2000);

                    const msg3 = `✨ *Evangelho*\n${r.gospel.reference}\n${r.gospel.text}\n\nLeia completo: ${link}\n\nResponda com 🙏 Amém ou envie sua reflexão.`.substring(0, 1550);
                    await sendWhatsAppMessage(cleanPhone, msg3);

                } else {
                    // -- ENGLISH --
                    const msg1 = `*Daily Readings for ${dateStr}*\n\n📖 *Reading 1*\n${r.reading1.reference}\n${r.reading1.text}`.substring(0, 1550);
                    await sendWhatsAppMessage(cleanPhone, msg1);
                    await delay(2000);

                    let msg2 = `🎵 *Psalm*\n${r.psalm.reference}\n${r.psalm.text}`;
                    if (r.reading2) {
                        msg2 += `\n\n📜 *Reading 2*\n${r.reading2.reference}\n${r.reading2.text}`;
                    }
                    await sendWhatsAppMessage(cleanPhone, msg2.substring(0, 1550));
                    await delay(2000);

                    const msg3 = `✨ *Gospel*\n${r.gospel.reference}\n${r.gospel.text}\n\nRead full: ${link}\n\nYou’re welcome to respond with 🙏 Amen or share a reflection.`.substring(0, 1550);
                    await sendWhatsAppMessage(cleanPhone, msg3);
                }

            } catch (e) {
                console.error("Reading Fetch Error", e);
                const subMsg = isPt
                    ? "Desculpe, não consegui buscar as leituras. Tente novamente mais tarde."
                    : "Sorry, I couldn't fetch the readings. Please try again later.";
                await sendWhatsAppMessage(cleanPhone, subMsg);
            }
        }
        else if (isSummaryReq) {
            console.log(`[TWILIO] User asked for SUMMARY`);

            const user = await prisma.user.findFirst({
                where: { phoneNumber: cleanPhone }
            });

            // Compliance: Extend 24h Window
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastUserMessageAt: new Date(),
                        deliveryStatus: 'active'
                    }
                });
            }

            const isPt = user?.bibleVersion === 'AVE_MARIA';
            const lang = isPt ? 'pt' : 'en';

            const dateKey = new Date().toLocaleDateString('en-CA');
            const dateStr = new Date().toLocaleDateString(isPt ? 'pt-BR' : 'en-US');
            const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

            // 1. Fetch Reflection (Localized)
            let dailyReflection = await prisma.dailyReflection.findUnique({
                where: {
                    date_language: { date: dateKey, language: lang }
                }
            });

            // 2. Generate on Demand if missing
            if (!dailyReflection) {
                console.log(`[WEBHOOK] Reflection missing for ${lang}. Generating on demand...`);
                try {
                    const r = await getUSCCBReadings(new Date());
                    // Note: We use English readings as context, AI translates reflection output
                    const generated = await generateReflection(r as any, lang);

                    if (generated) {
                        dailyReflection = await prisma.dailyReflection.create({
                            data: {
                                date: dateKey,
                                language: lang,
                                content: generated
                            }
                        });
                    }
                } catch (e) {
                    console.error("Generation Error", e);
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
                    .replace(/📖 \*Palavra:\* ?/g, "📖 Palavra:\n") // Portuguese header
                    .replace(/🕊️ \*Reflection:\* ?/g, "🕊️ Reflection:\n")
                    .replace(/🕊️ \*Reflexão:\* ?/g, "🕊️ Reflexão:\n") // Portuguese header
                    .replace(/🙏 \*Prayer:\* ?/g, "🙏 Prayer:\n")
                    .replace(/🙏 \*Oração:\* ?/g, "🙏 Oração:\n");   // Portuguese header

                // 3. Assemble full message
                const finalMsg = `*Daily Word • ${dateStr}*\n\n${formatted}\n\nRead full: ${link}\n\n${isPt ? 'Responda com 🙏 Amém.' : 'You’re welcome to respond with 🙏 Amen.'}`.substring(0, 1550);

                await sendWhatsAppMessage(cleanPhone, finalMsg);
            } else {
                const errMsg = isPt
                    ? "A reflexão de hoje ainda não está pronta. Por favor, tente novamente em breve."
                    : "Today's reflection is not ready yet. Please check back shortly.";
                await sendWhatsAppMessage(cleanPhone, errMsg);
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
