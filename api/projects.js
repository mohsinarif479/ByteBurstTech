const {
  DATA_PATHS,
  defaultProjects,
  normalizeProject,
  readBody,
  readJsonBlob,
  requireAdmin,
  sendJson,
  writeJsonBlob,
} = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const projects = await readJsonBlob(DATA_PATHS.projects, defaultProjects);
    return sendJson(res, 200, { projects: projects.map(normalizeProject) });
  }

  if (req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const { projects } = await readBody(req);
    if (!Array.isArray(projects)) {
      return sendJson(res, 400, { error: 'Projects must be an array' });
    }

    const normalized = projects.map(normalizeProject);
    await writeJsonBlob(DATA_PATHS.projects, normalized, 'public');
    return sendJson(res, 200, { projects: normalized });
  }

  res.setHeader('Allow', 'GET, PUT');
  return sendJson(res, 405, { error: 'Method not allowed' });
};
