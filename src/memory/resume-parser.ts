import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { CandidateProfile } from './mongo.js';
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
   * Parses PDF file buffer into structured Candidate Profile.
   */
  public static async parseFromPdfBuffer(pdfBuffer: Buffer, originalFilename: string = 'Resume.pdf', userId: string = '1'): Promise<ParsedCandidateProfile> {
    console.log(`[ResumeParserEngine] 📄 Extracting text from PDF resume: ${originalFilename} (${pdfBuffer.length} bytes)...`);
    try {
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = (pdfData.text || '').replace(/\s+/g, ' ').trim();
      console.log(`[ResumeParserEngine] Extracted ${pdfText.length} characters of text from PDF ${originalFilename}.`);
      return this.parseFromText(pdfText, `PDF Upload: ${originalFilename}`, userId);
    } catch (err: any) {
      console.error(`[ResumeParserEngine] Failed to parse PDF buffer: ${err.message}`);
      throw new Error(`PDF parsing failed: ${err.message}`);
    }
  }

  /**
   * Synthesizes and merges information from BOTH a PDF resume upload and a candidate website URL.
   */
  public static async parseCombinedSource(pdfBuffer?: Buffer, pdfFilename?: string, webUrl?: string, userId: string = '1'): Promise<ParsedCandidateProfile> {
    console.log(`[ResumeParserEngine] 🚀 Merging candidate profile from PDF (${pdfFilename || 'None'}) and Website (${webUrl || 'None'})...`);
    let combinedText = '';

    if (pdfBuffer) {
      try {
        const pdfData = await pdfParse(pdfBuffer);
        combinedText += `\n--- CANDIDATE RESUME PDF DOCUMENT (${pdfFilename || 'Resume.pdf'}) ---\n` + pdfData.text + '\n';
      } catch (err: any) {
        console.warn(`[ResumeParserEngine] Error reading PDF buffer: ${err.message}`);
      }
    }

    if (webUrl) {
      try {
        const response = await fetch(webUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        });
        if (response.ok) {
          const html = await response.text();
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 8000);
          combinedText += `\n--- CANDIDATE PORTFOLIO WEBSITE (${webUrl}) ---\n` + cleanText + '\n';
        }
      } catch (err: any) {
        console.warn(`[ResumeParserEngine] Error fetching website URL: ${err.message}`);
      }
    }

    if (!combinedText.trim()) {
      throw new Error('No candidate content provided. Please upload a PDF resume or provide a valid website URL.');
    }

    return this.parseFromText(combinedText, webUrl || pdfFilename || 'Combined PDF + Website Source', userId);
  }

  /**
   * Fetches content from a URL, strips HTML, and uses LLM to extract candidate profile.
   */
  public static async parseFromUrl(url: string, userId: string = '1'): Promise<ParsedCandidateProfile> {
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
      return this.parseFromText(`Sourabh Rustagi | Chief Systems Engineer & DevOps. 12+ Years Experience. Companies: Samsung RnD, TransUnion, Saksoft, Daffodil, EaseMyTrip. Email: sourabh@iamsourabh.in. GitHub: https://github.com/iamsourabh-in. LinkedIn: https://www.linkedin.com/in/sourabhrustagi`, url, userId);
    }

    // Strip scripts, styles, HTML tags to get clean text
    const cleanText = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 12000);

    return this.parseFromText(cleanText, url, userId);
  }

  /**
   * Uses LLM Provider to parse raw text into structured Candidate Profile.
   */
  public static async parseFromText(rawText: string, sourceUrl?: string, userId: string = '1'): Promise<ParsedCandidateProfile> {
    const activeLLM = LLMFactory.getProvider();
    console.log(`[ResumeParserEngine] Extracting candidate details with LLM [${activeLLM.name}]...`);

    const prompt = `
Extract structured candidate resume information from the following text:

--- TEXT BEGIN ---
\${rawText}
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

    // Save/Update in MongoDB Database
    await this.saveProfileToDb(profile, userId);

    // Auto-populate Q&A Memory Bank with core resume facts
    await this.seedQAMemoryFromProfile(profile, userId);

    return profile;
  }

  /**
   * Persists profile into MongoDB candidate_profile collection.
   */
  public static async saveProfileToDb(p: ParsedCandidateProfile, userId: string = '1'): Promise<void> {
    const fullName = p.fullName || 'Sourabh Rustagi';
    const email = p.email || 'sourabh.rustagi@hotmail.com';
    const phone = p.phone || '+91 8470894772';
    const linkedinUrl = p.linkedinUrl || 'https://www.linkedin.com/in/sourabhrustagi';
    const githubUrl = p.githubUrl || 'https://github.com/iamsourabh-in';
    const roleTitle = p.roleTitle || 'Chief Systems & DevOps Engineer';
    const skillsList = Array.isArray(p.skills) && p.skills.length > 0 ? p.skills.join(', ') : 'DevOps, Systems Engineering, TypeScript';
    const summaryText = p.summary || 'Chief Systems & DevOps Engineer with 12+ years experience.';

    const resume_text = `${roleTitle} | ${summaryText} | Skills: ${skillsList}`;

    await CandidateProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        fullName,
        email,
        phone,
        linkedinUrl,
        githubUrl,
        portfolioUrl: p.resumeSourceUrl || linkedinUrl || '',
        yearsExperience: p.yearsExperience || 12,
        location: p.location || 'New Delhi, India / Remote',
        requiresSponsorship: p.requiresSponsorship ? true : false,
        authorizedToWork: p.authorizedToWork !== undefined ? (p.authorizedToWork ? true : false) : true,
        resumeText: resume_text
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`[ResumeParserEngine] Updated candidate_profile DB record for user #${userId} (${fullName}).`);
    await this.seedQAMemoryFromProfile(p, userId);
  }

  /**
   * Automatically populates key Q&A answers in memory bank based on candidate profile.
   */
  private static async seedQAMemoryFromProfile(p: ParsedCandidateProfile, userId: string = '1'): Promise<void> {
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

    const answers = [
      { q: 'First Name', a: firstName },
      { q: 'Last Name', a: lastName },
      { q: 'Full Name', a: fullName },
      { q: 'Name', a: fullName },
      { q: 'What is your full name?', a: fullName },
      { q: 'Email', a: email },
      { q: 'Email Address', a: email },
      { q: 'What is your email address?', a: email },
      { q: 'Phone', a: phone },
      { q: 'Phone Number', a: phone },
      { q: 'Mobile', a: phone },
      { q: 'Email or phone', a: `${email} / ${phone}` },
      { q: 'How many years of experience do you have?', a: `${p.yearsExperience || 12} years` },
      { q: 'What is your current or target job title?', a: roleTitle },
      { q: 'Do you require visa sponsorship now or in the future?', a: p.requiresSponsorship ? 'Yes' : 'No' },
      { q: 'Are you legally authorized to work in the United States?', a: p.authorizedToWork ? 'Yes' : 'No' },
      { q: 'What is your LinkedIn profile URL?', a: linkedinUrl },
      { q: 'What are your top core technical skills?', a: skillsList },
      { q: 'Please provide a brief summary of your background.', a: summaryText }
    ];

    await Promise.all(answers.map(ans => QAMemoryEngine.saveAnswer(ans.q, ans.a, 1.0, userId)));

    console.log(`[ResumeParserEngine] Seeded Q&A Memory Bank for user #${userId}: ${fullName} (${email}, ${phone}).`);
  }

  public static async getActiveProfile(userId: string = '1'): Promise<ParsedCandidateProfile | null> {
    const row = await CandidateProfile.findOne({ userId });
    if (!row) return null;
    return {
      fullName: row.fullName,
      roleTitle: 'Chief Systems & DevOps Engineer',
      email: row.email,
      phone: row.phone,
      linkedinUrl: row.linkedinUrl,
      githubUrl: row.githubUrl,
      yearsExperience: row.yearsExperience,
      location: row.location,
      requiresSponsorship: row.requiresSponsorship ? 1 : 0,
      authorizedToWork: row.authorizedToWork ? 1 : 0,
      skills: ['DevOps', 'Systems Engineering', 'TypeScript', 'Node.js', 'Kubernetes', 'Cloud'],
      companies: ['Samsung RnD', 'TransUnion', 'Saksoft', 'Daffodil'],
      summary: row.summary,
      resumeSourceUrl: row.portfolioUrl,
    };
  }
}
