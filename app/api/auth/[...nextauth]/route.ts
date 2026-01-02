import NextAuth, { type NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: async ({ identifier, url, provider }) => {
                // In dev mode or if host is example.com, just log it.
                if (process.env.NODE_ENV === 'development' || (provider.server as any).host === 'smtp.example.com') {
                    console.log("----------------------------------------------");
                    console.log(`✨ Magic Link for ${identifier}: ${url}`);
                    console.log("----------------------------------------------");
                    return;
                }

                // Production: Send actual email using Nodemailer
                const { createTransport } = await import("nodemailer");
                const transport = createTransport(provider.server);
                await transport.sendMail({
                    to: identifier,
                    from: provider.from,
                    subject: "Sign in to WhatsBible",
                    text: `Sign in here: ${url}`,
                    html: `<a href="${url}">Sign in here</a>`
                });
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: '/auth/signin',
        // verifyRequest: '/auth/verify-request', // (Optional) can update this later too
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.stripeCustomerId = user.stripeCustomerId;
            }
            return token;
        },
        session: async ({ session, token }) => {
            console.log(">> SESSION CALLBACK", { session, token });
            if (session?.user && token) {
                // @ts-ignore
                session.user.id = token.id;
                // @ts-ignore
                session.user.stripeCustomerId = token.stripeCustomerId;
            }
            return session;
        },
        signIn: async ({ user, account, profile, email, credentials }) => {
            console.log(">> SIGNIN CALLBACK", { user });
            return true;
        }
    },
    debug: true,
    events: {
        signIn: async (message) => { console.log(">> EVENT: SIGNIN", message) },
        session: async (message) => { console.log(">> EVENT: SESSION", message) },
        createUser: async (message) => { console.log(">> EVENT: CREATEUSER", message) },
        linkAccount: async (message) => { console.log(">> EVENT: LINKACCOUNT", message) },
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
// End of file
