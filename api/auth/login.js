const {
  DATA_PATHS,
  createSessionCookie,
  hashPassword,
  readBody,
  readJsonBlob,
  sendJson,
  writeJsonBlob,
} = require('../_lib');

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const { password } = await readBody(req);
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!expectedHash) {
      return sendJson(res, 500, { error: 'Admin password is not configured' });
    }

    let attempts = { count: 0, lockUntil: 0 };
    try {
      attempts = await readJsonBlob(DATA_PATHS.authAttempts, attempts);
    } catch (error) {
      attempts = { count: 0, lockUntil: 0 };
    }

    if (Number(attempts.lockUntil || 0) > Date.now()) {
      return sendJson(res, 429, { error: 'Admin access is temporarily locked. Please try again later.' });
    }

    if (!password || hashPassword(password) !== expectedHash) {
      const count = Number(attempts.count || 0) + 1;
      try {
        await writeJsonBlob(DATA_PATHS.authAttempts, {
          count: count >= MAX_ATTEMPTS ? 0 : count,
          lockUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : 0,
        }, 'private');
      } catch (error) {
        // Login should still return a useful authentication error if Blob is not configured yet.
      }
      return sendJson(res, 401, { error: 'Invalid credentials' });
    }

    try {
      await writeJsonBlob(DATA_PATHS.authAttempts, { count: 0, lockUntil: 0 }, 'private');
    } catch (error) {
      // A temporary Blob issue should not block a valid admin login.
    }

    res.setHeader('Set-Cookie', createSessionCookie());
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Login service error',
      detail: error && error.message ? error.message : 'Unknown server error',
    });
  }
};
