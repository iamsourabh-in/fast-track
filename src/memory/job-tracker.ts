import { UserJob, AppliedJob } from './mongo.js';

export interface AppliedJobRecord {
  id: string;
  userId: string;
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
  id: string;
  userId: string;
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

  public static async isAlreadyProcessed(company: string, title: string, jobUrl: string, userId: string): Promise<boolean> {
    const key = this.generateJobKey(company, title, jobUrl);
    const existing = await AppliedJob.findOne({
      userId,
      $or: [{ jobKey: key }, { jobUrl }],
      status: { $ne: 'pending' }
    }).lean();
    if (existing) return true;

    const userJob = await UserJob.findOne({
      userId,
      $or: [{ jobKey: key }, { jobUrl }],
      status: { $nin: ['queued', 'pending'] }
    }).lean();
    return !!userJob;
  }

  public static async saveUserJobs(jobs: any[], userId: string): Promise<number> {
    let saved = 0;
    
    for (const j of jobs) {
      const key = this.generateJobKey(j.company, j.title, j.url);
      try {
        await UserJob.updateOne(
          { userId, jobKey: key },
          {
            $set: {
              company: j.company,
              title: j.title,
              location: j.location || 'Remote',
              jobUrl: j.url,
              source: j.source || 'custom',
              salary: j.salary || '$160k - $240k',
              description: j.descriptionSnippet || j.description || '',
              status: 'queued'
            }
          },
          { upsert: true }
        );
        saved++;
      } catch (err) {
        console.error(`[JobTrackerEngine] Error saving job ${key}:`, err);
      }
    }
    return saved;
  }

  public static async getUserQueuedJobs(userId: string): Promise<UserJobRecord[]> {
    const jobs = await UserJob.find({ userId, status: 'queued' }).sort({ createdAt: 1 }).lean();
    return jobs.map((j: any) => ({
      id: j._id.toString(),
      userId: j.userId.toString(),
      job_key: j.jobKey,
      company: j.company,
      title: j.title,
      location: j.location,
      job_url: j.jobUrl,
      source: j.source,
      salary: j.salary,
      description: j.description,
      status: j.status,
      created_at: j.createdAt ? j.createdAt.toISOString() : new Date().toISOString()
    }));
  }

  public static async updateUserJobStatus(jobKeyOrUrl: string, status: 'applied' | 'skipped' | 'failed' | 'pending', userId: string): Promise<void> {
    await UserJob.updateOne(
      { userId, $or: [{ jobKey: jobKeyOrUrl }, { jobUrl: jobKeyOrUrl }] },
      { $set: { status } }
    );
  }

  public static async recordJob(job: {
    company: string;
    title: string;
    location?: string;
    jobUrl: string;
    applyMode: string;
    status: 'applied' | 'skipped' | 'failed' | 'pending';
    notes?: string;
  }, userId: string): Promise<AppliedJobRecord> {
    const key = this.generateJobKey(job.company, job.title, job.jobUrl);

    const appliedJob = await AppliedJob.findOneAndUpdate(
      { userId, jobKey: key },
      {
        company: job.company,
        title: job.title,
        location: job.location || '',
        jobUrl: job.jobUrl,
        applyMode: job.applyMode,
        status: job.status,
        notes: job.notes || '',
        appliedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );

    await this.updateUserJobStatus(key, job.status, userId);

    return {
      id: appliedJob._id.toString(),
      userId: appliedJob.userId.toString(),
      job_key: appliedJob.jobKey,
      company: appliedJob.company,
      title: appliedJob.title,
      location: appliedJob.location,
      job_url: appliedJob.jobUrl,
      apply_mode: appliedJob.applyMode,
      status: appliedJob.status as any,
      notes: appliedJob.notes,
      applied_at: (appliedJob as any).createdAt ? (appliedJob as any).createdAt.toISOString() : new Date().toISOString()
    };
  }

  public static async getDailyAppliedCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await AppliedJob.countDocuments({
      userId,
      status: 'applied',
      appliedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
  }

  public static async getRecentHistory(userId: string, limit: number = 50): Promise<AppliedJobRecord[]> {
    const jobs = await AppliedJob.find({ userId }).sort({ appliedAt: -1 }).limit(limit).lean();
    return jobs.map((j: any) => ({
      id: j._id.toString(),
      userId: j.userId.toString(),
      job_key: j.jobKey,
      company: j.company,
      title: j.title,
      location: j.location,
      job_url: j.jobUrl,
      apply_mode: j.applyMode,
      status: j.status,
      notes: j.notes,
      applied_at: j.createdAt ? j.createdAt.toISOString() : new Date().toISOString()
    }));
  }
}
