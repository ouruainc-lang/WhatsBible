const GRAPH_API_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// Helper to send a Raw Text message (Only works if 24h window is open)
export async function sendWhatsAppMessage(to: string, body: string) {
    // Ensure number has no '+' and no spaces, assuming simple cleanup for now
    const cleanNumber = to.replace(/\D/g, '');

    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GRAPH_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'text',
            text: { preview_url: false, body: body }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('Meta API Error (Text):', data);
        throw new Error(data.error?.message || 'Failed to send WhatsApp message');
    }
    return data;
}

// Helper to send a Template message (Required for Cron/Initiating convo)
export async function sendWhatsAppTemplate(to: string, templateName: string, languageCode: string = "en_US", components: any[] = []) {
    const cleanNumber = to.replace(/\D/g, '');

    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GRAPH_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'template',
            template: {
                name: templateName,
                language: { code: languageCode },
                components: components
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('Meta API Error (Template):', data);
        throw new Error(data.error?.message || 'Failed to send WhatsApp template');
    }
    return data;
}
