import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, formatTruncatedMessage, formatReflectionMessage, sendSplitWhatsAppMessage } from '@/lib/whatsapp';
import { dictionaries, SystemLanguage } from '@/lib/i18n/dictionaries';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// ... (imports)
// ... imports
import { getDailyReadings } from '@/lib/lectionary';

// ... (GET handler unchanged)

// Clean text helper
const cleanText = (text: string) => text.trim();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
            const message = value.messages[0];
            const from = message.from;

            // Fetch User Globally to determine language/version
            const user = await prisma.user.findFirst({
                where: { phoneNumber: from }
            });
            const bibleVersion = user?.bibleVersion || 'NABRE';
            // @ts-ignore
            const sysLang: SystemLanguage = (user?.systemLanguage as SystemLanguage) || 'en';
            const d = dictionaries[sysLang];

            // Determine Input Type (Text vs Interactive)
            let inputId = "";
            let inputText = "";

            if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
                const btn = message.interactive.button_reply;
                inputId = btn.id?.toLowerCase() || "";
                inputText = btn.title?.toLowerCase() || "";
            } else if (message.type === 'button') {
                // Legacy Quick Reply
                inputId = message.button.payload?.toLowerCase() || "";
                inputText = message.button.text?.toLowerCase() || "";
            } else if (message.type === 'text') {
                inputText = message.text?.body?.toLowerCase().trim() || "";
            }

            // Logic Switch
            const isReadingReq = inputId.includes('reading') || inputText.includes('full reading') || inputText.includes('reading');
            const isSummaryReq = inputId.includes('summary') || inputId.includes('reflection') || inputText.includes('summary') || inputText.includes('reflection');
            const isStart = inputText === 'start';
            const isStop = inputText === 'stop';

            if (isReadingReq) {
                // Fetch Readings
                console.log(`[WEBHOOK] User ${from} requested READING`);
                try {
                    // Use User's Timezone
                    const userTz = user?.timezone || 'UTC';
                    const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: userTz });
                    const today = new Date(dateKey);
                    const dateStr = new Date().toLocaleDateString('en-US', { timeZone: userTz });

                    const r = await getDailyReadings(today, bibleVersion);
                    const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

                    // 1. Reading 1
                    const msg1Raw = `*${d.messages.readingHeader} ${dateStr}*\n\n📖 *${d.messages.reading1}*\n${r.reading1.reference}\n${r.reading1.text}`;
                    await sendSplitWhatsAppMessage(from, msg1Raw);
                    await delay(2000);

                    // 2. Psalm
                    const msgPsalmRaw = `🎵 *${d.messages.psalm}*\n${r.psalm.reference}\n${r.psalm.text}`;
                    await sendSplitWhatsAppMessage(from, msgPsalmRaw);
                    await delay(2000);

                    // 3. Reading 2 (Optional)
                    if (r.reading2) {
                        const msg2Raw = `📜 *${d.messages.reading2}*\n${r.reading2.reference}\n${r.reading2.text}`;
                        await sendSplitWhatsAppMessage(from, msg2Raw);
                        await delay(2000);
                    }

                    // 4. Gospel & Link
                    const msg3Raw = `✨ *${d.messages.gospel}*\n${r.gospel.reference}\n${r.gospel.text}\n\n${d.messages.readFull}: ${link}\n\n${d.messages.replyAmen}`;
                    await sendSplitWhatsAppMessage(from, msg3Raw);

                } catch (e) {
                    console.error("Reading Fetch Error", e);
                    await sendWhatsAppMessage(from, d.messages.errorInit);
                }

            } else if (isSummaryReq) {
                // Fetch Summary
                console.log(`[WEBHOOK] User ${from} requested SUMMARY`);

                const userTz = user?.timezone || 'UTC';
                const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: userTz });
                const today = new Date(dateKey);
                const dateStr = new Date().toLocaleDateString('en-US', { timeZone: userTz });
                // Check lang
                const lang = (bibleVersion === 'ABTAG2001') ? 'Tagalog' : (bibleVersion === 'almeida' ? 'Portuguese' : 'English');


                let dailyReflection = await prisma.dailyReflection.findUnique({
                    where: { date_language: { date: dateKey, language: lang } }
                });

                // On-demand fallback
                if (!dailyReflection) {
                    const { generateReflection } = await import('@/lib/gemini');
                    try {
                        const r = await getDailyReadings(today, bibleVersion);
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
                    const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;
                    const finalMsg = formatReflectionMessage(dailyReflection.content, dateStr, link);
                    await sendWhatsAppMessage(from, finalMsg);
                } else {
                    await sendWhatsAppMessage(from, d.messages.reflectionNotReady);
                }

            } else if (isStart) {
                await prisma.user.upsert({
                    where: { phoneNumber: from },
                    update: { whatsappOptIn: true },
                    create: {
                        phoneNumber: from,
                        whatsappOptIn: true,
                        email: `user_${from}@temp.dailyword.space`
                    }
                });
                await sendWhatsAppMessage(from, d.messages.welcome);

            } else if (isStop) {
                await prisma.user.updateMany({
                    where: { phoneNumber: from },
                    data: { whatsappOptIn: false }
                });
                await sendWhatsAppMessage(from, d.messages.unsubscribed);
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Webhook Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
