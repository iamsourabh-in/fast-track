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

export class JobTrackerEngine {
  public static generateJobKey(company: string, title: string, jobUrl: string): string {
    const cleanUrl = jobUrl.split('?')[0].toLowerCase();
    const cleanCompany = company.toLowerCase().trim();
    const cleanTitle = title.toLowerCase().trim();
    return `${cleanCompany}::${cleanTitle}::${cleanUrl}`;
  }

  public static isAlreadyProcessed(company: string, title: string, jobUrl: string): boolean {
    const key = this.generateJobKey(company, title, jobUrl);
    const existing = db.prepare('SELECT id, status FROM applied_jobs WHERE job_key = ? OR job_url = ?').get(key, jobUrl) as { id: number; status: string } | undefined;
    return !!existing;
  }

  public static recordJob(job: {
    company: string;
    title: string;
    location?: string;
    jobUrl: string;
    applyMode: string;
    status: 'applied' | 'skipped' | 'failed' | 'pending';
    notes?: string;
  }): AppliedJobRecord {
    const key = this.generateJobKey(job.company, job.title, job.jobUrl);

    db.prepare(`
      INSERT INTO applied_jobs (job_key, company, title, location, job_url, apply_mode, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_key) DO UPDATE SET
        status = excluded.status,
        apply_mode = excluded.apply_mode,
        notes = excluded.notes,
        applied_at = CURRENT_TIMESTAMP
    `).run(key, job.company, job.title, job.location || '', job.jobUrl, job.applyMode, job.status, job.notes || '');

    return db.prepare('SELECT * FROM applied_jobs WHERE job_key = ?').get(key) as AppliedJobRecord;
  }

  public static getDailyAppliedCount(): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM applied_jobs 
      WHERE status = 'applied' AND date(applied_at) = date('now')
    `).get() as { count: number };
    return row.count || 0;
  }

  public static getAllJobs(limit: number = 100): AppliedJobRecord[] {
    return db.prepare('SELECT * FROM applied_jobs ORDER BY applied_at DESC LIMIT ?').all(limit) as AppliedJobRecord[];
  }
}
