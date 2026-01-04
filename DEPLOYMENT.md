# 🚀 Master Deployment Guide: WhatsBible

This guide will walk you through setting up every service required to take **WhatsBible** to production.

---

## Phase 1: Accounts & Prerequisites

Before we deploy, ensure you have accounts with these services:
1.  **GitHub**: To host your code.
2.  **Vercel**: To host the website (Free "Hobby" tier).
3.  **Supabase** (or Neon/Railway): For the PostgreSQL Database.
4.  **Stripe**: For payments.
5.  **Twilio**: For sending WhatsApp messages.
6.  **Resend** (Recommended): For sending "Magic Link" emails for login.

---

## Phase 2: Database Setup (Supabase)

1.  Log in to [Supabase](https://supabase.com/).
2.  **Create Project**: Name it "dailyword-prod" (or similar).
3.  **Get Connection String**:
    *   Go to `Settings` (cog icon) → `Database`.
    *   Under "Connection String", select `Node.js`.
    *   Copy the URL. It looks like: `postgres://postgres.xxxx:password@aws-0-us...:5432/postgres`
    *   *Save this for Phase 6.*

---

## Phase 3: Auth & Email (Resend)

NextAuth needs an SMTP server to send magic links. [Resend](https://resend.com) is the easiest free option (100 emails/day).

1.  Log in to [Resend](https://resend.com).
2.  **Add Domain**: Use your custom domain: `dailyword.space`.
3.  **Create API Key**:
    *   Go to `API Keys` → `Create API Key`.
    *   Name it "production".
    *   Copy the key (starts with `re_`).
4.  **SMTP Settings** (These will be used in ENV variables):
    *   Host: `smtp.resend.com`
    *   Port: `465` (Secure)
    *   User: `resend`
    *   Password: `[YOUR_API_KEY]`
    *   From: `hello@dailyword.space` (or `login@dailyword.space`).

---

## Phase 4: Payments (Stripe)

1.  Log in to [Stripe Dashboard](https://dashboard.stripe.com/).
2.  **Create Product**:
    *   Go to `Products` → `Add Product`.
    *   Name: "DailyWord Monthly" / "DailyWord Yearly".
    *   Set Pricing (e.g., $4.99 Recurring Monthly).
    *   **Copy the Price ID** (starts with `price_...`). You need this for the code (or update the code to fetch dynamically).
3.  **Get API Keys**:
    *   Go to `Developers` → `API keys`.
    *   Copy **Publishable Key** (`pk_live_...`).
    *   Copy **Secret Key** (`sk_live_...`).
4.  **Setup Webhook**:
    *   *You will do this AFTER deploying to Vercel (Phase 6), because you need the URL.*

---

## Phase 5: Messaging (Twilio WhatsApp)

1.  Log in to [Twilio Console](https://console.twilio.com/).
2.  **Get Credentials**:
    *   Copy **Account SID**.
    *   Copy **Auth Token**.
3.  **Setup Sandbox (Test)**:
    *   Go to Messaging -> Try it out -> Send a WhatsApp message.
    *   Activate your sandbox number.
    *   **CRITICAL**: You must send the "join code" (e.g., `join something-word`) from your phone to the Sandbox Number. This authorizes the bot to message you (24h window).
4.  **Production (Optional)**:
    *   Once your business profile is approved, you can use a distinct Sender ID.
    *   For testing/MVP, the Sandbox is sufficient.

## Phase 5.5: Creating Twilio Content Template (Required for Cron)

To send daily messages without the user messaging you first (24h window), you MUST use a Template.

1.  Go to **Twilio Console** -> **Messaging** -> **Content Template Builder**.
2.  **Create New Template**:
    *   Name: `daily_gracev2`
    *   Select **WhatsApp**.
    *   Content Type: **Text**.
    *   Body: `Here is your Daily Grace:`
        `{{1}}`
        `Blessings, DailyWord Team`
3.  **Save & Submit**:
    *   It typically gets approved instantly (for test/production).
4.  **Copy Content SID**:
    *   It looks like `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
    *   **Add this to Vercel Environment Variables** as `TWILIO_CONTENT_SID`.

---

## Phase 6: Vercel Deployment

1.  **Push to GitHub**: Ensure your latest code is pushed.
2.  Log in to [Vercel](https://vercel.com).
3.  **Add New Project**: Import `WhatsBible` from GitHub.
4.  **Environment Variables**:
    Expand the "Environment Variables" section and add ALL of these:

    | Key | Value Source |
    | :--- | :--- |
    | `DATABASE_URL` | Supabase Pooler (Port 6543) + `?pgbouncer=true&connection_limit=1` |
    | `DIRECT_URL` | Supabase Direct (Port 5432) |
    | `NEXTAUTH_URL` | `https://dailyword.space` (Your Custom Domain) |
    | `NEXTAUTH_SECRET` | Generate random: `openssl rand -base64 32` |
    | `STRIPE_SECRET_KEY` | Stripe Secret Key (Phase 4) |
    | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key (Phase 4) |
    | `STRIPE_WEBHOOK_SECRET` | *Leave empty for now, see Phase 7* |
    | `TWILIO_ACCOUNT_SID` | Twilio Console (Phase 5) |
    | `TWILIO_AUTH_TOKEN` | Twilio Console (Phase 5) |
    | `TWILIO_PHONE_NUMBER` | Sandbox Number (e.g. `+14155238886`) |
    | `TWILIO_CONTENT_SID` | Content Template Builder (Phase 5.5) |
    | `EMAIL_SERVER_HOST` | `smtp.resend.com` |
    | `EMAIL_SERVER_PORT` | `465` |
    | `EMAIL_SERVER_USER` | `resend` |
    | `EMAIL_SERVER_PASSWORD` | Resend API Key (Phase 3) |
    | `EMAIL_FROM` | `onboarding@resend.dev` |
    | `CRON_SECRET` | Generate a random string (e.g. `MySecureCronSecret123`) |

5.  **Deploy**: Click **Deploy**.

---

## Phase 7: Post-Deployment Configuration

Once Vercel finishes deploying and gives you a URL (e.g., `https://whatsbible.vercel.app`):

1.  **Database Migration**:
    *   Vercel might fail initially if tables don't exist.
    *   Go to Vercel Project -> Settings -> General -> **Build & Development Settings**.
    *   Change **Build Command** to: `npx prisma db push && next build`
    *   *(Note: We use `db push` instead of `migrate deploy` to avoid SQLite/Postgres protocol mismatch).*
    *   Redeploy if needed.

2.  **Stripe Webhook**:
    *   Go back to [Stripe Webhooks](https://dashboard.stripe.com/webhooks).
    *   Add Endpoint: `https://dailyword.space/api/stripe/webhook`
    *   Select events: 
        *   `checkout.session.completed`
        *   `invoice.payment_succeeded`
        *   `customer.subscription.updated`
        *   `customer.subscription.deleted` (CRITICAL for cancellations)
    *   **Copy Signing Secret** (`whsec_...`).
    *   Go to Vercel -> Settings -> Environment Variables.
    *   Add `STRIPE_WEBHOOK_SECRET` with this value.
    *   Redeploy for it to take effect.

3.  **Twilio Webhook (Optional)**:
    *   For incoming messages (like "STOP"), you can set the webhook in Twilio Console -> Messaging -> Senders -> WhatsApp Settings to:
    *   `https://dailyword.space/api/whatsapp/webhook`

4.  **Cron Job**:
    *   Go to Vercel Dashboard -> Project -> **Cron Jobs**.
    *   You should see `/api/cron` scheduled hourly.

---

## Phase 8: Verification

1.  **Test Login**: Go to your URL -> Dashboard -> Sign In. Check if you get the email.
2.  **Test Update**: Save your phone number in Settings.
3.  **Test Cron**:
    *   Manually invoke the cron job via Vercel Dashboard or curl:
    *   **Standard**: `curl "https://dailyword.space/api/cron?secret=[YOUR_CRON_SECRET]"`
    *   **Force Manual Trigger** (Bypass Time Check):
        *   Visit: `https://dailyword.space/api/cron?force=true`
        *   This sends messages to ALL active users immediately, regardless of their scheduled time.

**🚀 You are Live!**
