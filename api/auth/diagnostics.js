const { sendJson } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  return sendJson(res, 200, {
    adminPasswordHashConfigured: Boolean(process.env.ADMIN_PASSWORD_HASH),
    adminSessionSecretConfigured: Boolean(process.env.ADMIN_SESSION_SECRET),
    blobTokenConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
    contactToEmailConfigured: Boolean(process.env.CONTACT_TO_EMAIL),
    contactFromEmailConfigured: Boolean(process.env.CONTACT_FROM_EMAIL),
    nodeEnv: process.env.NODE_ENV || 'unknown',
  });
};
