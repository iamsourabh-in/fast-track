import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { config, LLMProviderType, ApplyModeType } from '../config/env.js';
import { LLMFactory } from '../llm/llm.factory.js';
import { JobTrackerEngine } from '../memory/job-tracker.js';
import { QAMemoryEngine } from '../memory/qa-memory.js';
import { SwipeModeHandler } from '../modes/swipe.mode.js';
import { db } from '../memory/db.js';
import { ResumeParserEngine } from '../memory/resume-parser.js';
import { JobSearchEngine } from '../browser/job-search.js';
import { RealJobScraper, RealJobPosting } from '../browser/real-job-scraper.js';
import { AgentStateTracker } from '../agent/agent-state.js';
import { AuthService, AuthenticatedRequest } from '../auth/auth.service.js';
import { AuditLogger } from '../memory/audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function startDashboardServer(port: number = config.port) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In-memory real crawled jobs cache
  const activeCrawledJobs: RealJobPosting[] = [];

  // Serve static assets
  const publicDir = path.join(__dirname, 'public');
  app.use(express.static(publicDir));

  // Logs stream cache
  const logs: string[] = [`[System] FastApply Dashboard server booted at port ${port}`];

  // Helper log function
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    logs.push(formatted);
    if (logs.length > 500) logs.shift();
  };

  // Global console interceptor to stream ALL background agent logs (Playwright, AgentCore, LLMs, Scraper) live to Web UI
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  console.log = (...args: any[]) => {
    origLog(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addLog(msg);
  };

  console.warn = (...args: any[]) => {
    origWarn(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addLog(`⚠️ ${msg}`);
  };

  console.error = (...args: any[]) => {
    origError(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addLog(`❌ ${msg}`);
  };

  // Sample jobs queue for Swipe & Test
  const mockFeed = [
    { id: '1', company: 'Google', title: 'Senior AI Engineer', location: 'Mountain View, CA', url: 'https://careers.google.com/jobs/results/12345', salary: '$180k - $240k', tags: ['AI', 'Python', 'LLM'] },
    { id: '2', company: 'Stripe', title: 'Staff Full-Stack Engineer', location: 'San Francisco, CA', url: 'https://stripe.com/jobs/listing/23456', salary: '$190k - $250k', tags: ['TypeScript', 'Node.js', 'React'] },
    { id: '3', company: 'Anthropic', title: 'Agent Systems Architect', location: 'San Francisco, CA', url: 'https://anthropic.com/careers/34567', salary: '$200k - $280k', tags: ['Agents', 'TypeScript', 'Playwright'] },
    { id: '4', company: 'Vercel', title: 'Senior Frontend Infrastructure Engineer', location: 'Remote (US)', url: 'https://vercel.com/careers/45678', salary: '$160k - $210k', tags: ['Next.js', 'React', 'Performance'] },
    { id: '5', company: 'OpenAI', title: 'Application Platform Engineer', location: 'San Francisco, CA', url: 'https://openai.com/careers/56789', salary: '$210k - $290k', tags: ['Node.js', 'Distributed Systems'] },
  ];

  // REST API Endpoints

  // Authentication & Security Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password, and fullName are required' });
    }
    try {
      const auth = await AuthService.register(email, password, fullName, req.ip);
      res.json({ success: true, ...auth });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    try {
      const auth = await AuthService.login(email, password, req.ip);
      res.json({ success: true, ...auth });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/audit-logs', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const logs = AuditLogger.getLogs(userId, 50);
    res.json({ logs });
  });

  // 1. Get Dashboard Stats & Config
  app.get('/api/stats', (req, res) => {
    const qaStats = QAMemoryEngine.getStats();
    const dailyApplied = JobTrackerEngine.getDailyAppliedCount();
    const candidate = ResumeParserEngine.getActiveProfile();

    res.json({
      activeProvider: LLMFactory.getActiveProviderName(),
      activeMode: config.mode,
      dailyApplied,
      maxDaily: config.maxDailyApplications,
      qaTotalAnswers: qaStats.totalAnswers,
      qaTotalReuses: qaStats.totalReuses,
      candidate,
      swipeQueueLength: SwipeModeHandler.getQueueLength(),
    });
  });

  // 1a. Get Live Agent Execution State & Flow
  app.get('/api/agent/status', (req, res) => {
    const state = AgentStateTracker.getState();
    res.json(state);
  });

  // 1b. Q&A Memory Bank Management Endpoints
  app.get('/api/memory/qa', (req, res) => {
    const memories = QAMemoryEngine.getAllMemories();
    res.json({ memories });
  });

  app.post('/api/memory/qa/update', (req, res) => {
    const { id, answer } = req.body;
    if (!id || answer === undefined) return res.status(400).json({ error: 'id and answer are required' });
    const success = QAMemoryEngine.updateMemory(Number(id), String(answer));
    addLog(`✏️ Updated Q&A Memory ID #${id} => "${answer}"`);
    res.json({ success });
  });

  app.delete('/api/memory/qa/:id', (req, res) => {
    const id = Number(req.params.id);
    const success = QAMemoryEngine.deleteMemory(id);
    addLog(`🗑️ Deleted Q&A Memory ID #${id}`);
    res.json({ success });
  });

  app.post('/api/memory/qa/clear', (req, res) => {
    QAMemoryEngine.clearAllMemories();
    addLog(`🧹 Cleared all Q&A Memories from cache.`);
    res.json({ success: true });
  });

  // 1c. Resume Profile Endpoints
  app.get('/api/resume', (req, res) => {
    const profile = ResumeParserEngine.getActiveProfile();
    res.json({ profile });
  });

  app.post('/api/resume/parse-url', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      addLog(`📄 Parsing Candidate Resume URL => ${url}`);
      const profile = await ResumeParserEngine.parseFromUrl(url);
      addLog(`✅ Successfully parsed profile: ${profile.fullName} (${profile.roleTitle}, ${profile.yearsExperience} YOE)`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Failed to parse resume URL: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/resume/upload-pdf', upload.single('resumePdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    try {
      addLog(`📄 Uploaded PDF resume: ${req.file.originalname} (${req.file.size} bytes)`);
      const profile = await ResumeParserEngine.parseFromPdfBuffer(req.file.buffer, req.file.originalname);
      addLog(`✅ Successfully extracted candidate profile from PDF: ${profile.fullName} (${profile.roleTitle})`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Failed to parse PDF resume: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/resume/synthesize', upload.single('resumePdf'), async (req, res) => {
    const webUrl = req.body.url;
    const pdfBuffer = req.file?.buffer;
    const pdfFilename = req.file?.originalname;

    try {
      addLog(`🚀 Synthesizing profile from PDF (${pdfFilename || 'None'}) & Website (${webUrl || 'None'})...`);
      const profile = await ResumeParserEngine.parseCombinedSource(pdfBuffer, pdfFilename, webUrl);
      addLog(`✅ Combined synthesis complete! Updated profile for ${profile.fullName}`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Synthesis failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/candidate/update', (req, res) => {
    const p = req.body;
    if (!p.fullName) return res.status(400).json({ error: 'fullName is required' });

    try {
      ResumeParserEngine.saveProfileToDb(p);
      addLog(`💾 Updated candidate profile facts for ${p.fullName}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Switch Provider or Mode dynamically
  app.post('/api/config', (req, res) => {
    const { provider, mode } = req.body;
    if (provider) {
      LLMFactory.setProvider(provider as LLMProviderType);
      config.provider = provider as LLMProviderType;
      addLog(`Switch LLM Provider => [${provider.toUpperCase()}]`);
    }
    if (mode) {
      config.mode = mode as ApplyModeType;
      addLog(`Switch Apply Mode => [${mode.toUpperCase()}]`);
    }
    res.json({ success: true, provider: config.provider, mode: config.mode });
  });

  // 3. Get Swipe Jobs Feed (User-Specific from SQLite)
  app.get('/api/swipe/feed', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const queued = JobTrackerEngine.getUserQueuedJobs(userId);
    res.json({ jobs: queued });
  });

  // 3b. User-Initiated Job Search (Platforms + Custom URL)
  app.post('/api/jobs/search', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const { platforms, customCareerUrl, query } = req.body;
    const searchKeywords = query || 'DevOps Engineer';
    const selectedPlatforms = Array.isArray(platforms) ? platforms : ['linkedin'];

    try {
      addLog(`🔍 User #${userId} initiated Job Discovery Search for "${searchKeywords}"...`);
      let allFound: RealJobPosting[] = [];

      for (const p of selectedPlatforms) {
        if (p === 'linkedin') {
          const lj = await RealJobScraper.scrapeLinkedInJobs(searchKeywords, 'Remote');
          allFound.push(...lj);
        } else if (p === 'indeed') {
          const ij = await RealJobScraper.scrapeIndeedJobs(searchKeywords, 'Remote');
          allFound.push(...ij);
        }
      }

      if (customCareerUrl) {
        addLog(`🌐 Crawling custom career page URL: ${customCareerUrl}...`);
        const cj = await RealJobScraper.crawlCustomCareerUrl(customCareerUrl);
        allFound.push(...cj);
      }

      const savedCount = JobTrackerEngine.saveUserJobs(allFound, userId);
      AuditLogger.log(userId, 'JOB_SEARCH', `Discovered ${allFound.length} jobs (${savedCount} new saved to user queue)`);
      addLog(`✅ Job search completed! Saved ${savedCount} new jobs to User #${userId} queue.`);

      const queued = JobTrackerEngine.getUserQueuedJobs(userId);
      res.json({ success: true, count: savedCount, jobs: queued });
    } catch (err: any) {
      addLog(`❌ Job search error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // 3c. Legacy platform refresh (delegates to user job search)
  app.post('/api/jobs/refresh-platform', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const { platform, query } = req.body;
    const targetPlatform = (platform || 'linkedin').toLowerCase();

    try {
      const found = await RealJobScraper.scrapeLinkedInJobs(query || 'DevOps', 'Remote');
      const savedCount = JobTrackerEngine.saveUserJobs(found, userId);
      const queued = JobTrackerEngine.getUserQueuedJobs(userId);
      res.json({ success: true, count: savedCount, jobs: queued });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3d. Crawl Custom Career URL
  app.post('/api/jobs/crawl-custom-url', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const { careerUrl } = req.body;
    if (!careerUrl) return res.status(400).json({ error: 'careerUrl is required' });

    try {
      addLog(`🌐 Playwright navigating to custom career portal => ${careerUrl}`);
      const matchedJobs = await RealJobScraper.crawlCustomCareerUrl(careerUrl);
      const savedCount = JobTrackerEngine.saveUserJobs(matchedJobs, userId);
      const queued = JobTrackerEngine.getUserQueuedJobs(userId);
      res.json({ success: true, count: savedCount, jobs: queued });
    } catch (err: any) {
      addLog(`❌ Custom career URL crawl failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Swipe Right (Apply)
  app.post('/api/swipe/right', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: 'Job payload missing' });

    JobTrackerEngine.recordJob({
      company: job.company,
      title: job.title,
      location: job.location,
      jobUrl: job.url || job.job_url,
      applyMode: config.mode,
      status: 'applied',
    }, userId);

    SwipeModeHandler.addJobToSwipeQueue({
      company: job.company,
      title: job.title,
      location: job.location,
      url: job.url || job.job_url,
    });

    AuditLogger.log(userId, 'APPLY_JOB', `Applied to ${job.title} at ${job.company}`);
    addLog(`👉 SWIPE RIGHT (Applied): ${job.title} at ${job.company}`);
    res.json({ success: true, status: 'queued' });
  });

  // 5. Swipe Left (Skip)
  app.post('/api/swipe/left', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: 'Job payload missing' });

    JobTrackerEngine.recordJob({
      company: job.company,
      title: job.title,
      location: job.location,
      jobUrl: job.url || job.job_url,
      applyMode: config.mode,
      status: 'skipped',
    }, userId);

    AuditLogger.log(userId, 'SKIP_JOB', `Skipped ${job.title} at ${job.company}`);
    addLog(`👈 SWIPE LEFT (Skipped): ${job.title} at ${job.company}`);
    res.json({ success: true, status: 'skipped' });
  });

  // 6. Application History Endpoint
  app.get('/api/history', AuthService.authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 1;
    const history = JobTrackerEngine.getRecentHistory(userId);
    res.json({ jobs: history });
  });

  // 7. Get Live Agent Logs
  app.get('/api/logs', (req, res) => {
    res.json({ logs });
  });

  // Fallback route -> serve index.html
  app.use((req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`[WebDashboard] 🚀 FastApply Dashboard live at: http://localhost:${port}`);
  });
}
