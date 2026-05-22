const { sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const targetUrl = String(req.query.url || '');
  if (!targetUrl || !targetUrl.includes('.blob.vercel-storage.com/')) {
    return sendJson(res, 400, { error: 'Invalid media URL' });
  }

  const headers = targetUrl.includes('.private.blob.vercel-storage.com/')
    ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
    : {};
  const response = await fetch(targetUrl, { headers });

  if (!response.ok) {
    return sendJson(res, response.status, { error: 'Media could not be loaded' });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
};
