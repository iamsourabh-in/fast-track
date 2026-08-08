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
    CREATE TABLE IF NOT EXISTS candidate_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      question_normalized TEXT NOT NULL UNIQUE,
      question_raw TEXT NOT NULL,
      answer TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      usage_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applied_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_key TEXT NOT NULL UNIQUE,
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

  // Seed default candidate profile if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM candidate_profile').get() as { count: number };
  if (count.count === 0) {
    db.prepare(`
      INSERT INTO candidate_profile (
        full_name, email, phone, linkedin_url, github_url, portfolio_url,
        years_experience, location, requires_sponsorship, authorized_to_work, resume_text
      ) VALUES (
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
