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

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                // subscriptionStatus: "active", // Logic depends on payment_status?
                // Actually better to rely on `customer.subscription.created` or `updated`
                // But checkout.session.completed is good for initial link.
                // We will wait for `invoice.payment_succeeded` or `customer.subscription.updated` for status.
                // But for immediate feedback, we can set it.
                subscriptionStatus: "active",
            },
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        await prisma.user.update({
            where: {
                stripeSubscriptionId: subscription.id,
            },
            data: {
                subscriptionStatus: "active",
                // trialStartDate: ... if trial
            },
        });
    }

    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle status changes (active, past_due, canceled)
        await prisma.user.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { subscriptionStatus: subscription.status }
        })
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { subscriptionStatus: "canceled" }
        })
    }

    return new NextResponse(null, { status: 200 });
}
