import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            stripeCustomerId?: string | null
            stripeSubscriptionId?: string | null
            subscriptionStatus: string // inactive, active, trial, past_due
            whatsappOptIn: boolean
            phoneNumber?: string | null
        } & DefaultSession["user"]
    }
}
