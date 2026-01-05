
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTemplate } from '@/lib/whatsapp';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user?.phoneNumber || !user.whatsappOptIn) {
            return new NextResponse('Phone not verified or opted in', { status: 400 });
        }

        // Rate Limit: 1 per 24 hours
        if (user.lastTestMessageSentAt) {
            const now = new Date();
            const lastSent = new Date(user.lastTestMessageSentAt);
            const diffInHours = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

            if (diffInHours < 24) {
                return new NextResponse(`You can only send one test message per day. Please try again later.`, { status: 429 });
            }
        }

        const contentSid = process.env.TWILIO_CONTENT_SID;
        // NOTE: We should use the new configurable Env Vars here too if applicable, but user didn't mention changing this one.
        // Actually, user said "CONTENT_SID only for 1". 
        // I will stick to existing logic for content SID but update the usage.

        // Wait, the user said "right now its just CONTENT_SID only for 1" implying they want to use Env Vars for templates.
        // But for *test* message, passing body "1" works if using a template that accepts variable "1".
        // The current test message logic sends a custom body in variable "1".
        // We need a Template ID for the test message? 
        // The code uses `process.env.TWILIO_CONTENT_SID`.
        // I should probably leave this unless user provided a specific test template.
        // User didn't provide a test template. I'll assume existing setup works or uses one of the others? 
        // Existing code: `const contentSid = process.env.TWILIO_CONTENT_SID;`

        if (!contentSid) {
            // Fallback or error? 
            return new NextResponse('Twilio Content SID not configured', { status: 500 });
        }

        // Send a sample message
        const body = `👋 This is a TEST message from DailyWord!\n\nYour specific daily delivery is scheduled for ${user.deliveryTime} (User Time).\n\nBlessings!`;

        await sendWhatsAppTemplate(user.phoneNumber, contentSid, {
            "1": body
        });

        // Update Timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastTestMessageSentAt: new Date() }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Test Message Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
