const { sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { put, list } = await import('@vercel/blob');
    const testPath = `health/blob-${Date.now()}.json`;
    await put(testPath, JSON.stringify({ ok: true, at: new Date().toISOString() }), {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
    });
    const result = await list({ prefix: 'health/', limit: 1 });
    return sendJson(res, 200, {
      ok: true,
      blobTokenConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      listed: Array.isArray(result.blobs),
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      blobTokenConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      error: error && error.message ? error.message : 'Unknown Blob error',
    });
  }
};
