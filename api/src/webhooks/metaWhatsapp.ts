import { Router } from 'express';
import axios from 'axios';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';
import { sendTextMessage, markMessageRead } from '../services/whatsapp';
import { processIncomingMessage } from '../services/aiAgent';
import type { Therapist, SlotOffer, Slot } from '../lib/types';

const SUPPORT_WA_NUMBER = process.env.SUPPORT_WA_NUMBER ?? '+14254424167';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Types for Meta webhook payload
// ─────────────────────────────────────────────────────────────

interface MetaWAMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'image' | 'audio' | 'document' | 'sticker' | 'unknown';
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  audio?: { id: string; mime_type?: string };
  image?: { id: string; mime_type?: string; caption?: string };
  document?: { id: string; mime_type?: string; filename?: string };
}

interface MetaWAContact {
  profile: { name: string };
  wa_id: string;
}

interface MetaWAValue {
  messaging_product: string;
  metadata: { display_phone_number: string; phone_number_id: string };
  contacts?: MetaWAContact[];
  messages?: MetaWAMessage[];
  statuses?: unknown[];
}

// ─────────────────────────────────────────────────────────────
// GET — Meta webhook verification challenge
// ─────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WA_VERIFY_TOKEN) {
    logger.info('Meta WA webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('Meta WA webhook verification failed', { mode });
    res.sendStatus(403);
  }
});

// ─────────────────────────────────────────────────────────────
// POST — Inbound messages
// ─────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
  // Acknowledge immediately — Meta requires 200 within 20s
  res.sendStatus(200);

  const body = req.body;
  if (body?.object !== 'whatsapp_business_account') return;

  const value: MetaWAValue | undefined = body?.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.length) return; // delivery/read receipts — skip

  for (const message of value.messages) {
    processInboundMessage(message, value.contacts ?? []).catch((err) => {
      logger.error('processInboundMessage unhandled error', {
        messageId: message.id,
        error: (err as Error).message,
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Message router
// ─────────────────────────────────────────────────────────────

async function processInboundMessage(
  message: MetaWAMessage,
  contacts: MetaWAContact[]
): Promise<void> {
  const from = message.from; // Meta sends without '+', e.g. "919876543210"
  const fromE164 = `+${from}`;

  let messageText = '';
  let mediaUrl: string | null = null;
  let interactiveId: string | undefined;

  switch (message.type) {
    case 'text':
      messageText = message.text?.body ?? '';
      break;

    case 'interactive':
      messageText =
        message.interactive?.button_reply?.title ??
        message.interactive?.list_reply?.title ??
        '';
      interactiveId =
        message.interactive?.button_reply?.id ??
        message.interactive?.list_reply?.id ??
        undefined;
      break;

    case 'audio':
      messageText = '[Voice message received]';
      if (message.audio?.id) {
        mediaUrl = await handleAudioMessage(message.audio.id, fromE164, message.id);
      }
      break;

    case 'image':
      messageText = message.image?.caption ?? '[Image received]';
      if (message.image?.id) {
        mediaUrl = await getMediaUrl(message.image.id);
      }
      break;

    case 'document':
      messageText = `[Document received: ${message.document?.filename ?? 'unknown'}]`;
      if (message.document?.id) {
        mediaUrl = await getMediaUrl(message.document.id);
      }
      break;

    default:
      messageText = `[${message.type} message received]`;
      break;
  }

  // Store media URL in conversations if present
  if (mediaUrl) {
    await supabaseAdmin.from('conversations').insert({
      lead_id: null, // aiAgent will handle lead lookup
      channel: 'whatsapp',
      direction: 'inbound',
      from_number: fromE164,
      message_body: messageText,
      media_url: mediaUrl,
      meta_message_id: message.id,
      ai_generated: false,
    });
  }

  // Route through the AI agent — handles both clients and therapists
  await processIncomingMessage(fromE164, messageText, message.id, message.type, interactiveId);
}

// ─────────────────────────────────────────────────────────────
// Audio message handling — download, store, forward to support
// ─────────────────────────────────────────────────────────────

async function handleAudioMessage(
  mediaId: string,
  fromNumber: string,
  messageId: string
): Promise<string | null> {
  try {
    const token = process.env.META_WA_ACCESS_TOKEN;
    if (!token) return null;

    // Step 1: Get media URL from Meta
    const mediaInfoRes = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const downloadUrl = mediaInfoRes.data?.url;
    if (!downloadUrl) return null;

    // Step 2: Download the audio file
    const audioRes = await axios.get(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });

    const audioBuffer = Buffer.from(audioRes.data as ArrayBuffer);
    const fileName = `voice_${fromNumber.replace('+', '')}_${Date.now()}.ogg`;

    // Step 3: Upload to Supabase Storage
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('voice-messages')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/ogg',
        upsert: false,
      });

    if (uploadErr) {
      logger.warn('Failed to upload voice message to storage', {
        error: uploadErr.message,
        fromNumber,
      });
      // Still notify support even if storage fails
    }

    const storedUrl = uploadData?.path
      ? `${process.env.SUPABASE_URL}/storage/v1/object/public/voice-messages/${uploadData.path}`
      : null;

    // Step 4: Forward notification to support
    await sendTextMessage(
      SUPPORT_WA_NUMBER,
      `🎙️ *Voice message received*\n\nFrom: ${fromNumber}\nMessage ID: ${messageId}\n${storedUrl ? `Audio: ${storedUrl}` : 'Audio could not be stored.'}\n\nPlease listen and respond if needed.`
    );

    logger.info('Voice message processed', { fromNumber, fileName, stored: !!storedUrl });
    return storedUrl;
  } catch (err) {
    logger.error('handleAudioMessage failed', { error: (err as Error).message, fromNumber });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Get media URL from Meta Graph API (for image/document)
// ─────────────────────────────────────────────────────────────

async function getMediaUrl(mediaId: string): Promise<string | null> {
  try {
    const token = process.env.META_WA_ACCESS_TOKEN;
    if (!token) return null;

    const res = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data?.url ?? null;
  } catch (err) {
    logger.warn('getMediaUrl failed', { mediaId, error: (err as Error).message });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Persist inbound message to conversations table
// ─────────────────────────────────────────────────────────────

async function saveConversation({
  from,
  message,
  therapistId,
}: {
  from: string;
  message: MetaWAMessage;
  therapistId: string | null;
}): Promise<void> {
  let leadId: string | null = null;

  if (!therapistId) {
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('whatsapp_number', from)
      .single();
    leadId = lead?.id ?? null;
  }

  const messageBody =
    message.text?.body ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    null;

  const { error } = await supabaseAdmin.from('conversations').insert({
    lead_id: leadId,
    therapist_id: therapistId,
    channel: 'whatsapp',
    direction: 'inbound',
    from_number: from,
    to_number: process.env.META_WA_PHONE_NUMBER_ID ?? null,
    message_body: messageBody,
    meta_message_id: message.id,
    ai_generated: false,
    ai_intent: null,
  });

  if (error) {
    logger.error('saveConversation failed', { error: error.message, from });
  }
}

// ─────────────────────────────────────────────────────────────
// Therapist reply — parse slots from free-text and relay to client
// Expected format: "14/02 10:00, 15/02 14:30"
// ─────────────────────────────────────────────────────────────

async function handleTherapistReply(
  message: MetaWAMessage,
  from: string,
  therapist: Pick<Therapist, 'id' | 'full_name'>
): Promise<void> {
  const text = message.text?.body ?? '';
  logger.info('Therapist reply received', { therapistId: therapist.id, text });

  // Find the most recent open slot offer for this therapist
  const { data: slotOffer, error } = await supabaseAdmin
    .from('slot_offers')
    .select('id, appointment_id, lead_id')
    .eq('therapist_id', therapist.id)
    .eq('is_expired', false)
    .is('therapist_responded_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !slotOffer) {
    logger.warn('No open slot offer found for therapist reply', { therapistId: therapist.id });
    return;
  }

  const offeredSlots = parseSlotTimes(text);

  if (offeredSlots.length === 0) {
    logger.warn('Could not parse slots from therapist message', { text });
    await sendTextMessage(
      from,
      "Sorry, I couldn't read those times. Please send slots like:\n14/02 10:00, 15/02 14:30"
    );
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('slot_offers')
    .update({
      offered_slots: offeredSlots,
      therapist_responded_at: new Date().toISOString(),
    })
    .eq('id', (slotOffer as SlotOffer).id);

  if (updateError) {
    logger.error('Failed to save therapist slots', { error: updateError.message });
    return;
  }

  logger.info('Slot offer updated', {
    slotOfferId: (slotOffer as SlotOffer).id,
    slotCount: offeredSlots.length,
  });

  await relaySlotToClient(slotOffer as SlotOffer, offeredSlots, therapist.full_name);
}

// ─────────────────────────────────────────────────────────────
// Parse "DD/MM HH:MM" patterns from therapist free-text
// ─────────────────────────────────────────────────────────────

function parseSlotTimes(text: string): Slot[] {
  const pattern = /(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/g;
  const slots: Slot[] = [];
  const year = new Date().getFullYear();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [, day, month, hour, minute] = match;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    const h = hour.padStart(2, '0');

    slots.push({
      date: `${year}-${m}-${d}`,
      time_ist: `${h}:${minute} IST`,
      label: `${d}/${m} · ${h}:${minute} IST`,
    });
  }

  return slots;
}

// ─────────────────────────────────────────────────────────────
// Relay therapist slots to client and update appointment status
// ─────────────────────────────────────────────────────────────

async function relaySlotToClient(
  slotOffer: Pick<SlotOffer, 'id' | 'appointment_id' | 'lead_id'>,
  slots: Slot[],
  therapistName: string
): Promise<void> {
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, whatsapp_number, full_name')
    .eq('id', slotOffer.lead_id)
    .single();

  if (!lead?.whatsapp_number) {
    logger.warn('Cannot relay slots — lead missing whatsapp_number', { leadId: slotOffer.lead_id });
    return;
  }

  const slotLines = slots.map((s, i) => `${i + 1}. ${s.label}`).join('\n');

  await sendTextMessage(
    lead.whatsapp_number,
    `Hi ${lead.full_name ?? 'there'} 👋\n\n` +
      `${therapistName} is available at:\n\n` +
      `${slotLines}\n\n` +
      `Reply with the number of your preferred slot (e.g. *1*).`
  );

  await Promise.all([
    supabaseAdmin
      .from('slot_offers')
      .update({ client_notified_at: new Date().toISOString() })
      .eq('id', slotOffer.id),

    supabaseAdmin
      .from('appointments')
      .update({ status: 'slots_offered', offered_slots: slots })
      .eq('id', slotOffer.appointment_id),
  ]);

  logger.info('Slots relayed to client', { leadId: slotOffer.lead_id, slotCount: slots.length });
}

// ─────────────────────────────────────────────────────────────
// Client / unknown sender handler
// ─────────────────────────────────────────────────────────────

async function handleClientMessage(
  message: MetaWAMessage,
  from: string,
  contactName: string | null
): Promise<void> {
  const messageBody =
    message.text?.body ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    '';

  logger.info('Client message received', { from, preview: messageBody.slice(0, 80) });

  const { data: existingLead } = await supabaseAdmin
    .from('leads')
    .select('id, status, full_name')
    .eq('whatsapp_number', from)
    .single();

  if (!existingLead) {
    // New contact — create lead
    const { data: newLead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        whatsapp_number: from,
        full_name: contactName ?? null,
        status: 'new',
        source: 'whatsapp',
      })
      .select('id')
      .single();

    if (error || !newLead) {
      logger.error('Failed to create lead from WA message', { from, error: error?.message });
      return;
    }

    logger.info('New lead created from WhatsApp', { leadId: newLead.id, from });

    await sendTextMessage(
      from,
      `Hi ${contactName ?? 'there'} 👋 Welcome to India Therapist.\n\n` +
        "I'm here to help you find the right therapist. Could you share a little about what you're going through or the kind of support you're looking for?"
    );
  } else {
    logger.info('Existing lead messaged', { leadId: existingLead.id, status: existingLead.status });

    // TODO (Phase 2): pipe message + lead context to Claude for AI response
    // const aiReply = await generateAIResponse(existingLead, messageBody);
    // await sendTextMessage(from, aiReply);

    await sendTextMessage(from, 'Thanks for your message! Our team will be with you shortly. 🙏');
  }
}

export default router;
