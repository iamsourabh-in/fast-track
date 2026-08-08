import { initDatabase } from '../src/memory/db.js';
import { LLMFactory } from '../src/llm/llm.factory.js';
import { QAMemoryEngine } from '../src/memory/qa-memory.js';
import { JobTrackerEngine } from '../src/memory/job-tracker.js';

async function runTests() {
  console.log('🧪 Starting FastApply Unit & Integration Tests...');

  // Test 1: DB Initialization
  initDatabase();
  console.log('✅ Test 1 Passed: Database schema initialized.');

  // Test 2: LLM Provider Factory Switching
  const gemini = LLMFactory.getProvider('gemini');
  if (gemini.name !== 'gemini') throw new Error('Failed to get Gemini provider');

  const ollama = LLMFactory.getProvider('ollama');
  if (ollama.name !== 'ollama') throw new Error('Failed to get Ollama provider');

  const openai = LLMFactory.getProvider('openai');
  if (openai.name !== 'openai') throw new Error('Failed to get OpenAI provider');
  console.log('✅ Test 2 Passed: Dynamic LLM Provider switching works (Gemini, Ollama, OpenAI).');

  // Test 3: Q&A Memory Cache & Reuse
  QAMemoryEngine.saveAnswer('How many years of experience do you have with TypeScript?', '5 years', 0.98);
  const found = QAMemoryEngine.findAnswer('years of experience with TypeScript');
  if (!found || !found.answer.includes('5')) {
    throw new Error('QAMemoryEngine lookup failed!');
  }
  console.log(`✅ Test 3 Passed: Q&A Memory Engine matched question "${found.question_raw}" => "${found.answer}"`);

  // Test 4: Job Deduplication Tracker
  const testJobUrl = `https://testcorp.com/job/${Date.now()}`;
  const isDupBefore = JobTrackerEngine.isAlreadyProcessed('TestCorp', 'AI Engineer', testJobUrl);
  if (isDupBefore) throw new Error('Should not be duplicate before recording');

  JobTrackerEngine.recordJob({
    company: 'TestCorp',
    title: 'AI Engineer',
    jobUrl: testJobUrl,
    applyMode: 'autonomous',
    status: 'applied',
  });

  const isDupAfter = JobTrackerEngine.isAlreadyProcessed('TestCorp', 'AI Engineer', testJobUrl);
  if (!isDupAfter) throw new Error('Should be detected as duplicate after recording');
  console.log('✅ Test 4 Passed: Job Deduplication Tracker successfully prevents duplicate applications.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((e) => {
  console.error('❌ Test execution failed:', e);
  process.exit(1);
});
