# Project Setup & Environment Guide

This guide explains how to get every environment variable needed to run **WhatsBible** locally.

## 1. Environment Variables (.env)
Create a file named `.env` in the root folder. Copy the content below and fill in the values:

```bash
# --- Database ---
# For local dev, we use SQLite. No setup needed, just this file path.
DATABASE_URL="file:./dev.db"

# --- Authentication (NextAuth) ---
# The URL of your app. Locally it is localhost.
NEXTAUTH_URL="http://localhost:3000"
# Generate a random string (e.g., `openssl rand -base64 32` in terminal)
NEXTAUTH_SECRET="any-random-string-at-least-32-chars"

# --- Stripe (Payments) ---
# 1. Go to https://dashboard.stripe.com/test/apikeys
# 2. Toggle "Test mode" ON in the top right.
STRIPE_SECRET_KEY="sk_test_..."
# 3. For Webhooks: https://dashboard.stripe.com/test/webhooks
#    - Add Endpoint: http://localhost:3000/api/stripe/webhook
#    - Events: checkout.session.completed, invoice.payment_succeeded, customer.subscription.updated, customer.subscription.deleted
#    (Note: For local webhook testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# --- Twilio (WhatsApp) ---
# 1. Go to https://console.twilio.com/
# 2. Get Account SID and Auth Token from the dashboard.
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
# 3. Go to Messaging -> Try it out -> Send a WhatsApp message
# 4. Use the "Sandbox Number" provided (e.g., +14155238886)
TWILIO_PHONE_NUMBER="+14155238886"

# --- Email (Magic Links) ---
# We use Resend (easiest) or any SMTP.
# 1. Sign up at https://resend.com
# 2. Create an API Key.
# 3. Settings below are for Resend SMTP.
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_..." (This is your API Key)
EMAIL_FROM="onboarding@resend.dev" (Default testing email)

# --- Cron ---
# Arbitrary secret to protect your API route. 
CRON_SECRET="my-local-secret-123"
```

## 2. Install Dependencies
Run this in your terminal:
```bash
npm install
```

## 3. Database Setup (Local SQLite)
Initialize your local database:
```bash
npx prisma migrate dev --name init
```
This creates a `dev.db` file and applies the schema.

## 4. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 5. How to Verify It Works

### A. Authentication
- Click "Login".
- Enter your email.
- Check your **Terminal** console. Since we are in dev mode, NextAuth often prints the "Magic Link" directly to the console like:
  `PREVIEW: Use this link to log in: http://localhost:3000/api/auth/callback/email?...`
- Click that link to log in.

### B. WhatsApp
- To receive messages, you must join the **Twilio Sandbox**.
- Send the join code (e.g., "join something-something") from your real WhatsApp to the Twilio Sandbox number.
- Once joined, go to the App Dashboard -> Settings, and opt-in to WhatsApp.

### C. Trigger Daily Message
Since you don't want to wait 24 hours:
1. Open a new terminal.
2. Run:
   ```bash
   curl -H "Authorization: Bearer my-local-secret-123" http://localhost:3000/api/cron
   ```
3. Check your WhatsApp!
