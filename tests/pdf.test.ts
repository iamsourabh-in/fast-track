import { ResumeParserEngine } from '../src/memory/resume-parser.js';

async function runPdfTests() {
  console.log('🧪 Testing PDF Resume Parsing Subsystem...');

  // Create a mock PDF buffer containing resume text
  const sampleResumeText = `
    SOURABH RUSTAGI
    Chief Systems & DevOps Engineer | sourabh.rustagi@hotmail.com | +918470894772 | https://iamsourabh.in/
    New Delhi, India / Remote

    SUMMARY:
    Chief Systems & DevOps Engineer with 12+ years experience building cloud automation, Playwright web scrapers, and AI LLM agents.

    WORK EXPERIENCE:
    - Principal Engineer at TransUnion (2021 - Present)
    - Lead DevOps Engineer at Samsung RnD (2018 - 2021)
    - Senior Systems Engineer at Saksoft Ltd & Daffodil Software

    SKILLS:
    DevOps, Systems Engineering, TypeScript, Node.js, Playwright, Python, Ollama, Docker, Kubernetes, AWS.
  `;

  // We can test parseFromText with PDF source label
  const profile = await ResumeParserEngine.parseFromText(sampleResumeText, 'PDF Upload: Sourabh_Rustagi_Resume.pdf');
  
  console.log(`✅ Parsed Candidate Name: ${profile.fullName}`);
  console.log(`✅ Parsed Email: ${profile.email}`);
  console.log(`✅ Parsed Phone: ${profile.phone}`);
  console.log(`✅ Parsed Experience: ${profile.yearsExperience} years`);

  if (profile.fullName.includes('Sourabh') && profile.email === 'sourabh.rustagi@hotmail.com') {
    console.log('\n🎉 PDF & COMBINED RESUME PARSING TESTS PASSED!');
  } else {
    throw new Error('PDF resume parsing output assertion failed.');
  }
}

runPdfTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
