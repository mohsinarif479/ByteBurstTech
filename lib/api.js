const crypto = require('crypto');

const defaultProjects = [
  {
    title: 'Biometric Voting System',
    bannerTitle: 'Secure biometric voting',
    bannerText: 'Fraud-resistant voting with biometric authentication and a React-based interface.',
    bannerIcon: '01',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'Secure voting application using biometric authentication, C#, .NET, SQL Server, and a React-based frontend for a modern voting experience.',
  },
  {
    title: 'Freelancer Auto Bidder',
    bannerTitle: 'Automated freelance bidding',
    bannerText: 'Smart project matching and automated bids managed through a React dashboard.',
    bannerIcon: '02',
    imageUrl: 'images/project-automation.svg',
    images: ['images/project-automation.svg'],
    description: 'Automated bidding system built with JavaScript, web scraping logic, and a React dashboard for bid management.',
  },
  {
    title: 'Online Ticket Reservation System',
    bannerTitle: 'Real-time ticket booking',
    bannerText: 'MERN reservation platform with live seat management and Stripe payments.',
    bannerIcon: '03',
    imageUrl: 'images/project-crm.svg',
    images: ['images/project-crm.svg'],
    description: 'MERN stack booking system with real-time seat management and Stripe payment integration for secure transactions.',
  },
  {
    title: 'Phishing URL Detection System',
    bannerTitle: 'Machine learning URL security',
    bannerText: 'Python ML pipeline for classifying malicious and safe URLs in real time.',
    bannerIcon: '04',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'Python and machine learning system for feature extraction, model training, and malicious URL classification.',
  },
  {
    title: 'Online E-Commerce Book Store',
    bannerTitle: 'MERN book commerce',
    bannerText: 'Responsive online bookstore with cart, authentication, and order management.',
    bannerIcon: '05',
    imageUrl: 'images/project-ecommerce.svg',
    images: ['images/project-ecommerce.svg'],
    description: 'MERN stack e-commerce bookstore with product browsing, cart functionality, authentication, and order management.',
  },
  {
    title: 'File Management System',
    bannerTitle: 'C++ file operations system',
    bannerText: 'Structured file I/O system supporting create, read, update, and delete flows.',
    bannerIcon: '06',
    imageUrl: 'images/project-default.svg',
    images: ['images/project-default.svg'],
    description: 'C++ file management system using structured programming and file I/O concepts for optimized CRUD operations.',
  },
];

const DATA_PATHS = {
  projects: 'data/projects.json',
  messages: 'data/messages.json',
  authAttempts: 'data/auth-attempts.json',
  authConfig: 'data/auth-config.json',
  settings: 'data/site-settings.json',
};

const defaultSettings = {
  companyName: 'DevCraft Studio',
  logoText: 'D',
  logoUrl: '',
};

const SESSION_COOKIE = 'devcraft_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return cookies;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function normalizeProject(item, index = 0) {
  const imageUrl = item.imageUrl || 'images/project-default.svg';
  const images = Array.isArray(item.images) && item.images.length ? item.images : [imageUrl];
  return {
    title: item.title || `Project ${index + 1}`,
    bannerTitle: item.bannerTitle || item.title || `Project ${index + 1}`,
    bannerText: item.bannerText || item.description || '',
    bannerIcon: item.bannerIcon || String(index + 1).padStart(2, '0'),
    imageUrl: images[0] || imageUrl,
    images,
    description: item.description || '',
  };
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || 'replace-this-secret-in-vercel-env';
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

function hashPassword(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function getAdminPasswordHash() {
  try {
    const config = await readJsonBlob(DATA_PATHS.authConfig, {});
    if (config && typeof config.passwordHash === 'string' && config.passwordHash) {
      return config.passwordHash;
    }
  } catch (error) {
    // Fall back to the deployment environment value if Blob is temporarily unavailable.
  }

  return process.env.ADMIN_PASSWORD_HASH || '';
}

function createSessionCookie() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', expiresAt })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return serializeCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  });
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== sign(payload)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'admin' && Number(data.expiresAt) > Date.now();
  } catch (error) {
    return false;
  }
}

function requireAdmin(req, res) {
  if (isAuthenticated(req)) return true;
  sendJson(res, 401, { error: 'Unauthorized' });
  return false;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

async function blobSdk() {
  return import('@vercel/blob');
}

async function readJsonBlob(path, fallback) {
  const { list } = await blobSdk();
  const result = await list({ prefix: path, limit: 100 });
  const blob = result.blobs
    .filter((item) => item.pathname === path)
    .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];

  if (!blob) return fallback;

  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });
  if (!response.ok) return fallback;
  return response.json();
}

async function writeJsonBlob(path, data) {
  const { put } = await blobSdk();
  return put(path, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

module.exports = {
  DATA_PATHS,
  clearSessionCookie,
  createSessionCookie,
  defaultProjects,
  defaultSettings,
  getAdminPasswordHash,
  hashPassword,
  isAuthenticated,
  normalizeProject,
  readBody,
  readJsonBlob,
  requireAdmin,
  sendJson,
  writeJsonBlob,
};
