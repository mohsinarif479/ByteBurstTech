const { requireAdmin, readBody, sendJson } = require('./_lib');
const crypto = require('crypto');

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return {
    type: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!requireAdmin(req, res)) return;

  const { files = [] } = await readBody(req);
  if (!Array.isArray(files) || !files.length) {
    return sendJson(res, 400, { error: 'No files provided' });
  }

  const { put } = await import('@vercel/blob');
  const uploaded = [];

  for (const file of files.slice(0, 8)) {
    const parsed = parseDataUrl(file.data);
    if (!parsed || !parsed.type.startsWith('image/')) continue;

    const extension = parsed.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const safeName = String(file.name || `project.${extension}`).replace(/[^a-z0-9._-]/gi, '-');
    const pathname = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const blob = await put(pathname, parsed.buffer, {
      access: 'private',
      contentType: parsed.type,
    });
    uploaded.push(blob.url);
  }

  return sendJson(res, 201, { urls: uploaded });
};
