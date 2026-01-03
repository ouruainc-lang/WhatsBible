import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '@/lib/whatsapp';
import { getVerseForToday } from '@/lib/verses';

export async function GET(req: Request) {
    // Vercel Cron verification
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // In production uncomment this. For dev/demo we might skip or use header.
        // return new NextResponse('Unauthorized', { status: 401 });
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

    let sentCount = 0;

    for (const user of users) {
        if (!user.phoneNumber) continue;

        // Check time
        // We need to convert current UTC to user timezone.
        const userTime = new Date().toLocaleTimeString('en-US', { timeZone: user.timezone, hour12: false, hour: '2-digit', minute: '2-digit' });
        // userTime is "08:00"

        if (userTime === user.deliveryTime) {
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

                        body = `📅 *${s.title}*\n\n` +
                            `📖 *Reading 1*: ${s.reading1.reference}\n` +
                            `🎵 *Psalm*: ${s.psalm.reference}\n` +
                            `✨ *Gospel*: ${s.gospel.reference}\n\n` +
                            `*Gospel*: _${s.gospel.text}_\n\n` +
                            `Read full: https://bible.usccb.org/bible/readings/${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '')}.cfm`;

                        // Truncate if too long (simple check)
                        if (body.length > 1550) {
                            body = body.substring(0, 1550) + "...";
                        }
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

                // TEMPORARY OVERRIDE: User requested to test without Templates (due to review delay).
                // WARNING: This ONLY works if the user has messaged the bot in the last 24 hours.
                await sendWhatsAppMessage(user.phoneNumber, body);

                /* 
                // Template Logic (Restore this once approved)
                const templateBodyParam = body; 
                await sendWhatsAppTemplate(user.phoneNumber, "daily_message", "en_US", [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: templateBodyParam }
                        ]
                    }
                ]);
                */

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
