const {
  DATA_PATHS,
  readBody,
  readJsonBlob,
  requireAdmin,
  sendJson,
  writeJsonBlob,
} = require('./_lib');
const crypto = require('crypto');

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/msword',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'text/plain',
]);
const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_ATTACHMENTS = 3;

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return {
    type: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function isAllowedAttachmentType(type) {
  return type.startsWith('image/') || ALLOWED_ATTACHMENT_TYPES.has(type);
}

function sanitizeMessage(input) {
  return {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || '').trim().slice(0, 120),
    email: String(input.email || '').trim().slice(0, 180),
    message: String(input.message || '').trim().slice(0, 3000),
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    createdAt: input.createdAt || new Date().toISOString(),
    status: input.status || 'new',
  };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

async function uploadMessageAttachments(files = [], messageId) {
  if (!Array.isArray(files) || !files.length) return [];

  const { put } = await import('@vercel/blob');
  const uploaded = [];

  for (const file of files.slice(0, MAX_ATTACHMENTS)) {
    const parsed = parseDataUrl(file.data);
    if (!parsed || !isAllowedAttachmentType(parsed.type) || parsed.buffer.length > MAX_ATTACHMENT_BYTES) continue;

    const originalName = String(file.name || 'attachment').slice(0, 120);
    const safeName = originalName.replace(/[^a-z0-9._-]/gi, '-');
    const pathname = `message-attachments/${messageId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const blob = await put(pathname, parsed.buffer, {
      access: 'public',
      contentType: parsed.type,
    });

    uploaded.push({
      name: originalName,
      type: parsed.type,
      size: parsed.buffer.length,
      url: blob.url,
    });
  }

  return uploaded;
}

async function sendContactEmail(message) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'mohsinarif479@gmail.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'DevCraft Studio <onboarding@resend.dev>';

  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY is not configured' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: message.email,
      subject: `New website inquiry from ${message.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>New client inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(message.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(message.createdAt)}</p>
          <hr />
          <p>${escapeHtml(message.message).replace(/\n/g, '<br />')}</p>
          ${message.attachments?.length ? `
            <h3>Attachments</h3>
            <ul>
              ${message.attachments.map((file) => `<li><a href="${escapeHtml(file.url)}">${escapeHtml(file.name)}</a></li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `,
      text: `New client inquiry\n\nName: ${message.name}\nEmail: ${message.email}\nSubmitted: ${message.createdAt}\n\n${message.message}${message.attachments?.length ? `\n\nAttachments:\n${message.attachments.map((file) => `${file.name}: ${file.url}`).join('\n')}` : ''}`,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return { sent: false, reason: data.message || 'Email provider rejected the request' };
  }

  return { sent: true };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    try {
      const messages = await readJsonBlob(DATA_PATHS.messages, []);
      return sendJson(res, 200, { messages });
    } catch (error) {
      return sendJson(res, 500, { error: 'Messages could not be loaded from storage' });
    }
  }

  if (req.method === 'POST') {
    let input;
    try {
      input = await readBody(req);
    } catch (error) {
      return sendJson(res, 400, { error: 'Message data is invalid' });
    }

    const nextMessage = sanitizeMessage(input);
    if (!nextMessage.name || !nextMessage.email || !nextMessage.message) {
      return sendJson(res, 400, { error: 'Name, email, and message are required' });
    }

    try {
      nextMessage.attachments = await uploadMessageAttachments(nextMessage.attachments, nextMessage.id);
    } catch (error) {
      return sendJson(res, 500, { error: 'Attachments could not be uploaded. Please try smaller files.' });
    }

    let messages = [];
    try {
      messages = await readJsonBlob(DATA_PATHS.messages, []);
      const next = [nextMessage, ...messages];
      await writeJsonBlob(DATA_PATHS.messages, next, 'private');
    } catch (error) {
      return sendJson(res, 500, { error: 'Message could not be saved to the admin inbox' });
    }

    const emailResult = await sendContactEmail(nextMessage).catch((error) => ({
      sent: false,
      reason: error.message || 'Email notification failed',
    }));

    return sendJson(res, 201, { ok: true, emailSent: emailResult.sent });
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { id } = req.query;
    try {
      const messages = await readJsonBlob(DATA_PATHS.messages, []);
      const next = id ? messages.filter((message) => message.id !== id) : [];
      await writeJsonBlob(DATA_PATHS.messages, next, 'private');
      return sendJson(res, 200, { messages: next });
    } catch (error) {
      return sendJson(res, 500, { error: 'Messages could not be updated in storage' });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return sendJson(res, 405, { error: 'Method not allowed' });
};
