const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { calculateSha256 } = require('./utils/security');
const { generateDefaultResume } = require('./utils/defaultResume');

// Ensure necessary directories exist
const dataDir = path.join(__dirname, 'data');
const storageDir = path.join(__dirname, 'storage');
const resumesDir = path.join(storageDir, 'resumes');
const avatarsDir = path.join(storageDir, 'avatars');

[dataDir, storageDir, resumesDir, avatarsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const dbPath = path.join(dataDir, 'portfolio.db');
const db = new Database(dbPath);

// Enable SQLite Write-Ahead Logging (WAL) for high concurrency & integrity
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize all database tables and seed defaults
 */
async function initializeDatabase() {
  // Purge any legacy admin tables
  db.exec('DROP TABLE IF EXISTS admin_users;');

  // Table: Resumes
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      download_count INTEGER NOT NULL DEFAULT 0,
      uploaded_at TEXT NOT NULL
    );
  `);

  // Table: Profile Information
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL,
      title TEXT NOT NULL,
      bio TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      location TEXT NOT NULL,
      github_url TEXT,
      linkedin_url TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Table: Contact Inquiries
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Table: Security Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Seed default profile information if empty
  const profileCheck = db.prepare('SELECT id FROM profile WHERE id = 1').get();
  if (!profileCheck) {
    db.prepare(`
      INSERT INTO profile (id, full_name, title, bio, avatar_url, email, phone, location, github_url, linkedin_url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'NANTHAKUMAR T',
      'Frontend Developer',
      'Detail-driven 2nd-year B.Tech Artificial Intelligence & Data Science student at Ramco Institute of Technology. Passionate about building AI-driven solutions, responsive web interfaces, and applied machine learning models, with hands-on experience across practical IoT sensor prototypes and verified credentials from Google, HCL, Deloitte, Tata, and Goldman Sachs.',
      './assets/nantha-portrait.jpg?v=3.0',
      'nanthakumar7750@gmail.com',
      '+91 98765 43210',
      'Tamil Nadu, India',
      'https://github.com/nanthakumar',
      'https://linkedin.com/in/nanthakumar',
      new Date().toISOString()
    );
  }

  // Seed default resume if none exists
  const resumeCheck = db.prepare('SELECT id FROM resumes WHERE is_active = 1').get();
  if (!resumeCheck) {
    const defaultPdfFilename = 'Resume_Nanthakumar_Official.pdf';
    const defaultPdfPath = path.join(resumesDir, defaultPdfFilename);

    if (!fs.existsSync(defaultPdfPath)) {
      console.log('[SYSTEM] Generating official default resume PDF...');
      await generateDefaultResume(defaultPdfPath);
    }

    const fileBuffer = fs.readFileSync(defaultPdfPath);
    const sha256 = calculateSha256(fileBuffer);
    const fileSize = fs.statSync(defaultPdfPath).size;

    db.prepare(`
      INSERT INTO resumes (filename, original_name, file_path, mime_type, file_size, sha256_hash, is_active, download_count, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)
    `).run(
      defaultPdfFilename,
      'Nanthakumar_T_Resume.pdf',
      defaultPdfPath,
      'application/pdf',
      fileSize,
      sha256,
      new Date().toISOString()
    );
    console.log('[DATABASE] Seeded default active resume with SHA-256:', sha256);
  }
}

// DAO Helpers with Prepared Statements

const getActiveResume = () => {
  return db.prepare('SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1').get();
};

const getAllResumes = () => {
  return db.prepare('SELECT id, filename, original_name, mime_type, file_size, sha256_hash, is_active, download_count, uploaded_at FROM resumes ORDER BY id DESC').all();
};

const addResume = ({ filename, originalName, filePath, mimeType, fileSize, sha256Hash }) => {
  const transaction = db.transaction(() => {
    // Deactivate previous active resumes
    db.prepare('UPDATE resumes SET is_active = 0').run();
    // Insert new active resume
    const stmt = db.prepare(`
      INSERT INTO resumes (filename, original_name, file_path, mime_type, file_size, sha256_hash, is_active, download_count, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)
    `);
    const info = stmt.run(filename, originalName, filePath, mimeType, fileSize, sha256Hash, new Date().toISOString());
    return info.lastInsertRowid;
  });
  return transaction();
};

const incrementResumeDownloads = (id) => {
  db.prepare('UPDATE resumes SET download_count = download_count + 1 WHERE id = ?').run(id);
};

const deleteResume = (id) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id);
  if (!resume) return false;
  
  // If deleting active resume, mark the latest previous resume as active
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM resumes WHERE id = ?').run(id);
    if (resume.is_active === 1) {
      const nextLatest = db.prepare('SELECT id FROM resumes ORDER BY id DESC LIMIT 1').get();
      if (nextLatest) {
        db.prepare('UPDATE resumes SET is_active = 1 WHERE id = ?').run(nextLatest.id);
      }
    }
  });
  transaction();

  // Remove actual physical file safely
  try {
    if (fs.existsSync(resume.file_path)) {
      fs.unlinkSync(resume.file_path);
    }
  } catch (err) {
    console.error('[STORAGE] Error unlinking resume file:', err.message);
  }
  return true;
};

const getProfile = () => {
  return db.prepare('SELECT * FROM profile WHERE id = 1').get();
};

const updateProfile = (data) => {
  return db.prepare(`
    UPDATE profile
    SET full_name = ?, title = ?, bio = ?, email = ?, phone = ?, location = ?, github_url = ?, linkedin_url = ?, updated_at = ?
    WHERE id = 1
  `).run(
    data.full_name,
    data.title,
    data.bio,
    data.email,
    data.phone,
    data.location,
    data.github_url,
    data.linkedin_url,
    new Date().toISOString()
  );
};

const updateAvatarUrl = (avatarUrl) => {
  return db.prepare('UPDATE profile SET avatar_url = ?, updated_at = ? WHERE id = 1').run(avatarUrl, new Date().toISOString());
};

const logAudit = (action, ipHash, status, details = '') => {
  try {
    db.prepare(`
      INSERT INTO audit_logs (action, ip_hash, status, details, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(action, ipHash, status, details, new Date().toISOString());
  } catch (err) {
    console.error('[AUDIT ERROR]', err.message);
  }
};

const saveContactMessage = (data) => {
  return db.prepare(`
    INSERT INTO contact_messages (name, email, subject, message, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(data.name, data.email, data.subject, data.message, data.ip_hash, new Date().toISOString());
};

const getContactMessages = (limit = 50) => {
  return db.prepare('SELECT * FROM contact_messages ORDER BY id DESC LIMIT ?').all(limit);
};

module.exports = {
  db,
  initializeDatabase,
  getActiveResume,
  getAllResumes,
  addResume,
  incrementResumeDownloads,
  deleteResume,
  getProfile,
  updateProfile,
  updateAvatarUrl,
  logAudit,
  saveContactMessage,
  getContactMessages,
  storageDir,
  resumesDir,
  avatarsDir,
};
