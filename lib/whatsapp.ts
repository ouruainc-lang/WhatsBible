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

// Helper: Send Long Message (Split into Chunks)
// Replaces formatTruncatedMessage usage where possible
export async function sendSplitWhatsAppMessage(to: string, text: string) {
    const limit = 1550;
    if (text.length <= limit) {
        return sendWhatsAppMessage(to, text);
    }

    // Split into chunks
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= limit) {
            chunks.push(remaining);
            break;
        }

        // Find last space before limit to avoid breaking words
        let splitIndex = remaining.lastIndexOf(' ', limit);
        if (splitIndex === -1) splitIndex = limit; // No space, hard cut

        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex).trim();
    }

    for (const chunk of chunks) {
        await sendWhatsAppMessage(to, chunk);
        await new Promise(r => setTimeout(r, 1000)); // 1s delay to maintain order
    }
}

// Helper: Truncate message and append link if too long
export function formatTruncatedMessage(content: string, link: string, limit: number = 1500): string {
    if (content.length <= limit) return content;

    // Truncate and add link
    // Reserve ~100 chars for the "Read full" suffix to be safe against limit
    const truncated = content.substring(0, limit - 100);
    return `${truncated}...\n\n(Msg truncated)\nRead full: ${link}`;
}
// Helper: Format Reflection Message (Standardize Bold, Headers, English/Tagalog, Truncation)
export function formatReflectionMessage(rawContent: string, date: string, link: string): string {
    const header = `*Daily Word • ${date}*\n\n`;
    const footer = `\n\nRead full: ${link}\n\nYou’re welcome to respond with 🙏 Amen or share a reflection.`;

    // Process Body
    let body = rawContent.replace(/ \| /g, "\n\n");

    // Convert standard MD bold (**) to WhatsApp bold (*).
    body = body.replace(/\*\*/g, '*');

    // Format Headers: Remove Markdown Bold (*), Add Newline
    // Supports English and Tagalog
    body = body
        .replace(/📖 \*(Word|Salita|Palavra):\* ?/g, "📖 $1:\n")
        .replace(/🕊️ \*(Reflection|Pagninilay|Reflexão):\* ?/g, "🕊️ $1:\n")
        .replace(/🙏 \*(Prayer|Panalangin|Oração):\* ?/g, "🙏 $1:\n");

    // Smart Truncation: Preserve Header and Footer
    const maxBodyLen = 1550 - header.length - footer.length;
    if (body.length > maxBodyLen) {
        body = body.substring(0, maxBodyLen - 3) + "...";
    }

    return header + body + footer;
}
