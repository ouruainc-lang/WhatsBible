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
            phoneNumber: { not: null },
            deliveryStatus: 'active'
        }
    });

    console.log(`[CRON] Started. System Time (UTC): ${now.toISOString()}`);
    console.log(`[CRON] Found ${users.length} active users.`);

    let sentCount = 0;

    for (const user of users) {
        if (!user.phoneNumber) {
            console.log(`[CRON] User ${user.id} skipped (No Phone)`);
            continue;
        }

        // Compliance Check: Verifying Usage Window
        // PRODUCTION MODE: 24 Hours Total Window. Warning at 23 Hours.
        // @ts-ignore
        const lastMsg = user.lastUserMessageAt ? new Date(user.lastUserMessageAt) : new Date(0);
        const diffMs = now.getTime() - lastMsg.getTime();
        const minutesSinceLastMsg = diffMs / (1000 * 60);

        // 1. Hard Stop: > 24 Hours (1440 mins) -> Pause
        if (minutesSinceLastMsg > (24 * 60)) {
            console.log(`[CRON] User ${user.id} PAUSED (Window Expired). Last Msg: ${lastMsg.toISOString()}`);
            await prisma.user.update({
                where: { id: user.id },
                data: { deliveryStatus: 'paused_inactive' }
            });
            continue;
        }

        // Check time
        // We need to convert current UTC to user timezone.
        const userTime = new Date().toLocaleTimeString('en-US', { timeZone: user.timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
        console.log(`[CRON] Checking User ${user.id} (${user.email}). User Delivery: ${user.deliveryTime}, Calculated Local: ${userTime}, Timezone: ${user.timezone}`);

        // Check for force override
        // const { searchParams } = new URL(req.url); // Already parsed at top
        const force = searchParams.get('force');

        // STRICT Equality Check (unless forced)
        if (force === 'true' || userTime === user.deliveryTime) {
            console.log(`[CRON] MATCH (or FORCED)! Sending to ${user.id} (${user.phoneNumber})...`);
            // Check if already sent today? `VerseLog`.
            // Simple prevention: `VerseLog` with `createdAt` > today start.

            try {
                // 1. Ensure AI content is pre-warmed (Cached)
                // We check this for every user to ensure availability, but effectively it runs once per day.
                const dateKey = new Date().toLocaleDateString('en-CA');
                const existingReflection = await prisma.dailyReflection.findUnique({
                    where: { date: dateKey }
                });

                if (!existingReflection) {
                    console.log(`[CRON] Pre-warming AI Reflection for ${dateKey}...`);
                    const { generateReflection } = await import('@/lib/gemini');
                    const r = readingOfDay as any;

                    if (r && r.structure) {
                        const readingsForAi = { ...r.structure, date: dateKey };
                        try {
                            const generated = await generateReflection(readingsForAi);
                            if (generated) {
                                await prisma.dailyReflection.create({
                                    data: { date: dateKey, content: generated }
                                });
                                console.log("[CRON] AI Reflection generated and cached.");
                            }
                        } catch (err) {
                            console.error("Failed to generate AI reflection", err);
                        }
                    }
                }

                // 2. Send the "Content Ready" Utility Template
                // This template has buttons: "📖 Full Reading" and "✍️ Summary & Reflection"
                const contentSid = process.env.WHATSAPP_TEMPLATE_CONTENT_READY;

                if (contentSid) {
                    console.log(`[CRON] Sending Notification Template ${contentSid} to ${user.phoneNumber}`);
                    await sendWhatsAppTemplate(user.phoneNumber, contentSid, {});

                    // Log & Update Last Delivery
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastDeliveryAt: new Date() }
                    });

                    await prisma.verseLog.create({
                        data: { userId: user.id, verseRef: "NOTIFICATION", status: 'success' }
                    });
                    sentCount++;
                } else {
                    console.error("MISSING ENV: WHATSAPP_TEMPLATE_CONTENT_READY");
                }
            } catch (e) {
                console.error(`Failed to send to ${user.id}`, e);
            }
        }
    }

    return NextResponse.json({ sent: sentCount, message: 'Cron processed' });
}
