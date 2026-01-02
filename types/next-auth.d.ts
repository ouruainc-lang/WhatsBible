import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            stripeCustomerId?: string | null
            stripeSubscriptionId?: string | null
        } & DefaultSession["user"]
    }
}
