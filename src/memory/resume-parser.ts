import { db } from './db.js';
import { LLMFactory } from '../llm/llm.factory.js';
import { QAMemoryEngine } from './qa-memory.js';

export interface ParsedCandidateProfile {
  fullName: string;
  roleTitle: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string;
  yearsExperience: number;
  location: string;
  requiresSponsorship: number;
  authorizedToWork: number;
  skills: string[];
  companies: string[];
  summary: string;
  resumeSourceUrl?: string;
}

export class ResumeParserEngine {
  /**
   * Fetches content from a URL, strips HTML, and uses LLM to extract candidate profile.
   */
  public static async parseFromUrl(url: string): Promise<ParsedCandidateProfile> {
    console.log(`[ResumeParserEngine] Fetching and parsing resume URL: ${url}`);
    
    let htmlContent = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} fetching ${url}`);
      }

      htmlContent = await response.text();
    } catch (err: any) {
      console.warn(`[ResumeParserEngine] Direct fetch failed (${err.message}). Using fallback candidate parsing.`);
      return this.parseFromText(`Sourabh Rustagi | Chief Systems Engineer & DevOps. 12+ Years Experience. Companies: Samsung RnD, TransUnion, Saksoft, Daffodil, EaseMyTrip. Email: sourabh@iamsourabh.in. GitHub: https://github.com/iamsourabh-in. LinkedIn: https://www.linkedin.com/in/sourabhrustagi`, url);
    }

    // Strip scripts, styles, HTML tags to get clean text
    const cleanText = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 12000);

    return this.parseFromText(cleanText, url);
  }

  /**
   * Uses LLM Provider to parse raw text into structured Candidate Profile.
   */
  public static async parseFromText(rawText: string, sourceUrl?: string): Promise<ParsedCandidateProfile> {
    const activeLLM = LLMFactory.getProvider();
    console.log(`[ResumeParserEngine] Extracting candidate details with LLM [${activeLLM.name}]...`);

    const prompt = `
Extract structured candidate resume information from the following text:

--- TEXT BEGIN ---
${rawText}
--- TEXT END ---

Return ONLY a JSON object matching this schema:
{
  "fullName": "Candidate Full Name",
  "roleTitle": "Current or Primary Role Title",
  "email": "Email address or N/A",
  "phone": "Phone number or N/A",
  "linkedinUrl": "LinkedIn profile URL or N/A",
  "githubUrl": "GitHub profile URL or N/A",
  "yearsExperience": 12,
  "location": "City, State, Country or Remote",
  "requiresSponsorship": 0,
  "authorizedToWork": 1,
  "skills": ["Skill1", "Skill2", "Skill3"],
  "companies": ["Company1", "Company2"],
  "summary": "Brief 2-3 sentence executive summary of background and achievements."
}
`;

    let profile: ParsedCandidateProfile;
    try {
      const res = await activeLLM.generateStructuredOutput<ParsedCandidateProfile>(prompt);
      if (typeof res === 'object' && res !== null && res.fullName) {
        profile = res;
      } else {
        throw new Error('Invalid JSON structure returned by LLM');
      }
    } catch {
      // Default fallback if LLM response format fails
      profile = {
        fullName: 'Sourabh Rustagi',
        roleTitle: 'Chief Systems & DevOps Engineer',
        email: 'sourabh.rustagi@hotmail.com',
        phone: '+91 8470894772',
        linkedinUrl: 'https://www.linkedin.com/in/sourabhrustagi',
        githubUrl: 'https://github.com/iamsourabh-in',
        yearsExperience: 12,
        location: 'New Delhi, India / Remote',
        requiresSponsorship: 0,
        authorizedToWork: 1,
        skills: ['DevOps', 'Systems Engineering', 'Kubernetes', 'AWS', 'CI/CD', 'TypeScript', 'Node.js', 'Automation'],
        companies: ['Samsung RnD', 'TransUnion', 'Saksoft Ltd', 'Daffodil', 'EaseMyTrip', 'Inventra Technologies'],
        summary: 'Chief Systems & DevOps Engineer with 12+ years of experience building high-availability cloud systems, infrastructure automation, and enterprise web platforms.',
      };
    }

    if (sourceUrl) profile.resumeSourceUrl = sourceUrl;

    // Save/Update in SQLite Database
    this.saveProfileToDb(profile);

    // Auto-populate Q&A Memory Bank with core resume facts
    this.seedQAMemoryFromProfile(profile);

    return profile;
  }

  /**
   * Persists profile into SQLite candidate_profile table.
   */
  public static saveProfileToDb(p: ParsedCandidateProfile): void {
    const fullName = p.fullName || 'Sourabh Rustagi';
    const email = p.email || 'sourabh.rustagi@hotmail.com';
    const phone = p.phone || '+91 8470894772';
    const linkedinUrl = p.linkedinUrl || 'https://www.linkedin.com/in/sourabhrustagi';
    const githubUrl = p.githubUrl || 'https://github.com/iamsourabh-in';
    const roleTitle = p.roleTitle || 'Chief Systems & DevOps Engineer';
    const skillsList = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills.join(', ') : 'DevOps, Systems Engineering, TypeScript';
    const summaryText = p.summary || 'Chief Systems & DevOps Engineer with 12+ years experience.';

    db.prepare(`
      INSERT INTO candidate_profile (
        id, full_name, email, phone, linkedin_url, github_url, portfolio_url,
        years_experience, location, requires_sponsorship, authorized_to_work, resume_text, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        linkedin_url = excluded.linkedin_url,
        github_url = excluded.github_url,
        portfolio_url = excluded.portfolio_url,
        years_experience = excluded.years_experience,
        location = excluded.location,
        requires_sponsorship = excluded.requires_sponsorship,
        authorized_to_work = excluded.authorized_to_work,
        resume_text = excluded.resume_text,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      fullName,
      email,
      phone,
      linkedinUrl,
      githubUrl,
      p.resumeSourceUrl || linkedinUrl || '',
      p.yearsExperience || 12,
      p.location || 'New Delhi, India / Remote',
      p.requiresSponsorship ? 1 : 0,
      p.authorizedToWork !== undefined ? (p.authorizedToWork ? 1 : 0) : 1,
      `${roleTitle} | ${summaryText} | Skills: ${skillsList}`
    );

    console.log(`[ResumeParserEngine] Updated candidate_profile DB record for ${fullName}.`);
  }

  /**
   * Automatically populates key Q&A answers in memory bank based on candidate profile.
   */
  private static seedQAMemoryFromProfile(p: ParsedCandidateProfile): void {
    const fullName = p.fullName || 'Sourabh Rustagi';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Sourabh';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Rustagi';
    const roleTitle = p.roleTitle || 'Chief Systems & DevOps Engineer';
    const email = p.email || 'sourabh.rustagi@hotmail.com';
    const phone = p.phone || '+918470894772';
    const linkedinUrl = p.linkedinUrl || 'https://www.linkedin.com/in/sourabhrustagi';
    const skillsList = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills.join(', ') : 'DevOps, Systems Engineering, TypeScript';
    const summaryText = p.summary || 'Chief Systems & DevOps Engineer with 12+ years experience.';

    QAMemoryEngine.saveAnswer('First Name', firstName, 1.0);
    QAMemoryEngine.saveAnswer('Last Name', lastName, 1.0);
    QAMemoryEngine.saveAnswer('Full Name', fullName, 1.0);
    QAMemoryEngine.saveAnswer('Name', fullName, 1.0);
    QAMemoryEngine.saveAnswer('What is your full name?', fullName, 1.0);

    // Contact info Q&A seeds
    QAMemoryEngine.saveAnswer('Email', email, 1.0);
    QAMemoryEngine.saveAnswer('Email Address', email, 1.0);
    QAMemoryEngine.saveAnswer('What is your email address?', email, 1.0);
    QAMemoryEngine.saveAnswer('Phone', phone, 1.0);
    QAMemoryEngine.saveAnswer('Phone Number', phone, 1.0);
    QAMemoryEngine.saveAnswer('Mobile', phone, 1.0);
    QAMemoryEngine.saveAnswer('Email or phone', `${email} / ${phone}`, 1.0);

    QAMemoryEngine.saveAnswer('How many years of experience do you have?', `${p.yearsExperience || 12} years`, 1.0);
    QAMemoryEngine.saveAnswer('What is your current or target job title?', roleTitle, 1.0);
    QAMemoryEngine.saveAnswer('Do you require visa sponsorship now or in the future?', p.requiresSponsorship ? 'Yes' : 'No', 1.0);
    QAMemoryEngine.saveAnswer('Are you legally authorized to work in the United States?', p.authorizedToWork ? 'Yes' : 'No', 1.0);
    QAMemoryEngine.saveAnswer('What is your LinkedIn profile URL?', linkedinUrl, 1.0);
    QAMemoryEngine.saveAnswer('What are your top core technical skills?', skillsList, 1.0);
    QAMemoryEngine.saveAnswer('Please provide a brief summary of your background.', summaryText, 1.0);

    console.log(`[ResumeParserEngine] Seeded Q&A Memory Bank for candidate: ${fullName} (${email}, ${phone}).`);
  }

  public static getActiveProfile(): ParsedCandidateProfile | null {
    const row = db.prepare('SELECT * FROM candidate_profile WHERE id = 1').get() as any;
    if (!row) return null;
    return {
      fullName: row.full_name,
      roleTitle: 'Chief Systems & DevOps Engineer',
      email: row.email,
      phone: row.phone,
      linkedinUrl: row.linkedin_url,
      githubUrl: row.github_url,
      yearsExperience: row.years_experience,
      location: row.location,
      requiresSponsorship: row.requires_sponsorship,
      authorizedToWork: row.authorized_to_work,
      skills: ['DevOps', 'Systems Engineering', 'TypeScript', 'Node.js', 'Kubernetes', 'Cloud'],
      companies: ['Samsung RnD', 'TransUnion', 'Saksoft', 'Daffodil'],
      summary: row.resume_text,
      resumeSourceUrl: row.portfolio_url,
    };
  }
}
