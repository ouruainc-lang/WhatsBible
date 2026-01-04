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

                if (isReading) {
                    const r = readingOfDay as any; // Cast to access structure
                    if (r.structure) {
                        // Construct a message with multiple parts
                        const s = r.structure;
                        logRef = s.title;

                        // Strategy: Send Gospel primarily? Or Listing? 
                        // Twilio body limit ~1600.
                        // Let's try to fit references and links or short snippets.

                        // Example: 
                        // Daily Readings: [Title]
                        // 1: [Ref]
                        // Ps: [Ref]
                        // Gospel: [Ref]
                        // [Gospel Text]

                        const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
                        const link = `Read the full readings: ${process.env.NEXTAUTH_URL}/readings/${dateStr}`;

                        // Construct body WITHOUT link first
                        // Header is now in template, so we remove the title line
                        let mainContent = `📖 *Reading 1*: ${s.reading1.reference}\n` +
                            `_${s.reading1.text}_\n\n` +
                            `🎵 *Psalm*: ${s.psalm.reference}\n` +
                            `_${s.psalm.text}_\n\n`;

                        if (s.reading2) {
                            mainContent += `📜 *Reading 2*: ${s.reading2.reference}\n` +
                                `_${s.reading2.text}_\n\n`;
                        }

                        mainContent += `✨ *Gospel*: ${s.gospel.reference}\n` +
                            `_${s.gospel.text}_\n\n`;

                        // Twilio Limit: 1600. 
                        const MAX_MAIN_CONTENT = 1000;

                        if (mainContent.length > MAX_MAIN_CONTENT) {
                            mainContent = mainContent.substring(0, MAX_MAIN_CONTENT) + "...\n\n_(Message truncated due to WhatsApp text limits)_\n\n";
                        }

                        body = mainContent + link;
                    } else {
                        // Fallback
                        const content = readingOfDay as any;
                        body = `Daily Reading:\n${content.text}\n- ${content.reference}`;
                        logRef = content.reference;
                    }
                } else if (user.contentPreference === 'REF') {
                    // AI Summary & Reflection
                    const dateKey = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

                    // Check Cache
                    let dailyReflection = await prisma.dailyReflection.findUnique({
                        where: { date: dateKey }
                    });

                    if (!dailyReflection) {
                        console.log(`[CRON] Generating new AI Reflection for ${dateKey}...`);
                        // We need the readings to generate reflection
                        const { generateReflection } = await import('@/lib/gemini');
                        const r = readingOfDay as any;

                        if (r && r.structure) {
                            // Inject the date into the structure to match DailyReading interface
                            const readingsForAi = {
                                ...r.structure,
                                date: dateKey
                            };

                            const generated = await generateReflection(readingsForAi);

                            // Safety Truncation for WhatsApp (1600 limit)
                            // Reserve ~200 chars for link and potential overhead
                            const MAX_AI_CHARS = 1400;
                            let finalContent = generated;

                            if (finalContent.length > MAX_AI_CHARS) {
                                console.warn(`[CRON] AI content too long (${finalContent.length}), truncating...`);
                                finalContent = finalContent.substring(0, MAX_AI_CHARS) + "... (truncated)";
                            }

                            const link = `Read full: ${process.env.NEXTAUTH_URL}/readings/${dateKey}`;
                            const contentWithLink = finalContent + "\n\n" + link;

                            dailyReflection = await prisma.dailyReflection.create({
                                data: {
                                    date: dateKey,
                                    content: contentWithLink
                                }
                            });
                        } else {
                            // Fallback if no readings available to summarize
                            body = "Daily Readings unavailable for summary today.";
                            console.warn("[CRON] No readings available for AI summary.");
                        }
                    }

                    if (dailyReflection) {
                        body = dailyReflection.content;
                        logRef = "AI Reflection";
                    }
                } else {
                    const content = verseOfDay;
                    body = `Daily Verse:\n${content.text}\n- ${content.reference}`;
                    logRef = content.reference;
                }

                // Twilio Content Template Logic
                // Select template based on content type
                // RDG (Full Reading) -> daily_gracev1 (HXdad1fd6bc3c7a3f61ddeebd5503f78ef)
                // REF (AI Summary) -> daily_summary (HXc0a9637c3026696156c1409ee41f86a7)

                let contentSid = "";
                if (user.contentPreference === 'REF') {
                    contentSid = "HXc0a9637c3026696156c1409ee41f86a7";
                } else {
                    contentSid = "HXdad1fd6bc3c7a3f61ddeebd5503f78ef";
                }

                if (contentSid) {
                    await sendWhatsAppTemplate(user.phoneNumber, contentSid, {
                        "1": body
                    });
                } else {
                    // Fallback should not happen if hardcoded above, but good for safety
                    console.log("[CRON] No Content SID, using direct message fallback.");
                    await sendWhatsAppMessage(user.phoneNumber, body);
                }

                // Log
                await prisma.verseLog.create({
                    data: {
                        userId: user.id,
                        verseRef: logRef,
                        status: 'success'
                    }
                });
                sentCount++;
            } catch (e) {
                console.error(`Failed to send to ${user.id}`, e);
            }
        }
    }

    return NextResponse.json({ sent: sentCount, message: 'Cron processed' });
}
