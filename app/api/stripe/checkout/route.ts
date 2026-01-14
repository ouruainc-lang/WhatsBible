import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user;

        if (!user || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { plan, isTrial } = body;

        // Resolve Price ID Server-Side
        let priceId = "";
        if (plan === 'YEARLY') {
            priceId = process.env.STRIPE_PRICE_ID_YEARLY || "price_1Sm2meATeOcXXq6dvYfXwXqf";
        } else {
            // Default to MONTHLY
            priceId = process.env.STRIPE_PRICE_ID_MONTHLY || "price_1Sm2miATeOcXXq6d2rlX3aFM";
        }

        // Fetch user from DB to get stripeCustomerId
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        const hasUsedTrial = !!dbUser?.stripeSubscriptionId;

        let checkoutOptions: any = {
            mode: 'subscription',
            allow_promotion_codes: true,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id as string,
            },
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
        };

        // Only offer trial if user has never subscribed before
        if (!hasUsedTrial) {
            checkoutOptions.subscription_data = {
                trial_period_days: 7,
            };
            // Allow trial without credit card
            if (body.isTrial) {
                checkoutOptions.payment_method_collection = 'if_required';
            }
        }

        if (dbUser?.stripeCustomerId) {
            checkoutOptions.customer = dbUser.stripeCustomerId;
        } else {
            checkoutOptions.customer_email = user.email;
        }

        const checkoutSession = await stripe.checkout.sessions.create(checkoutOptions);

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.log("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
