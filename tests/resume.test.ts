import { initDatabase } from '../src/memory/db.js';
import { ResumeParserEngine } from '../src/memory/resume-parser.js';
import { QAMemoryEngine } from '../src/memory/qa-memory.js';

async function testResumeParsing() {
  console.log('🧪 Testing Resume URL & Profile Parsing Engine...');

  initDatabase();

  // Test 1: Parse from text / URL
  const profile = await ResumeParserEngine.parseFromUrl('https://iamsourabh.in/');
  console.log('✅ Parsed Profile Candidate:', profile.fullName);
  console.log('✅ Parsed Title:', profile.roleTitle);
  console.log('✅ Parsed Experience:', profile.yearsExperience, 'years');

  if (!profile.fullName || profile.yearsExperience === undefined) {
    throw new Error('Failed to parse candidate profile!');
  }

  // Test 2: Verify Q&A Memory auto-seeding
  const expAnswer = QAMemoryEngine.findAnswer('How many years of experience do you have?');
  if (!expAnswer) {
    throw new Error('QAMemoryEngine was not seeded with resume experience!');
  }

  console.log(`✅ Q&A Memory Bank seeded successfully: "${expAnswer.question_raw}" => "${expAnswer.answer}"`);
  console.log('\n🎉 RESUME PARSER TESTS PASSED!');
}

testResumeParsing().catch((err) => {
  console.error('❌ Resume test failed:', err);
  process.exit(1);
});
