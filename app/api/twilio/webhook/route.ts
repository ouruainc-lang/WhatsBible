import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, formatTruncatedMessage, formatReflectionMessage, sendSplitWhatsAppMessage } from '@/lib/whatsapp';
import { getDailyReadings } from '@/lib/lectionary';
import { dictionaries, SystemLanguage } from '@/lib/i18n/dictionaries';

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
        const isReadingReq = ['READING', 'FULL READING', 'READINGS', 'LEITURA COMPLETA', 'BUONG PAGBABASA'].includes(text);
        const isSummaryReq = ['SUMMARY', 'REFLECTION', 'DAILY REFLECTION', 'WORD', 'SUMMARY & REFLECTION', 'RESUMO & REFLEXÃO', 'BUOD AT PAGNINILAY'].includes(text);

        // Fetch User Globally
        const user = await prisma.user.findFirst({
            where: { phoneNumber: cleanPhone }
        });
        // @ts-ignore
        const sysLang: SystemLanguage = (user?.systemLanguage as SystemLanguage) || 'en';
        const d = dictionaries[sysLang];

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
                console.log(`[TWILIO] START received from UNREGISTERED number: ${cleanPhone}`);
                // Default to English for unregistered users as we don't know their language preference yet
                const notRegisteredMsg = dictionaries['en'].messages.notRegistered.replace('{url}', process.env.NEXTAUTH_URL!);
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
                    const welcomeMsg = d.messages.welcomeOnboarding.replace('{dashboardUrl}', `${process.env.NEXTAUTH_URL}/dashboard`);
                    await sendWhatsAppMessage(cleanPhone, welcomeMsg);
                } else {
                    // Resuming from Pause/Stop
                    await sendWhatsAppMessage(cleanPhone, d.messages.resumed);
                }
            }
        }
        else if (text === 'NO-OTP' || text === 'NO OTP') {
            console.log(`[TWILIO] User sent NO-OTP to open session: ${cleanPhone}`);
            const noOtpMsg = d.messages.noOtpMessage.replace('{dashboardUrl}', `${process.env.NEXTAUTH_URL}/dashboard`);
            await sendWhatsAppMessage(cleanPhone, noOtpMsg);
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
                // Use User's Timezone
                const userTz = user?.timezone || 'UTC';
                const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: userTz });
                const today = new Date(dateKey); // Treat as UTC 00:00 to preserve YYYY-MM-DD components
                const dateStr = new Date().toLocaleDateString('en-US', { timeZone: userTz });

                const r = await getDailyReadings(today, user?.bibleVersion || 'NABRE');
                const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

                // 1. Reading 1 (Send first)
                const msg1Raw = `*${d.messages.readingHeader} ${dateStr}*\n\n📖 *${d.messages.reading1}*\n${r.reading1.reference}\n${r.reading1.text}`;
                await sendSplitWhatsAppMessage(cleanPhone, msg1Raw);
                await delay(2000); // Wait 2s to ensure order

                // 2. Psalm
                const msgPsalmRaw = `🎵 *${d.messages.psalm}*\n${r.psalm.reference}\n${r.psalm.text}`;
                await sendSplitWhatsAppMessage(cleanPhone, msgPsalmRaw);
                await delay(2000);

                // 3. Reading 2 (Optional)
                if (r.reading2) {
                    const msg2Raw = `📜 *${d.messages.reading2}*\n${r.reading2.reference}\n${r.reading2.text}`;
                    await sendSplitWhatsAppMessage(cleanPhone, msg2Raw);
                    await delay(2000);
                }

                // 4. Gospel & Link
                const msg3 = `✨ *${d.messages.gospel}*\n${r.gospel.reference}\n${r.gospel.text}\n\n${d.messages.readFull}: ${link}\n\n${d.messages.replyAmen}`;
                await sendSplitWhatsAppMessage(cleanPhone, msg3);
            } catch (e) {
                console.error("Reading Fetch Error", e);
                await sendWhatsAppMessage(cleanPhone, d.messages.errorInit);
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
            // Use User's Timezone
            const userTz = user?.timezone || 'UTC';
            const dateKey = new Date().toLocaleDateString('en-CA', { timeZone: userTz });
            const today = new Date(dateKey);
            const dateStr = new Date().toLocaleDateString('en-US', { timeZone: userTz });

            const link = `${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

            const lang = (user?.bibleVersion === 'ABTAG2001') ? 'Tagalog' : (user?.bibleVersion === 'almeida' ? 'Portuguese' : 'English');

            let dailyReflection = await prisma.dailyReflection.findUnique({
                where: { date_language: { date: dateKey, language: lang } }
            });

            // On-demand fallback
            if (!dailyReflection) {
                const { generateReflection } = await import('@/lib/gemini');
                const { getDailyReadings } = await import('@/lib/lectionary');
                try {
                    const r = await getDailyReadings(today, user?.bibleVersion || 'NABRE');
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
                await sendWhatsAppMessage(cleanPhone, finalMsg);
            } else {
                await sendWhatsAppMessage(cleanPhone, d.messages.reflectionNotReady);
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
