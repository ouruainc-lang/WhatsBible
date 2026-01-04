import NextAuth, { type NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
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
                    subject: "Sign in to DailyWord",
                    text: `Sign in to DailyWord: ${url}`,
                    html: `
<body style="background: #f9fafb; padding: 40px 0; font-family: sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e5e7eb;">
    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fbbf24, #f97316); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 24px; font-family: serif; margin: 0 auto 20px auto;">D</div>
    <h1 style="color: #1f2937; font-family: serif; font-size: 28px; margin: 0 0 10px 0; tracking: -0.02em;">DailyWord</h1>
    <p style="color: #6b7280; font-size: 16px; margin: 0 0 30px 0;">Click the button below to sign in to your account.</p>
    <a href="${url}" style="background-color: #111827; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Sign In</a>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>`
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
