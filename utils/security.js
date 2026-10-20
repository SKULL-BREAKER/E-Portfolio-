const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Strong server secret generated once or from environment
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY = '4h';

/**
 * Hash password with bcrypt cost factor 12
 */
async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verify password
 */
async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate authenticated JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Calculate SHA-256 checksum for anti-tamper verification
 */
function calculateSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verify PDF magic bytes: '%PDF-' = 0x25, 0x50, 0x44, 0x46
 */
function isBufferValidPdf(buffer) {
  if (!buffer || buffer.length < 5) return false;
  // %PDF-
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Verify image magic bytes (PNG, JPEG, WEBP)
 */
function isBufferValidImage(buffer) {
  if (!buffer || buffer.length < 8) return false;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // WEBP: RIFF....WEBP
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  return isPng || isJpeg || isWebp;
}

/**
 * Escape HTML to prevent XSS injection
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Anonymize IP address for security logs
 */
function hashIp(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip + 'salt-portfolio-audit').digest('hex').substring(0, 16);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  calculateSha256,
  isBufferValidPdf,
  isBufferValidImage,
  sanitizeString,
  hashIp,
};
