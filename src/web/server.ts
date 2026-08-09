import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { config, LLMProviderType, ApplyModeType } from '../config/env.js';
import { LLMFactory } from '../llm/llm.factory.js';
import { JobTrackerEngine } from '../memory/job-tracker.js';
import { QAMemoryEngine } from '../memory/qa-memory.js';
import { User, AuditLog, CandidateProfile, QAMemory, UserJob, AppliedJob } from '../memory/mongo.js';
import { ResumeParserEngine } from '../memory/resume-parser.js';
import { RealJobScraper, RealJobPosting } from '../browser/real-job-scraper.js';
import { AgentStateTracker } from '../agent/agent-state.js';
import { AgentCore } from '../agent/agent.core.js';
import { BrowserFactory } from '../browser/browser.factory.js';
import { AuthService, AuthenticatedRequest } from '../auth/auth.service.js';
import { AuditLogger } from '../memory/audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export function startDashboardServer(port: number = config.port) {
  const app = express();
  app.use(cors());
  app.use(express.json());

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

  // Global console interceptor to stream ALL background agent logs live to Web UI
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

  // ────────────────────────────────────────────────────
  // Authentication & Security Routes
  // ────────────────────────────────────────────────────

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

  // ────────────────────────────────────────────────────
  // Dashboard Stats & Config
  // ────────────────────────────────────────────────────

  app.get('/api/stats', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const qaStats = await QAMemoryEngine.getStats(userId);
      const dailyApplied = await JobTrackerEngine.getDailyAppliedCount(userId);
      const candidate = await ResumeParserEngine.getActiveProfile(userId);

      res.json({
        activeProvider: LLMFactory.getActiveProviderName(),
        activeMode: config.mode,
        dailyApplied,
        maxDaily: config.maxDailyApplications,
        qaTotalAnswers: qaStats.totalAnswers,
        qaTotalReuses: qaStats.totalReuses,
        candidate,
        swipeQueueLength: 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/agent/status', (req, res) => {
    const state = AgentStateTracker.getState();
    res.json(state);
  });

  // Switch Provider or Mode dynamically
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

  // ────────────────────────────────────────────────────
  // Q&A Memory Bank Management Endpoints
  // ────────────────────────────────────────────────────

  app.get('/api/memory/qa', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const memories = await QAMemoryEngine.getAllMemories(userId);
    res.json({ memories });
  });

  app.post('/api/memory/qa/update', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { id, answer } = req.body;
    if (!id || answer === undefined) return res.status(400).json({ error: 'id and answer are required' });
    const success = await QAMemoryEngine.updateMemory(String(id), String(answer), userId);
    addLog(`✏️ Updated Q&A Memory ID #${id} => "${answer}"`);
    res.json({ success });
  });

  app.delete('/api/memory/qa/:id', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const id = req.params.id;
    const success = await QAMemoryEngine.deleteMemory(id, userId);
    addLog(`🗑️ Deleted Q&A Memory ID #${id}`);
    res.json({ success });
  });

  app.post('/api/memory/qa/clear', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    await QAMemoryEngine.clearAllMemories(userId);
    addLog(`🧹 Cleared all Q&A Memories from cache.`);
    res.json({ success: true });
  });

  // ────────────────────────────────────────────────────
  // Resume Profile Endpoints
  // ────────────────────────────────────────────────────

  app.get('/api/resume', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const profile = await ResumeParserEngine.getActiveProfile(userId);
    res.json({ profile });
  });

  app.post('/api/resume/parse-url', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      addLog(`📄 Parsing Candidate Resume URL => ${url}`);
      const profile = await ResumeParserEngine.parseFromUrl(url, userId);
      addLog(`✅ Successfully parsed profile: ${profile.fullName} (${profile.roleTitle}, ${profile.yearsExperience} YOE)`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Failed to parse resume URL: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/resume/upload-pdf', AuthService.authenticateToken, upload.single('resumePdf'), async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    try {
      addLog(`📄 Uploaded PDF resume: ${req.file.originalname} (${req.file.size} bytes)`);
      const profile = await ResumeParserEngine.parseFromPdfBuffer(req.file.buffer, req.file.originalname, userId);
      addLog(`✅ Successfully extracted candidate profile from PDF: ${profile.fullName} (${profile.roleTitle})`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Failed to parse PDF resume: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/resume/synthesize', AuthService.authenticateToken, upload.single('resumePdf'), async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const webUrl = req.body.url;
    const pdfBuffer = req.file?.buffer;
    const pdfFilename = req.file?.originalname;

    try {
      addLog(`🚀 Synthesizing profile from PDF (${pdfFilename || 'None'}) & Website (${webUrl || 'None'})...`);
      const profile = await ResumeParserEngine.parseCombinedSource(pdfBuffer, pdfFilename, webUrl, userId);
      addLog(`✅ Combined synthesis complete! Updated profile for ${profile.fullName}`);
      res.json({ success: true, profile });
    } catch (err: any) {
      addLog(`❌ Synthesis failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/candidate/update', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const p = req.body;
    if (!p.fullName) return res.status(400).json({ error: 'fullName is required' });

    try {
      await ResumeParserEngine.saveProfileToDb(p, userId);
      addLog(`💾 Updated candidate profile facts for ${p.fullName}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ────────────────────────────────────────────────────
  // Job Search & Swipe Endpoints
  // ────────────────────────────────────────────────────

  app.get('/api/swipe/feed', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const queued = await JobTrackerEngine.getUserQueuedJobs(userId);
    res.json({ jobs: queued });
  });

  app.post('/api/jobs/search', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
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

      const savedCount = await JobTrackerEngine.saveUserJobs(allFound, userId);
      await AuditLogger.log(userId, 'JOB_SEARCH', `Discovered ${allFound.length} jobs (${savedCount} new saved to user queue)`);
      addLog(`✅ Job search completed! Saved ${savedCount} new jobs to User #${userId} queue.`);

      const queued = await JobTrackerEngine.getUserQueuedJobs(userId);
      res.json({ success: true, count: savedCount, jobs: queued });
    } catch (err: any) {
      addLog(`❌ Job search error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/swipe/right', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: 'Job payload missing' });

    // Respond immediately so UI can swipe animation doesn't hang
    res.json({ success: true, status: 'queued' });

    // Run Agent in background
    setTimeout(async () => {
      try {
        await AuditLogger.log(userId, 'APPLY_JOB_START', `Agent initiating application to ${job.title} at ${job.company}`);
        addLog(`👉 SWIPE RIGHT (Initiated): ${job.title} at ${job.company}`);
        
        const { page, context } = await BrowserFactory.createPage();
        
        await AgentCore.processApplication(page, {
          company: job.company,
          title: job.title,
          location: job.location,
          url: job.url || job.job_url,
        }, config.mode, userId);

        await BrowserFactory.closeAll();
      } catch (err: any) {
        addLog(`❌ Agent execution error: ${err.message}`);
        await AuditLogger.log(userId, 'AGENT_ERROR', err.message);
      }
    }, 100);
  });

  app.post('/api/swipe/left', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { job } = req.body;
    if (!job) return res.status(400).json({ error: 'Job payload missing' });

    await JobTrackerEngine.recordJob({
      company: job.company,
      title: job.title,
      location: job.location,
      jobUrl: job.url || job.job_url,
      applyMode: config.mode,
      status: 'skipped',
    }, userId);

    await AuditLogger.log(userId, 'SKIP_JOB', `Skipped ${job.title} at ${job.company}`);
    addLog(`👈 SWIPE LEFT (Skipped): ${job.title} at ${job.company}`);
    res.json({ success: true, status: 'skipped' });
  });

  // ────────────────────────────────────────────────────
  // History & Audit Logs
  // ────────────────────────────────────────────────────

  app.get('/api/history', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const history = await JobTrackerEngine.getRecentHistory(userId);
    res.json({ jobs: history });
  });

  app.get('/api/audit-logs', AuthService.authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const auditLogs = await AuditLogger.getLogs(userId, 50);
    res.json({ logs: auditLogs });
  });

  // ────────────────────────────────────────────────────
  // Live Agent Logs
  // ────────────────────────────────────────────────────

  app.get('/api/logs', (req, res) => {
    res.json({ logs });
  });

  // ────────────────────────────────────────────────────
  // Database Reset
  // ────────────────────────────────────────────────────

  app.post('/api/db/reset', async (req, res) => {
    try {
      await CandidateProfile.deleteMany({});
      await QAMemory.deleteMany({});
      await UserJob.deleteMany({});
      await AppliedJob.deleteMany({});
      await AuditLog.deleteMany({});
      await User.deleteMany({});

      addLog(`💣 RESET DATABASE: Purged candidate profiles, Q&A memories, user jobs, history, and audit logs.`);
      res.json({ success: true, message: 'Database reset successfully!' });
    } catch (err: any) {
      addLog(`❌ Database reset failed: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  // Fallback route -> serve index.html
  app.use((req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`[WebDashboard] 🚀 FastApply Dashboard live at: http://localhost:${port}`);
  });
}
