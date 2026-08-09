import { db } from './db.js';

export interface AppliedJobRecord {
  id: number;
  job_key: string;
  company: string;
  title: string;
  location?: string;
  job_url: string;
  apply_mode: string;
  status: 'applied' | 'skipped' | 'failed' | 'pending';
  notes?: string;
  applied_at: string;
}

export interface UserJobRecord {
  id: number;
  user_id: number;
  job_key: string;
  company: string;
  title: string;
  location?: string;
  job_url: string;
  source: string;
  salary?: string;
  status: 'queued' | 'applied' | 'skipped' | 'failed';
  created_at: string;
}

export class JobTrackerEngine {
  public static generateJobKey(company: string, title: string, jobUrl: string): string {
    const cleanUrl = jobUrl.split('?')[0].toLowerCase();
    const cleanCompany = company.toLowerCase().trim();
    const cleanTitle = title.toLowerCase().trim();
    return `${cleanCompany}::${cleanTitle}::${cleanUrl}`;
  }

  public static isAlreadyProcessed(company: string, title: string, jobUrl: string, userId: number = 1): boolean {
    const key = this.generateJobKey(company, title, jobUrl);
    const existing = db.prepare('SELECT id, status FROM applied_jobs WHERE user_id = ? AND (job_key = ? OR job_url = ?)').get(userId, key, jobUrl) as { id: number; status: string } | undefined;
    if (existing) return true;

    const userJob = db.prepare("SELECT id, status FROM user_jobs WHERE user_id = ? AND (job_key = ? OR job_url = ?) AND status != 'queued'").get(userId, key, jobUrl);
    return !!userJob;
  }

  public static saveUserJobs(jobs: any[], userId: number = 1): number {
    let saved = 0;
    const stmt = db.prepare(`
      INSERT INTO user_jobs (user_id, job_key, company, title, location, job_url, source, salary, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')
      ON CONFLICT(user_id, job_key) DO UPDATE SET
        company = excluded.company,
        title = excluded.title
    `);

    for (const j of jobs) {
      const key = this.generateJobKey(j.company, j.title, j.url);
      try {
        stmt.run(userId, key, j.company, j.title, j.location || 'Remote', j.url, j.source || 'custom', j.salary || '$160k - $240k');
        saved++;
      } catch {}
    }
    return saved;
  }

  public static getUserQueuedJobs(userId: number = 1): UserJobRecord[] {
    return db.prepare("SELECT * FROM user_jobs WHERE user_id = ? AND status = 'queued' ORDER BY id ASC").all(userId) as UserJobRecord[];
  }

  public static updateUserJobStatus(jobKeyOrUrl: string, status: 'applied' | 'skipped' | 'failed', userId: number = 1): void {
    db.prepare('UPDATE user_jobs SET status = ? WHERE user_id = ? AND (job_key = ? OR job_url = ?)').run(status, userId, jobKeyOrUrl, jobKeyOrUrl);
  }

  public static recordJob(job: {
    company: string;
    title: string;
    location?: string;
    jobUrl: string;
    applyMode: string;
    status: 'applied' | 'skipped' | 'failed' | 'pending';
    notes?: string;
  }, userId: number = 1): AppliedJobRecord {
    const key = this.generateJobKey(job.company, job.title, job.jobUrl);

    db.prepare(`
      INSERT INTO applied_jobs (user_id, job_key, company, title, location, job_url, apply_mode, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, key, job.company, job.title, job.location || '', job.jobUrl, job.applyMode, job.status, job.notes || '');

    this.updateUserJobStatus(key, job.status === 'applied' ? 'applied' : 'skipped', userId);

    return db.prepare('SELECT * FROM applied_jobs WHERE user_id = ? AND job_key = ?').get(userId, key) as AppliedJobRecord;
  }

  public static getDailyAppliedCount(userId: number = 1): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM applied_jobs 
      WHERE user_id = ? AND status = 'applied' AND date(applied_at) = date('now')
    `).get(userId) as { count: number };
    return row.count || 0;
  }

  public static getRecentHistory(userId: number = 1, limit: number = 50): AppliedJobRecord[] {
    return db.prepare(`
      SELECT * FROM applied_jobs
      WHERE user_id = ?
      ORDER BY applied_at DESC
      LIMIT ?
    `).all(userId, limit) as AppliedJobRecord[];
  }
}
