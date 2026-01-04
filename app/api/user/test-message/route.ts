
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

        const contentSid = process.env.TWILIO_CONTENT_SID;
        if (!contentSid) {
            return new NextResponse('Twilio Content SID not configured', { status: 500 });
        }

        // Send a sample message
        const body = `👋 This is a TEST message from DailyWord!\n\nYour specific daily delivery is scheduled for ${user.deliveryTime} (User Time).\n\nBlessings!`;

        await sendWhatsAppTemplate(user.phoneNumber, contentSid, {
            "1": body
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Test Message Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
