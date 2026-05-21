const {
  DATA_PATHS,
  getAdminPasswordHash,
  hashPassword,
  readBody,
  requireAdmin,
  sendJson,
  writeJsonBlob,
} = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!requireAdmin(req, res)) return;

  const { currentPassword, newPassword } = await readBody(req);
  const currentHash = await getAdminPasswordHash();

  if (!currentPassword || hashPassword(currentPassword) !== currentHash) {
    return sendJson(res, 401, { error: 'Current password is incorrect' });
  }

  if (!newPassword || String(newPassword).length < 10) {
    return sendJson(res, 400, { error: 'New password must be at least 10 characters' });
  }

  await writeJsonBlob(DATA_PATHS.authConfig, {
    passwordHash: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  }, 'private');

  return sendJson(res, 200, { ok: true });
};
