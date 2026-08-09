# 🚀 FastApply: Autonomous AI Job Application Agent

**FastApply** is an ultra-fast, intelligent, self-contained AI-powered job application system built with Node.js, TypeScript, and modern Agent SDK architectures. FastApply allows job seekers to auto-apply for up to 250 jobs per day across popular job platforms (LinkedIn, Indeed, Greenhouse, Lever, Workday, etc.).

It features **smart Q&A memory caching** (remembers previously answered questions, detects repeating questions across forms), **automatic job deduplication** (skips already applied roles), and **pluggable Multi-LLM Provider support** (Ollama, OpenAI, Gemini).

---

## 🎯 Core Operating Modes

FastApply supports four flexible application modes:

1. 🤝 **Copilot Mode**: Semi-autonomous assist. AI fills out form fields in real-time on your browser, highlighting edge-case questions for user review before final submission.
2. ⚡ **Full Autonomous Mode**: End-to-end headless execution. AI navigates jobs, extracts application forms, answers questions dynamically using candidate profile memory, and submits automatically.
3. 🕵️ **Stealth Mode**: Evasion-first automation. Uses randomized human mouse paths, realistic typing delays, user-agent jitter, and proxy rotation to bypass strict anti-bot detection systems.
4. 📱 **Swipe Mode**: Tinder-style interactive dashboard UI. Swipe right on jobs to queue background auto-application; swipe left to ignore and skip forever.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │             FastApply Dashboard UI           │
                               │   (Swipe / Copilot / Autonomous / Config)    │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Agent Orchestration Engine         │
                               │        (Task Queue, Deduplication, Logs)     │
                               └───────┬──────────────────────────────┬───────┘
                                       │                              │
                                       ▼                              ▼
┌──────────────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│              Multi-LLM Provider Layer            │    │       Browser Automation & Stealth       │
│  ┌───────────────┐┌──────────────┐┌────────────┐  │    │  ┌───────────────┐┌───────────────────┐  │
│  │ Ollama (Local)││ OpenAI Engine││Gemini Core │  │    │  │ Playwright Core││ Anti-Bot Stealth  │  │
│  └───────────────┘└──────────────┘└────────────┘  │    │  └───────────────┘└───────────────────┘  │
└──────────────────────────────────────────────────┘    └──────────────────────────────────────────┘
                                       │                              │
                                       └───────────────┬──────────────┘
                                                       │
                                                       ▼
                               ┌──────────────────────────────────────────────┐
                               │       Knowledge Base & Q&A Memory Bank       │
                               │  (Resume Data, Question-Answer Cache, DB)    │
                               └──────────────────────────────────────────────┘
```

- **Runtime & Language**: Node.js (v20+ ESM), TypeScript
- **Agent SDK & Framework**: Custom Modular Agent Pipeline (compatible with LangChain / Vercel AI SDK / Direct API integrations)
- **LLM Providers**:
  - 🦙 **Ollama**: Local models (`llama3.2`, `mistral`, `qwen2.5-coder`) for zero-cost & full privacy
  - 🤖 **OpenAI**: `gpt-4o`, `gpt-4o-mini`
  - 💎 **Google Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`
- **Browser Automation**: Playwright + `playwright-extra` + stealth plugins
- **Database & Memory**: SQLite (via Prisma / Drizzle / `better-sqlite3`) for Q&A memory bank, job history, and candidate profiles
- **Frontend Dashboard**: Vite / React / HTML5 with Tailwind or Vanilla CSS

---

## 📂 System Directory Structure

```
fast-track/
├── README.md                    # Project blueprint & Agent guide (this file)
├── package.json                 # Node.js dependencies and run scripts
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variable templates
├── data/                        # SQLite storage & resume uploads
│   ├── fastapply.db             # Local database
│   └── resume.pdf               # User resume source
├── src/
│   ├── index.ts                 # Main CLI entrypoint & server init
│   ├── config/                  # Configuration & environment validation
│   │   └── env.ts
│   ├── llm/                     # Provider Abstraction Layer
│   │   ├── provider.interface.ts # Standard LLM adapter contract
│   │   ├── ollama.provider.ts   # Local Ollama connector
│   │   ├── openai.provider.ts   # OpenAI API connector
│   │   ├── gemini.provider.ts   # Google Gemini API connector
│   │   └── llm.factory.ts       # Dynamic provider factory
│   ├── memory/                  # Q&A Memory & Deduplication Engine
│   │   ├── db.ts                # SQLite database connection
│   │   ├── qa-memory.ts         # Question & answer cache logic
│   │   └── job-tracker.ts       # Job deduplication & status registry
│   ├── browser/                 # Playwright Automation Engine
│   │   ├── browser.factory.ts   # Browser launch & stealth setup
│   │   ├── form-parser.ts       # DOM scanner & form field extractor
│   │   └── stealth.utils.ts     # Human behavior jitter & delays
│   ├── agent/                   # Autonomous Agent Logic
│   │   ├── agent.core.ts        # Main decision loop & plan step runner
│   │   └── prompts.ts           # System prompts for job evaluation & Q&A
│   ├── modes/                   # Operating Mode Handlers
│   │   ├── copilot.mode.ts      # Semi-autonomous interactive runner
│   │   ├── autonomous.mode.ts   # High-throughput full auto runner
│   │   ├── stealth.mode.ts     # Anti-detection evasion runner
│   │   └── swipe.mode.ts        # Swipe queue engine
│   └── web/                     # Web Dashboard UI Server & APIs
│       ├── server.ts            # Fastify / Express server for dashboard UI
│       └── public/              # Web dashboard frontend assets
└── tests/                       # Unit & integration test suites
```

---

## 🤖 AI Agent Autonomous Implementation Roadmap

> **Instructions for the AI Agent**: Execute each phase in order. Verify all tests and builds pass before moving to the next phase.

### Phase 1: Initialization & Environment Setup
- [ ] Initialize `package.json` with TypeScript, Playwright, SQLite driver (`better-sqlite3`), dotenv, and LLM SDKs (`@google/genai`, `openai`, `ollama`).
- [ ] Configure `tsconfig.json` with strict mode, ESM module resolution, and path aliases.
- [ ] Set up `.env.example` with config keys for `LLM_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, `APPLY_MODE`, and `MAX_DAILY_APPLICATIONS`.

### Phase 2: Multi-LLM Provider Layer Construction
- [ ] Define `LLMProvider` interface with unified `generateAnswer(prompt, systemContext)` and `structuredOutput(schema)` methods.
- [ ] Implement `OllamaProvider` using HTTP client / `ollama` SDK.
- [ ] Implement `OpenAIProvider` using standard OpenAI SDK.
- [ ] Implement `GeminiProvider` using official Google Gen AI SDK (`@google/genai`).
- [ ] Build `LLMFactory` to dynamically instantiate providers based on `.env` or user runtime parameter.

### Phase 3: Database & Q&A Memory Engine
- [ ] Setup SQLite schema:
  - `candidate_profile`: Stores personal info, work history, skills, education.
  - `qa_memory`: Stores `(question_hash, question_text, answer, confidence_score)`.
  - `applied_jobs`: Stores `(job_id, company, position, url, applied_at, mode, status)`.
- [ ] Build `QAMemoryEngine`: Matches incoming job form questions against existing cache. If exact match or semantic similarity > 0.85 exists, reuse cached answer. Otherwise, query LLM and save answer.
- [ ] Build `JobTrackerEngine`: Check if job URL or `company + position` already exists in `applied_jobs`. Automatically skip if present.

### Phase 4: Stealth Browser Engine
- [ ] Implement `BrowserFactory` launching Chromium via Playwright with stealth options (`--disable-blink-features=AutomationControlled`, randomized viewports, realistic User-Agents).
- [ ] Write `StealthUtils`: Random delay helpers (`delay(min, max)`), smooth human mouse curve movements, human-like typing speeds with occasional backspaces.
- [ ] Build `FormParser`: DOM scanner that detects `<input>`, `<select>`, `<textarea>`, radio buttons, file upload inputs (`resume`), and custom Shadow-DOM form components.

### Phase 5: Core Agent Orchestrator & Prompts
- [ ] Draft system prompts in `prompts.ts` instructing the LLM to act as an expert career assistant answering job application questions accurately based on candidate profile.
- [ ] Build `AgentCore`: Orchestrates page loading -> form parsing -> memory lookup -> LLM question answering -> field filling -> validation -> form submission.

### Phase 6: Four Application Mode Implementations
- [ ] **Copilot Mode**: Highlights inputs visually, fills in suggested values, waits for user CLI prompt or UI trigger before clicking submit.
- [ ] **Full Autonomous Mode**: Automatically fills forms and clicks submit buttons without waiting, looping through candidate job list until daily cap (e.g. 250) is met.
- [ ] **Stealth Mode**: Enforces extended random delays between applications (2–5 mins), uses proxy rotation, and avoids concurrent requests.
- [ ] **Swipe Mode**: Exposes REST API endpoints `/api/jobs/next`, `/api/jobs/swipe-right`, `/api/jobs/swipe-left` to drive the interactive web frontend.

### Phase 7: Web Dashboard UI
- [ ] Build live Web Dashboard showing:
  - Real-time application feed (Applied, Skipped, Pending).
  - Mode selector dropdown & active LLM provider toggle.
  - Tinder-style "Swipe" card stack interface.
  - Live agent log terminal.

### Phase 8: E2E Verification & Testing
- [ ] Run unit tests for memory caching, LLM provider switching, and form parser.
- [ ] Run full integration test against mock form pages to verify 100% completion rates.

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- npm / pnpm / yarn
- Docker (for running MongoDB)
- Ollama (Optional, if running local LLMs: `ollama run llama3.2`)

### Installation

```bash
# Clone the repository
git clone https://github.com/iamsourabh-in/fast-track.git
cd fast-track

# Install dependencies
npm install

# Start MongoDB locally via Docker
docker run -d --name fast-track-mongo -p 27017:27017 mongo:7.0

# Copy environment template
cp .env.example .env
```

### Configuration (.env)

```env
# Selected LLM Provider: 'ollama' | 'openai' | 'gemini'
LLM_PROVIDER=gemini

# Provider Credentials
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Application Settings
APPLY_MODE=autonomous # 'copilot' | 'autonomous' | 'stealth' | 'swipe'
MAX_DAILY_APPLICATIONS=250
HEADLESS=false
PORT=3000

# Database & Authentication
MONGODB_URI=mongodb://localhost:27017/fasttrack
JWT_SECRET=your_secure_jwt_secret_key
```

### Running FastApply

```bash
# Build the React Frontend and TypeScript Backend
npm run build

# Start the Node.js Server & Web Dashboard
npm start

# For local development with live reload
npm run dev
```

---

## 📄 License

MIT License. Developed for automated job search productivity.
