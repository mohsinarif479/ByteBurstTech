const { requireAdmin, sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!requireAdmin(req, res)) return;

  const targetUrl = String(req.query.url || '');
  if (!targetUrl || !targetUrl.includes('.private.blob.vercel-storage.com/')) {
    return sendJson(res, 400, { error: 'Invalid private Blob URL' });
  }

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!response.ok) {
    return sendJson(res, response.status, { error: 'File could not be loaded' });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=60');
  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
};
