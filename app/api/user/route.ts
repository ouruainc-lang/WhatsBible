import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { deliveryTime, timezone, bibleVersion, whatsappOptIn, contentPreference, phoneNumber } = body;

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });

    const updateData: any = {
        deliveryTime,
        timezone,
        bibleVersion,
        contentPreference,
        whatsappOptIn,
    };

    // Only update phone number if it's explicitly provided and different
    // STRICT MODE: Phone number can ONLY be updated via verify-phone verification process.
    // We ignore any phoneNumber updates sent to this generic settings endpoint.
    /* 
    if (phoneNumber !== undefined && phoneNumber !== currentUser?.phoneNumber) {
        updateData.phoneNumber = phoneNumber;
        updateData.whatsappOptIn = false; // Force disable if number changes
        updateData.phoneVerificationCode = null; // Invalidate 'VERIFIED' status
    }
    */

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData
    });

    return NextResponse.json(updatedUser);
}
