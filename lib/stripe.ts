import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover' as any, // Cast to any or literal if types are strict
    typescript: true,
});
