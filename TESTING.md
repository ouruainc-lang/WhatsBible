# Local Testing Guide

Follow these steps to verify the application running on your local machine.

## 1. Start the Development Server
Open your terminal and run:
```bash
npm run dev
```
The app will start at `http://localhost:3000`.

## 2. Verify User Flow (Frontend)
1. Open your browser to `http://localhost:3000`.
2. Click "Get Started" or "Dashboard".
3. Sign in (since we use Email Provider, it will log "Magic Link" to your terminal console instead of sending an email if you haven't configured SMTP fully, or check your email provider logs).
   - *Tip*: Check the terminal where `npm run dev` is running for the login link.
4. Once logged in, go to **Settings**.
5. Change **Content Type** to "Daily Reading (Passage)".
6. Set **Delivery Time** to your current hour (e.g., if it's 14:30, set it to 14:00) so the cron job picks it up.
7. Ensure **WhatsApp Opt-In** is checked and you have a phone number saved.

## 3. Test the Cron Job (Daily Delivery)
The cron job usually runs automatically on Vercel, but locally we must trigger it manually.

1. Ensure your `.env` has a `CRON_SECRET`.
2. Open a new terminal window (keep `npm run dev` running).
3. Run this command (replace `YOUR_CRON_SECRET` with the value from your `.env`):

```bash
curl -i -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron
```

**Expected Output**:
- HTTP 200 OK
- JSON: `{"sent": 1, "message": "Cron processed"}` (sent count depends on matching users)

**Check Logs**:
- Check the `npm run dev` terminal to see if "Failed to fetch USCCB" or "Failed to send" errors appear.
- Check the database (using `npx prisma studio`) to see if a `VerseLog` was created.

## 4. Test Components Individually
### Scraper Logic
Verify that the scraping logic works without the full app:
```bash
npx ts-node scripts/test-scraper.js
```
This should print the proper JSON structure of today's readings.

### Database
View your data:
```bash
npx prisma studio
```
This opens a web interface at `http://localhost:5555` to view Users and VerseLogs.

## 5. Webhook Testing (Advanced)
To test Stripe or Twilio webhooks locally, you need a tunnel like **ngrok**.
1. Install ngrok.
2. Run `ngrok http 3000`.
3. Update your Stripe/Twilio webhook URLs to the `https://...ngrok-free.app/api/...` URL.
