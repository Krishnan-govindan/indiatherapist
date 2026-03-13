import axios from 'axios';
import { logger } from '../lib/logger';

const BASE_URL = 'https://graph.facebook.com/v19.0';

function phoneNumberId(): string {
  const id = process.env.META_WA_PHONE_NUMBER_ID;
  if (!id) throw new Error('Missing env: META_WA_PHONE_NUMBER_ID');
  return id;
}

function accessToken(): string {
  const token = process.env.META_WA_ACCESS_TOKEN;
  if (!token) throw new Error('Missing env: META_WA_ACCESS_TOKEN');
  return token;
}

function messagesUrl(): string {
  return `${BASE_URL}/${phoneNumberId()}/messages`;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken()}`,
    'Content-Type': 'application/json',
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Send plain text message
// ─────────────────────────────────────────────────────────────

export async function sendTextMessage(to: string, body: string): Promise<void> {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  };

  try {
    await axios.post(messagesUrl(), payload, { headers: headers() });
    logger.info('WA text sent', { to, preview: body.slice(0, 60) });
  } catch (err) {
    logger.error('WA sendTextMessage failed', { to, error: (err as Error).message });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Send template message
// ─────────────────────────────────────────────────────────────

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  langCode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: any[]
): Promise<void> {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode },
      components,
    },
  };

  try {
    await axios.post(messagesUrl(), payload, { headers: headers() });
    logger.info('WA template sent', { to, templateName, langCode });
  } catch (err) {
    logger.error('WA sendTemplateMessage failed', { to, templateName, error: (err as Error).message });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Send interactive button message (up to 3 buttons)
// ─────────────────────────────────────────────────────────────

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
): Promise<void> {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  };

  try {
    await axios.post(messagesUrl(), payload, { headers: headers() });
    logger.info('WA interactive buttons sent', { to, buttonCount: buttons.length });
  } catch (err) {
    logger.error('WA sendInteractiveButtons failed', { to, error: (err as Error).message });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Send interactive list message (for therapist selection)
// ─────────────────────────────────────────────────────────────

export async function sendInteractiveList(
  to: string,
  header: string,
  body: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: any[]
): Promise<void> {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: header },
      body: { text: body },
      action: {
        button: 'View Options',
        sections,
      },
    },
  };

  try {
    await axios.post(messagesUrl(), payload, { headers: headers() });
    logger.info('WA interactive list sent', { to, header });
  } catch (err) {
    logger.error('WA sendInteractiveList failed', { to, error: (err as Error).message });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Mark message as read (shows blue ticks to sender)
// ─────────────────────────────────────────────────────────────

export async function markMessageRead(messageId: string): Promise<void> {
  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };

  try {
    await axios.post(messagesUrl(), payload, { headers: headers() });
  } catch (err) {
    // Non-fatal — log and continue; don't block message processing
    logger.warn('WA markMessageRead failed', { messageId, error: (err as Error).message });
  }
}
