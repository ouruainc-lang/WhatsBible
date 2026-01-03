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
                        let mainContent = `📅 *${s.title}*\n\n` +
                            `📖 *Reading 1*: ${s.reading1.reference}\n` +
                            `_${s.reading1.text}_\n\n` +
                            `🎵 *Psalm*: ${s.psalm.reference}\n` +
                            `_${s.psalm.text}_\n\n` +
                            `✨ *Gospel*: ${s.gospel.reference}\n` +
                            `_${s.gospel.text}_\n\n`;

                        // Twilio Limit: 1600. 
                        // Template text: ~60 chars.
                        // Link: ~80 chars.
                        // Safety Buffer: 50 chars.
                        // Max Main Content = 1600 - 60 - 80 - 50 = ~1410.
                        const MAX_MAIN_CONTENT = 1400;

                        if (mainContent.length > MAX_MAIN_CONTENT) {
                            mainContent = mainContent.substring(0, MAX_MAIN_CONTENT) + "...\n\n_(Message truncated due to WhatsApp text limits)_\n\n";
                        }

                        body = mainContent + link;
                    } else {
                        // Fallback
                        const content = readingOfDay;
                        body = `Daily Reading:\n${content.text}\n- ${content.reference}`;
                        logRef = content.reference;
                    }
                } else {
                    const content = verseOfDay;
                    body = `Daily Verse:\n${content.text}\n- ${content.reference}`;
                    logRef = content.reference;
                }

                // Requirement: Meta Cloud API requires TEMPLATES for business-initiated messages (like this cron).
                // We assume the user has created a template named "daily_verse" with 1 parameter {{1}} being the full text.
                // Or "daily_reading" with {{1}} title, {{2}} body.
                // For simplicity MVP: Use one template "daily_grace" with {{1}} as the entire body content.
                // Note: Templates have char limits (header 60, body 1024). Long readings might be truncated.

                // Twilio Content Template Logic
                // We use a generic template "daily_grace" with one variable {{1}} for the body.
                // This allows us to send dynamic long content (up to limits) while being compliant.

                const contentSid = process.env.TWILIO_CONTENT_SID; // New Env Var

                if (contentSid) {
                    await sendWhatsAppTemplate(user.phoneNumber, contentSid, {
                        "1": body
                    });
                } else {
                    // Fallback to direct message (Only works in 24h window or Sandbox)
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
