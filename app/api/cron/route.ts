import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '@/lib/whatsapp';
import { getVerseForToday } from '@/lib/verses';

export async function GET(req: Request) {
    // Vercel Cron verification
    // Support both Header (Vercel Cron) and Query Param (Manual Test)
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Get current hour (UTC) or check user's timezone logic.
    // For MVP, we send to everyone who is due at this hour.
    // Logic: Users store `deliveryTime` in HH:MM (24h). And `timezone`.
    // We need to match current UTC time to User's Local Time.

    // Example: Current UTC is 12:00.
    // User A in UTC wants 12:00. (Send now)
    // User B in UTC+1 wants 13:00. (13:00 local is 12:00 UTC. Send now)
    // User C in UTC-5 wants 07:00. (07:00 local is 12:00 UTC. Send now)

    const now = new Date();
    // Pre-fetch both? Or fetch inside loop?
    // Optimization: Fetch both Verse and Reading once.
    // However, readings rotation array is small in current mock.

    // To properly support "get what the user wants", we should fetch inside loop OR fetch both candidates.
    // Let's fetch candidates.

    const { getContentForToday } = await import('@/lib/verses');
    const verseOfDay = await getContentForToday('VER');
    const readingOfDay = await getContentForToday('RDG');

    // Complex query: Find users where (deliveryTimeHour = (currentUtcHour + timezoneOffset) % 24)
    // But timezone is a string "UTC", "America/New_York".
    // Hard to query DB directly unless we store offset.
    // Better strategy for MVP small scale: Fetch all active users, filter in JS.
    // Or store `nextDeliveryAt` (UTC) and query that.

    // Optimization: Store `deliveryTimeUtc` updated when timezone changes.
    // But let's do JS filter for < 10k users is "okay" but risky.
    // For "instructions for scaling to 10k+", we'd suggest a worker queue.
    // Here we will do: Fetch users with subscriptionStatus='active'.

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { subscriptionStatus: 'active' },
                { subscriptionStatus: 'trial' }
            ],
            whatsappOptIn: true,
            phoneNumber: { not: null }
        }
    });

    console.log(`[CRON] Started. System Time (UTC): ${now.toISOString()}`);
    console.log(`[CRON] Found ${users.length} active/trial users.`);

    let sentCount = 0;

    for (const user of users) {
        if (!user.phoneNumber) {
            console.log(`[CRON] User ${user.id} skipped (No Phone)`);
            continue;
        }

        // Check time
        // We need to convert current UTC to user timezone.
        const userTime = new Date().toLocaleTimeString('en-US', { timeZone: user.timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
        console.log(`[CRON] Checking User ${user.id} (${user.email}). User Delivery: ${user.deliveryTime}, Calculated Local: ${userTime}, Timezone: ${user.timezone}`);

        // Check for force override
        // Check for force override
        // const { searchParams } = new URL(req.url); // Already parsed at top
        const force = searchParams.get('force');

        // STRICT Equality Check (unless forced)
        if (force === 'true' || userTime === user.deliveryTime) {
            console.log(`[CRON] MATCH (or FORCED)! Sending to ${user.id} (${user.phoneNumber})...`);
            // Check if already sent today? `VerseLog`.
            // Simple prevention: `VerseLog` with `createdAt` > today start.

            try {
                const isReading = user.contentPreference === 'RDG';
                let body = "";
                let logRef = "";

                // Helper to flatten text for single variable usage
                const cleanText = (text: string) => text.replace(/\n+/g, ' ').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();

                if (isReading) {
                    const r = readingOfDay as any;
                    const dateStr = new Date().toLocaleDateString('en-CA');
                    const link = `Read full: ${process.env.NEXTAUTH_URL}/readings/${dateStr}`;

                    if (r.structure) {
                        const s = r.structure;
                        logRef = s.title;

                        // Construct flattened single string
                        body = `📖 ${s.reading1.reference} - ${s.reading1.text.substring(0, 200)}...  ` +
                            `🎵 ${s.psalm.reference} - ${s.psalm.text.substring(0, 100)}...  ` +
                            `✨ ${s.gospel.reference} - ${s.gospel.text.substring(0, 300)}...  ` +
                            link;
                    } else {
                        const content = readingOfDay as any;
                        body = `Daily Readings: ${content.text.substring(0, 500)}... - ${link}`;
                        logRef = "Legacy Reading";
                    }
                } else if (user.contentPreference === 'REF') {
                    // AI Summary & Reflection
                    const dateKey = new Date().toLocaleDateString('en-CA');
                    const link = `Read full: ${process.env.NEXTAUTH_URL}/readings/${dateKey}`;

                    // Check Cache
                    let dailyReflection = await prisma.dailyReflection.findUnique({
                        where: { date: dateKey }
                    });

                    // Handle String or JSON content in DB
                    let stringContent = "";
                    if (dailyReflection) {
                        try {
                            const parsed = JSON.parse(dailyReflection.content);
                            // If it's our recent JSON format, convert back to string
                            const theWord = parsed.the_word || parsed.theme || "Daily Word";
                            const refBody = parsed.reflection || parsed.summary || "";
                            const prayer = parsed.prayer || "";
                            stringContent = `🕊️ ${theWord}  ${refBody}  🙏 ${prayer}`;
                        } catch (e) {
                            // Already a string
                            stringContent = dailyReflection.content;
                        }
                    }

                    if (!stringContent) {
                        console.log(`[CRON] Generating new AI Reflection for ${dateKey}...`);
                        const { generateReflection } = await import('@/lib/gemini');
                        const r = readingOfDay as any;

                        if (r && r.structure) {
                            const readingsForAi = { ...r.structure, date: dateKey };
                            const generated = await generateReflection(readingsForAi); // Now returns string

                            if (generated) {
                                stringContent = generated;
                                await prisma.dailyReflection.upsert({
                                    where: { date: dateKey },
                                    update: { content: generated },
                                    create: { date: dateKey, content: generated }
                                });
                            }
                        }
                    }

                    if (stringContent) {
                        body = stringContent + "  " + link;
                        logRef = "AI Reflection";
                    } else {
                        body = "Daily Word unavailable today.  " + link;
                        logRef = "AI Error";
                    }
                } else {
                    // Verse (VER)
                    const content = verseOfDay as any;
                    body = `Daily Verse: ${content.text} - ${content.reference}`;
                    logRef = content.reference;
                }

                // Send Template with Single Variable
                let contentSid = "";
                if (user.contentPreference === 'REF') {
                    contentSid = process.env.WHATSAPP_TEMPLATE_DAILY_SUMMARY || "HXdf5175cdd347ac573a02a4bceb2ee3b6";
                } else {
                    contentSid = process.env.WHATSAPP_TEMPLATE_DAILY_GRACE || "HXf97c82b65e0c331ffa54a7b74432465c";
                }

                if (contentSid) {
                    // STRICT SANITIZATION IS REQUIRED for single-variable templates to avoid 21656
                    const safeBody = cleanText(body).substring(0, 1000); // safety cap
                    console.log(`[CRON] Sending Single-Var Template ${contentSid} (len: ${safeBody.length})`);

                    await sendWhatsAppTemplate(user.phoneNumber, contentSid, {
                        "1": safeBody
                    });
                } else {
                    await sendWhatsAppMessage(user.phoneNumber, body);
                }

                await prisma.verseLog.create({
                    data: { userId: user.id, verseRef: logRef, status: 'success' }
                });
                sentCount++;
            } catch (e) {
                console.error(`Failed to send to ${user.id}`, e);
            }
        }
    }

    return NextResponse.json({ sent: sentCount, message: 'Cron processed' });
}
