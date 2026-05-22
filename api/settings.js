const {
  DATA_PATHS,
  defaultSettings,
  readBody,
  readJsonBlob,
  requireAdmin,
  sendJson,
  writeJsonBlob,
} = require('./_lib');
const crypto = require('crypto');

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return {
    type: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function normalizeSettings(input = {}) {
  const companyName = String(input.companyName || defaultSettings.companyName).trim().slice(0, 80);
  const logoUrl = String(input.logoUrl || '').trim();
  const logoText = String(input.logoText || companyName.charAt(0) || defaultSettings.logoText).trim().slice(0, 3);

  return {
    companyName,
    logoText: logoText || defaultSettings.logoText,
    logoUrl,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
}

async function uploadLogo(file) {
  if (!file || !file.data) return '';
  const parsed = parseDataUrl(file.data);
  if (!parsed || !parsed.type.startsWith('image/') || parsed.buffer.length > 1024 * 1024) return '';

  const { put } = await import('@vercel/blob');
  const extension = parsed.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  const safeName = String(file.name || `logo.${extension}`).replace(/[^a-z0-9._-]/gi, '-');
  const blob = await put(`brand/${Date.now()}-${crypto.randomUUID()}-${safeName}`, parsed.buffer, {
    access: 'private',
    contentType: parsed.type,
  });
  return blob.url;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const settings = await readJsonBlob(DATA_PATHS.settings, defaultSettings);
    return sendJson(res, 200, { settings: normalizeSettings(settings) });
  }

  if (req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;

    const input = await readBody(req);
    const current = await readJsonBlob(DATA_PATHS.settings, defaultSettings);
    const logoUrl = input.logoFile ? await uploadLogo(input.logoFile) : String(input.logoUrl || current.logoUrl || '');
    const settings = normalizeSettings({
      companyName: input.companyName,
      logoText: input.logoText,
      logoUrl,
    });

    await writeJsonBlob(DATA_PATHS.settings, settings);
    return sendJson(res, 200, { settings });
  }

  res.setHeader('Allow', 'GET, PUT');
  return sendJson(res, 405, { error: 'Method not allowed' });
};
