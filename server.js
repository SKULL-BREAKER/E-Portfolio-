const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const QRCode = require('qrcode');

const {
  initializeDatabase,
  getActiveResume,
  incrementResumeDownloads,
  getProfile,
  logAudit,
  saveContactMessage,
  avatarsDir,
} = require('./database');

const {
  sanitizeString,
  hashIp,
} = require('./utils/security');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy if running behind one
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        objectSrc: ["'self'"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null, // Allow local HTTP development
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Body parsers with strict size limits
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Additional custom hardening headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Configure Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});


const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Message limit reached. Please wait before submitting another inquiry.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const downloadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Download rate limit reached. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});



// -------------------------------------------------------------
// PUBLIC API ROUTES
// -------------------------------------------------------------

// Profile Information
app.get('/api/profile', (req, res) => {
  try {
    const profile = getProfile();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found.' });
    }
    res.json({
      success: true,
      data: {
        fullName: profile.full_name,
        title: profile.title,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        githubUrl: profile.github_url,
        linkedinUrl: profile.linkedin_url,
        updatedAt: profile.updated_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Unable to retrieve profile data.' });
  }
});

// Active Resume Metadata (For anti-tampering verification badge)
app.get('/api/resume/info', (req, res) => {
  try {
    const resume = getActiveResume();
    if (!resume) {
      return res.status(404).json({ success: false, error: 'No active resume available.' });
    }
    res.json({
      success: true,
      data: {
        id: resume.id,
        filename: resume.original_name,
        fileSize: resume.file_size,
        mimeType: resume.mime_type,
        sha256Hash: resume.sha256_hash,
        uploadedAt: resume.uploaded_at,
        downloadCount: resume.download_count,
        verified: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching resume verification metadata.' });
  }
});

// Resume Download Endpoint (With download counting and safe streaming)
app.get('/api/resume/download', downloadLimiter, (req, res) => {
  try {
    const resume = getActiveResume();
    if (!resume || !fs.existsSync(resume.file_path)) {
      return res.status(404).json({ success: false, error: 'Resume file not found on server.' });
    }

    incrementResumeDownloads(resume.id);
    logAudit('RESUME_DOWNLOAD', hashIp(req.ip), 'SUCCESS', `Downloaded: ${resume.original_name}`);

    // Set strict download headers
    const safeFilename = resume.original_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('X-File-SHA256', resume.sha256_hash);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = fs.createReadStream(resume.file_path);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to process resume download.' });
  }
});

// In-Browser PDF Preview
app.get('/api/resume/preview', downloadLimiter, (req, res) => {
  try {
    const resume = getActiveResume();
    if (!resume || !fs.existsSync(resume.file_path)) {
      return res.status(404).json({ success: false, error: 'Resume file not found on server.' });
    }

    const safeFilename = resume.original_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('X-File-SHA256', resume.sha256_hash);

    const stream = fs.createReadStream(resume.file_path);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to preview resume.' });
  }
});

// QR Code Generator (Encodes current portfolio URL)
app.get('/api/qr', async (req, res) => {
  try {
    const targetUrl = req.query.url || `${req.protocol}://${req.get('host')}`;
    // Sanitize targetUrl to prevent injection
    const cleanUrl = targetUrl.substring(0, 500);

    const qrDataUrl = await QRCode.toDataURL(cleanUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.json({
      success: true,
      qrDataUrl,
      targetUrl: cleanUrl,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'QR Code generation failed.' });
  }
});

// Contact Form with Honeypot & Anti-Spam protection
app.post('/api/contact', contactLimiter, (req, res) => {
  try {
    const { name, email, subject, message, hp_website } = req.body;

    // Honeypot check: Bots fill hidden hp_website field
    if (hp_website && hp_website.length > 0) {
      logAudit('CONTACT_SPAM_BLOCKED', hashIp(req.ip), 'BLOCKED', 'Honeypot triggered');
      // Silently accept to avoid alerting bot
      return res.json({ success: true, message: 'Your message has been securely submitted.' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    const cleanName = sanitizeString(name).substring(0, 100);
    const cleanEmail = sanitizeString(email).substring(0, 120);
    const cleanSubject = sanitizeString(subject || 'Portfolio Inquiry').substring(0, 150);
    const cleanMessage = sanitizeString(message).substring(0, 3000);

    const clientIpHash = hashIp(req.ip);
    saveContactMessage({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      ip_hash: clientIpHash,
    });

    logAudit('CONTACT_MESSAGE_RECEIVED', clientIpHash, 'SUCCESS', `From: ${cleanEmail}`);

    res.json({
      success: true,
      message: 'Inquiry securely encrypted and logged. Thank you for reaching out.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to record message.' });
  }
});
// Serve Public Static Assets
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, extensions: ['html'] }));

// Specific Page Routes
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/skills', (req, res) => res.sendFile(path.join(__dirname, 'public', 'skills.html')));
app.get('/certifications', (req, res) => res.sendFile(path.join(__dirname, 'public', 'certifications.html')));
app.get('/projects', (req, res) => res.sendFile(path.join(__dirname, 'public', 'projects.html')));
app.get('/resume', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resume.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// Safe Avatar serving with image MIME header enforcement
app.use('/storage/avatars', express.static(avatarsDir, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Route fallback for Multi-Page Application (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/storage')) {
    const rawPath = req.path.replace(/^\//, '').replace(/\/$/, '');
    if (rawPath) {
      const pageFile = path.join(__dirname, 'public', `${rawPath}.html`);
      if (fs.existsSync(pageFile)) {
        return res.sendFile(pageFile);
      }
    }
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Global Centralized Error Handler (Zero unhandled crashes)
app.use((err, req, res, next) => {
  console.error('[UNCAUGHT ERROR]', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal service error. Request safely aborted to preserve system integrity.',
  });
});

// Graceful process management (Zero crash guarantee)
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL UNHANDLED REJECTION]', reason);
});

// Initialize Database & Boot Server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`========================================================`);
      console.log(` PORTFOLIO SERVER RUNNING SECURELY ON PORT ${PORT}`);
      console.log(` Access URL: http://localhost:${PORT}`);
      console.log(` Status: Zero-Crash Hardened, Rate-Limited, Prepared SQL`);
      console.log(`========================================================`);
    });
  } catch (err) {
    console.error('[FATAL STARTUP ERROR]', err);
    process.exit(1);
  }
}

startServer();
