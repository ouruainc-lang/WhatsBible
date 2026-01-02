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
2.  **Create Project**: Name it "whatsbible-prod".
3.  **Get Connection String**:
    *   Go to `Settings` (cog icon) → `Database`.
    *   Under "Connection String", select `Node.js`.
    *   Copy the URL. It looks like: `postgres://postgres.xxxx:password@aws-0-us...:5432/postgres`
    *   *Save this for Phase 6.*

---

## Phase 3: Auth & Email (Resend)

NextAuth needs an SMTP server to send magic links. [Resend](https://resend.com) is the easiest free option (100 emails/day).

1.  Log in to [Resend](https://resend.com).
2.  **Add Domain**: If you have a custom domain (e.g., `whatsbible.com`), add it. If not, you can test with your personal email, but for production, you need a domain.
3.  **Create API Key**:
    *   Go to `API Keys` → `Create API Key`.
    *   Name it "production".
    *   Copy the key (starts with `re_`).
4.  **SMTP Settings** (These will be used in ENV variables):
    *   Host: `smtp.resend.com`
    *   Port: `465` (Secure)
    *   User: `resend`
    *   Password: `[YOUR_API_KEY]`
    *   From: `onboarding@resend.dev` (or your verified domain like `grace@whatsbible.com`).

---

## Phase 4: Payments (Stripe)

1.  Log in to [Stripe Dashboard](https://dashboard.stripe.com/).
2.  **Create Product**:
    *   Go to `Products` → `Add Product`.
    *   Name: "WhatsBible Monthly" / "WhatsBible Yearly".
    *   Set Pricing (e.g., $4.99 Recurring Monthly).
    *   **Copy the Price ID** (starts with `price_...`). You need this for the code (or update the code to fetch dynamically).
3.  **Get API Keys**:
    *   Go to `Developers` → `API keys`.
    *   Copy **Publishable Key** (`pk_live_...`).
    *   Copy **Secret Key** (`sk_live_...`).
4.  **Setup Webhook**:
    *   *You will do this AFTER deploying to Vercel (Phase 6), because you need the URL.*

---

## Phase 5: Messaging (Meta Cloud API)

1.  Log in to [Meta for Developers](https://developers.facebook.com/).
2.  **Create App**:
    *   Click "My Apps" -> "Create App".
    *   Select **Business** type.
    *   Details: Name "WhatsBible", Email, Business Account.
3.  **Add Product**:
    *   Scroll to "WhatsApp" and click **Set up**.
4.  **Get Credentials (Test)**:
    *   Go to **WhatsApp** -> **API Setup**.
    *   Copy **Temporary Access Token** (Good for 24h).
    *   *For Production*: You need to create a "System User" in Business Manager to get a Permanent Token.
    *   Copy **Phone Number ID**.
    *   Copy **WhatsApp Business Account ID**.
5.  **Test Number**:
    *   Meta gives you a free "Test Number".
    *   **CRITICAL**: You must add your own phone number to the "Recipient Phone Numbers" list on this page and verify it via OTP code. You can only send messages to verified numbers until you go Live.
6.  **Create Template** (Required for Cron):
    *   Go to "WhatsApp Manager" -> "Account Tools" -> "Message Templates".
    *   Create a template named `daily_message`.
    *   Category: **Marketing**.
    *   Language: **English (US)**.
    *   **Header**: Select **Text**. Enter: `Daily Grace`.
    *   Body: `Here is your Daily Grace:`
        `{{1}}`
        `Blessings, WhatsBible Team`
        *(Note: Meta requires variables to be 'sandwiched' by text. You cannot start or end with a variable).*
    *   **Sample Content**: You MUST click "Add Sample" for the `{{1}}` variable.
    *   Paste this: `John 3:16 - For God so loved the world...`
    *   Submit (Auto-approval is usually instant).

---

## Phase 6: Vercel Deployment

1.  **Push to GitHub**: Ensure your latest code is pushed.
2.  Log in to [Vercel](https://vercel.com).
3.  **Add New Project**: Import `WhatsBible` from GitHub.
4.  **Environment Variables**:
    Expand the "Environment Variables" section and add ALL of these:

    | Key | Value Source |
    | :--- | :--- |
    | `DATABASE_URL` | Supabase Connection String (Phase 2) |
    | `NEXTAUTH_URL` | `https://your-project-name.vercel.app` (The deployment URL) |
    | `NEXTAUTH_SECRET` | Generate random: `openssl rand -base64 32` |
    | `STRIPE_SECRET_KEY` | Stripe Secret Key (Phase 4) |
    | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key (Phase 4) |
    | `STRIPE_WEBHOOK_SECRET` | *Leave empty for now, see Phase 7* |
    | `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API Permanent Access Token (Phase 5) |
    | `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API Phone Number ID (Phase 5) |
    | `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Cloud API Business Account ID (Phase 5) |
    | `WHATSAPP_VERIFY_TOKEN` | A random string for webhook verification (Phase 5) |
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
    *   Change **Build Command** to: `npx prisma migrate deploy && next build`
    *   Redeploy if needed.

2.  **Stripe Webhook**:
    *   Go back to [Stripe Webhooks](https://dashboard.stripe.com/webhooks).
    *   Add Endpoint: `https://whatsbible.vercel.app/api/stripe/webhook`
    *   Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`.
    *   Select events: `checkout.session.completed`, `invoice.payment.succeeded`, `customer.subscription.updated`.
    *   **Copy Signing Secret** (`whsec_...`).
    *   Go to Vercel -> Settings -> Environment Variables.
    *   Add `STRIPE_WEBHOOK_SECRET` with this value.
    *   Redeploy for it to take effect.

3.  **Twilio Webhook**:
    * ### Meta WhatsApp (Cloud API)
1. Go to [developers.facebook.com](https://developers.facebook.com/) -> My Apps -> Select App -> WhatsApp -> Configuration.
2. **Callback URL**: `https://your-project.vercel.app/api/whatsapp/webhook`
3. **Verify Token**: `my-random-verify-token` (Match this with `WHATSAPP_VERIFY_TOKEN` in env).
4. Click **Verify and Save**.
5. Click **Manage** (Webhooks fields) -> Subscribe to `messages`.

4.  **Cron Job**:
    *   Go to Vercel Dashboard -> Project -> **Cron Jobs**.
    *   You should see `/api/cron` scheduled hourly.

---

## Phase 8: Verification

1.  **Test Login**: Go to your URL -> Dashboard -> Sign In. Check if you get the email.
2.  **Test Update**: Save your phone number in Settings.
3.  **Test Cron**:
    *   Manually invoke the cron job via Vercel Dashboard or curl:
    *   `curl "https://whatsbible.vercel.app/api/cron?secret=MySecureCronSecret123"`
    *   Check Vercel text logs to see if it "Sent message to..."

**🚀 You are Live!**
