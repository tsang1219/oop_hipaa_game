/**
 * POST /api/feedback — Vercel serverless function.
 *
 * Receives an in-game feedback report from FeedbackModal.tsx and forwards it to
 * Slack, attaching the screenshot + full state as files. Runs ONLY on Vercel
 * (auto-detected because it lives in /api at the repo root). Keeps the Slack bot
 * token server-side/secret — it never touches the client bundle.
 *
 * Env (set in Vercel project settings, no VITE_ prefix so they stay secret):
 *   SLACK_BOT_TOKEN   xoxb-… bot token with files:write, invited to the channel
 *   SLACK_CHANNEL_ID  Cxxxxxxxx target channel id
 *
 * If either is unset (e.g. a preview without secrets), we return 200
 * { delivered: false } so the client shows its copy-to-clipboard fallback rather
 * than erroring.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  bug: { emoji: '🐛', label: 'Bug' },
  idea: { emoji: '💡', label: 'Idea' },
  confusing: { emoji: '😕', label: 'Confusing' },
  loved: { emoji: '❤️', label: 'Loved it' },
};

const MAX_MESSAGE = 4000;
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024; // ~2MB decoded

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = (req.body ?? {}) as {
    type?: string;
    message?: string;
    snapshot?: unknown;
    screenshotDataUrl?: string | null;
  };

  const type = typeof body.type === 'string' && TYPE_META[body.type] ? body.type : 'bug';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE) : '';
  if (!message) {
    return res.status(400).json({ error: 'empty_message' });
  }

  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token || !channel) {
    // Not configured — tell the client to fall back to clipboard.
    return res.status(200).json({ delivered: false, reason: 'not_configured' });
  }

  // Decode the screenshot (best-effort — a report is still useful without it).
  const screenshot = decodeDataUrl(body.screenshotDataUrl);
  const stateJson = safeStringify(body.snapshot);

  const meta = TYPE_META[type];
  const comment = buildComment(meta, message, body.snapshot);

  try {
    const files: Array<{ id: string }> = [];

    if (screenshot && screenshot.bytes.length <= MAX_SCREENSHOT_BYTES) {
      const id = await uploadFile(token, 'screenshot.png', screenshot.bytes);
      if (id) files.push({ id });
    }
    const stateId = await uploadFile(token, 'state.json', Buffer.from(stateJson, 'utf8'));
    if (stateId) files.push({ id: stateId });

    if (files.length === 0) {
      return res.status(200).json({ delivered: false, reason: 'upload_failed' });
    }

    const completed = await slack('files.completeUploadExternal', token, {
      files,
      channel_id: channel,
      initial_comment: comment,
    });

    if (!completed.ok) {
      return res.status(200).json({ delivered: false, reason: completed.error ?? 'complete_failed' });
    }
    return res.status(200).json({ delivered: true });
  } catch {
    return res.status(200).json({ delivered: false, reason: 'exception' });
  }
}

// ---------- Slack file upload flow (getUploadURLExternal → PUT → complete) ----------

/** Returns the Slack file_id on success, or null. */
async function uploadFile(token: string, filename: string, bytes: Buffer): Promise<string | null> {
  const start = await slack('files.getUploadURLExternal', token, {
    filename,
    length: String(bytes.length),
  });
  if (!start.ok || !start.upload_url || !start.file_id) return null;

  const put = await fetch(start.upload_url as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    // Node's fetch accepts a binary body at runtime; the cast sidesteps a DOM-lib
    // BodyInit generic-variance quirk (Buffer/Uint8Array<ArrayBufferLike>).
    body: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) as unknown as BodyInit,
  });
  if (!put.ok) return null;

  return start.file_id as string;
}

/** Thin Slack Web API caller. getUploadURL/complete both accept form-encoding. */
async function slack(
  method: string,
  token: string,
  params: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  const isJson = method === 'files.completeUploadExternal';
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': isJson
        ? 'application/json; charset=utf-8'
        : 'application/x-www-form-urlencoded',
    },
    body: isJson ? JSON.stringify(params) : encodeForm(params),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

// ---------- helpers ----------

function encodeForm(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) usp.append(k, String(v));
  return usp.toString();
}

function decodeDataUrl(dataUrl: string | null | undefined): { bytes: Buffer } | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma === -1) return null;
  try {
    return { bytes: Buffer.from(dataUrl.slice(comma + 1), 'base64') };
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{"error":"unserializable snapshot"}';
  }
}

/** Human-readable Slack message: type header, the note, then context + recent actions. */
function buildComment(
  meta: { emoji: string; label: string },
  message: string,
  snapshot: unknown,
): string {
  const s = (snapshot ?? {}) as any;
  const c = s.context ?? {};
  const lines: string[] = [`${meta.emoji} *${meta.label}*`, '', `> ${message.replace(/\n/g, '\n> ')}`, ''];

  const facts: string[] = [];
  if (c.currentRoomId) facts.push(`room: \`${c.currentRoomId}\``);
  if (c.currentAct != null) facts.push(`act: ${c.currentAct}`);
  if (c.unifiedScore != null) facts.push(`score: ${c.unifiedScore}`);
  if (c.playerPosition) facts.push(`pos: ${c.playerPosition.tileX},${c.playerPosition.tileY}`);
  if (c.sceneReady) facts.push(`scene: ${c.sceneReady}`);
  if (typeof c.elapsedMs === 'number') facts.push(`t+${Math.round(c.elapsedMs / 1000)}s`);
  if (facts.length) lines.push(facts.join('  ·  '));

  const events = s?.runtime?.eventLog;
  if (Array.isArray(events) && events.length) {
    const recent = events.slice(-6).map((e: any) => e?.event).filter(Boolean);
    if (recent.length) lines.push(`recent: ${recent.join(' → ')}`);
  }

  return lines.join('\n');
}
