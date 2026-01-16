import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Stripe } from "stripe";
import { dictionaries, SystemLanguage } from "@/lib/i18n/dictionaries";

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

    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

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
        const session = event.data.object as Stripe.Subscription;
        // Fetch fresh data to ensure we have the absolute latest state (avoids race conditions)
        const subscription = await stripe.subscriptions.retrieve(session.id);

        console.log(`[STRIPE WEBHOOK] Fresh Subscription Fetch: ${subscription.id} | Status: ${subscription.status} | CancelAtPeriodEnd: ${subscription.cancel_at_period_end}`);

        const result = await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                subscriptionStatus: subscription.status,
                stripeCancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        });
        console.log(`[STRIPE WEBHOOK] DB Update Result: ${result.count} records updated for ID ${subscription.id}`);
    }

    if (event.type === "customer.subscription.trial_will_end") {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[STRIPE WEBHOOK] Trial ending soon for ${subscription.id}`);

        const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscription.id }
        });

        if (user && user.phoneNumber) {
            try {
                // Create Billing Portal Session for them to add payment method
                const portalSession = await stripe.billingPortal.sessions.create({
                    customer: user.stripeCustomerId!,
                    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
                });

                // @ts-ignore
                const sysLang = (user.systemLanguage as SystemLanguage) || 'en';
                const msg = dictionaries[sysLang].messages.trialExpiring.replace('{link}', portalSession.url);

                import('@/lib/whatsapp').then(({ sendWhatsAppMessage }) => {
                    sendWhatsAppMessage(user.phoneNumber!, msg).catch(err => console.error("Async send failed", err));
                });
                console.log(`[STRIPE WEBHOOK] Sent trial reminder to ${user.phoneNumber}`);
            } catch (e: any) {
                console.error(`[STRIPE WEBHOOK] Failed to send trial reminder: ${e.message}`);
            }
        } else {
            console.log(`[STRIPE WEBHOOK] User not found or no phone for sub ${subscription.id}`);
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                subscriptionStatus: "canceled",
                stripeCancelAtPeriodEnd: false
            }
        })
    }

    return new NextResponse(null, { status: 200 });
}
