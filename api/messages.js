const {
  DATA_PATHS,
  readBody,
  readJsonBlob,
  requireAdmin,
  sendJson,
  writeJsonBlob,
} = require('./_lib');
const crypto = require('crypto');

function sanitizeMessage(input) {
  return {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || '').trim().slice(0, 120),
    email: String(input.email || '').trim().slice(0, 180),
    message: String(input.message || '').trim().slice(0, 3000),
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
        </div>
      `,
      text: `New client inquiry\n\nName: ${message.name}\nEmail: ${message.email}\nSubmitted: ${message.createdAt}\n\n${message.message}`,
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
    const messages = await readJsonBlob(DATA_PATHS.messages, []);
    return sendJson(res, 200, { messages });
  }

  if (req.method === 'POST') {
    const input = await readBody(req);
    const nextMessage = sanitizeMessage(input);
    if (!nextMessage.name || !nextMessage.email || !nextMessage.message) {
      return sendJson(res, 400, { error: 'Name, email, and message are required' });
    }

    const messages = await readJsonBlob(DATA_PATHS.messages, []);
    const next = [nextMessage, ...messages];
    await writeJsonBlob(DATA_PATHS.messages, next, 'private');

    const emailResult = await sendContactEmail(nextMessage).catch((error) => ({
      sent: false,
      reason: error.message || 'Email notification failed',
    }));

    return sendJson(res, 201, { ok: true, emailSent: emailResult.sent });
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const { id } = req.query;
    const messages = await readJsonBlob(DATA_PATHS.messages, []);
    const next = id ? messages.filter((message) => message.id !== id) : [];
    await writeJsonBlob(DATA_PATHS.messages, next, 'private');
    return sendJson(res, 200, { messages: next });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return sendJson(res, 405, { error: 'Method not allowed' });
};
