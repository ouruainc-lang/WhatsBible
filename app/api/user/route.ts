import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { deliveryTime, timezone, bibleVersion, whatsappOptIn, contentPreference, phoneNumber } = body;

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            deliveryTime,
            timezone,
            bibleVersion,
            contentPreference,
            whatsappOptIn,
            phoneNumber
        }
    });

    return NextResponse.json(updatedUser);
}
