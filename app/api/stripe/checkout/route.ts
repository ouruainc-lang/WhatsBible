import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user;

        if (!user || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { priceId, isTrial } = body;
        // isTrial depends on logic - maybe force trial if not subscribed before?

        const checkoutSession = await stripe.checkout.sessions.create({
            customer_email: user.email,
            // mode: 'subscription', // inferred from price
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id as string, // Ensure ID is present
            },
            subscription_data: {
                trial_period_days: isTrial ? 7 : undefined,
            },
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.log("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
