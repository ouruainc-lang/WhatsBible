import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// Send plain text message (Session Message)
// Twilio treats this as a free-form message.
// Constraint: 24h window still applies generally.
export async function sendWhatsAppMessage(to: string, body: string) {
    if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Missing Twilio credentials");
    }

    // Twilio expects "whatsapp:+1234567890"
    // Ensure 'to' has + but no spaces/dashes, then prepend whatsapp:
    // If input is "+12345", format to "whatsapp:+12345"
    const cleanNumber = to.replace(/[^\d+]/g, '');
    const recipient = `whatsapp:${cleanNumber}`;
    const sender = `whatsapp:${fromNumber}`;

    try {
        const message = await client.messages.create({
            body: body,
            from: sender,
            to: recipient
        });
        console.log(`[TWILIO] Message sent: ${message.sid}`);
        return message;
    } catch (error: any) {
        console.error('[TWILIO] Error sending message:', error);
        throw new Error(error.message || 'Twilio Send Failed');
    }
}

// Send Template Message via Twilio Content API
// Requires a Template created in Twilio Console (Messaging -> Content Template Builder)
export async function sendWhatsAppTemplate(to: string, contentSid: string, variables: Record<string, string>) {
    if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Missing Twilio credentials");
    }

    const cleanNumber = to.replace(/[^\d+]/g, '');
    const recipient = `whatsapp:${cleanNumber}`;
    const sender = `whatsapp:${fromNumber}`;

    try {
        const message = await client.messages.create({
            from: sender,
            to: recipient,
            contentSid: contentSid,
            contentVariables: JSON.stringify(variables)
        });
        console.log(`[TWILIO] Template sent: ${message.sid}`);
        return message;
    } catch (error: any) {
        console.error('[TWILIO] Error sending template:', error);
        throw new Error(error.message || 'Twilio Template Failed');
    }
}

// Verify API: Send Code
export async function sendVerificationCode(to: string) {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) throw new Error("Missing TWILIO_VERIFY_SERVICE_SID");

    // For Verify API, 'to' should be E.164 (e.g. +1234...) NO 'whatsapp:' prefix
    const cleanNumber = to.replace(/[^\d+]/g, '');

    try {
        const verification = await client.verify.v2.services(serviceSid)
            .verifications.create({ to: cleanNumber, channel: 'whatsapp' });
        console.log(`[TWILIO] Verification sent: ${verification.sid}`);
        return verification;
    } catch (error: any) {
        console.error('[TWILIO] Error sending verification:', error);
        throw new Error(error.message || 'Twilio Verification Send Failed');
    }
}

// Verify API: Check Code
export async function checkVerificationCode(to: string, code: string) {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) throw new Error("Missing TWILIO_VERIFY_SERVICE_SID");

    const cleanNumber = to.replace(/[^\d+]/g, '');

    try {
        const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks.create({ to: cleanNumber, code: code });

        console.log(`[TWILIO] Verification status: ${verificationCheck.status}`);
        return verificationCheck.status === 'approved';
    } catch (error: any) {
        console.error('[TWILIO] Error checking verification:', error);
        throw new Error(error.message || 'Twilio Verification Check Failed');
    }
}

// Send Quick Reply Buttons (Dynamic Content)
// Creates a content resource on the fly and sends it.
// NOTE: This creates a new Content SID for every unique message. Twilio limits might apply.
// For high volume, use variables with a static template.
export async function sendWhatsAppQuickReply(to: string, bodyText: string, buttons: string[]) {
    if (!accountSid || !authToken || !fromNumber) throw new Error("Missing Twilio credentials");

    const cleanNumber = to.replace(/[^\d+]/g, '');
    const recipient = `whatsapp:${cleanNumber}`;
    const sender = `whatsapp:${fromNumber}`;

    try {
        // 1. Create Content Resource
        const content = await client.content.v1.contents.create({
            friendlyName: `QuickReply-${Date.now()}`,
            types: {
                'twilio/quick-reply': {
                    body: bodyText,
                    actions: buttons.map(btn => ({
                        title: btn,
                        id: btn.toLowerCase().replace(/[^a-z0-9]/g, '_')
                    }))
                }
            }
        });

        // 2. Send Message using Content SID
        const message = await client.messages.create({
            from: sender,
            to: recipient,
            contentSid: content.sid
        });

        console.log(`[TWILIO] QuickReply sent: ${message.sid} (Content: ${content.sid})`);
        return message;

    } catch (error: any) {
        console.error('[TWILIO] Error sending QuickReply:', error);
        // Fallback to text if Content API fails
        console.log("[TWILIO] Falling back to plain text...");
        return sendWhatsAppMessage(to, `${bodyText}\n\n(Reply: ${buttons.join(' or ')})`);
    }
}
