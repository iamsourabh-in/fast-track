import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(config.dbPath);

// Enable WAL mode for high performance concurrent reading/writing
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS candidate_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      portfolio_url TEXT,
      years_experience INTEGER DEFAULT 5,
      location TEXT,
      requires_sponsorship INTEGER DEFAULT 0,
      authorized_to_work INTEGER DEFAULT 1,
      resume_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qa_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      question_normalized TEXT NOT NULL,
      question_raw TEXT NOT NULL,
      answer TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      usage_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applied_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      job_key TEXT NOT NULL,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      job_url TEXT NOT NULL,
      apply_mode TEXT NOT NULL,
      status TEXT NOT NULL, -- 'applied' | 'skipped' | 'failed' | 'pending'
      notes TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default user account if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // Default password 'password123' bcrypt hash
    const defaultHash = '$2a$10$wE1V2vY9L8A2oM0wJ5nJd.8O2rS6T5u.qZ7mJ5W5u3qZ7mJ5W5u3q'; // Fallback pre-computed hash or insert directly
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role)
      VALUES (1, 'sourabh.rustagi@hotmail.com', '${defaultHash}', 'Sourabh Rustagi', 'admin')
    `).run();
    console.log('[Database] Seeded initial user account (sourabh.rustagi@hotmail.com).');
  }

  // Seed default candidate profile if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM candidate_profile').get() as { count: number };
  if (count.count === 0) {
    db.prepare(`
      INSERT INTO candidate_profile (
        user_id, full_name, email, phone, linkedin_url, github_url, portfolio_url,
        years_experience, location, requires_sponsorship, authorized_to_work, resume_text
      ) VALUES (
        1,
        'Sourabh Rustagi',
        'sourabh.rustagi@hotmail.com',
        '+91 8470894772',
        'https://www.linkedin.com/in/sourabhrustagi',
        'https://github.com/iamsourabh-in',
        'https://iamsourabh.in/',
        12,
        'New Delhi, India / Remote',
        0,
        1,
        'Chief Systems & DevOps Engineer with 12+ years experience building high-availability cloud systems and automation.'
      )
    `).run();
    console.log('[Database] Seeded initial candidate profile.');
  }

  console.log('[Database] FastApply SQLite DB initialized successfully.');
}
