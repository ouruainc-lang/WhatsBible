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
