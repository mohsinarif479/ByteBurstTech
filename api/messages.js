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
    return sendJson(res, 201, { ok: true });
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
