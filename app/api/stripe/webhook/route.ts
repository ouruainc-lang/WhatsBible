import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Stripe } from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }

        // If it's a subscription mode checkout
        if (session.mode === "subscription" && session.subscription) {
            const subscriptionId = session.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await prisma.user.update({
                where: {
                    id: session.metadata.userId,
                },
                data: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    subscriptionStatus: "active",
                },
            });
        }
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as any;

        // Only handle subscription invoices
        if (invoice.subscription) {
            const subscriptionId = typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription.id;

            await prisma.user.updateMany({
                where: {
                    stripeSubscriptionId: subscriptionId,
                },
                data: {
                    subscriptionStatus: "active",
                },
            });
        }
    }

    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                subscriptionStatus: subscription.status,
                stripeCancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        })
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { subscriptionStatus: "canceled" }
        })
    }

    return new NextResponse(null, { status: 200 });
}
