const { DATA_PATHS, defaultSettings, readJsonBlob, sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const settings = await readJsonBlob(DATA_PATHS.settings, defaultSettings);
  const logoUrl = String(settings.logoUrl || '');

  if (!logoUrl) {
    return sendJson(res, 404, { error: 'Logo is not configured' });
  }

  const headers = logoUrl.includes('.private.blob.vercel-storage.com/')
    ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    : {};
  const response = await fetch(logoUrl, { headers });

  if (!response.ok) {
    return sendJson(res, response.status, { error: 'Logo could not be loaded' });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=300');
  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
};
