import { AuthService } from '../src/auth/auth.service.js';
import { AuditLogger } from '../src/memory/audit-logger.js';
import { initDatabase } from '../src/memory/db.js';

async function runAuthTests() {
  console.log('🧪 Testing Multi-User Auth & Audit Trail Subsystem...');
  initDatabase();

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Test SaaS Candidate';

  // 1. Test User Registration
  console.log(`1️⃣ Testing registration for ${testEmail}...`);
  const regResult = await AuthService.register(testEmail, testPassword, testName, '192.168.1.100');
  console.log(`✅ Registered User ID #${regResult.user.id} with JWT token!`);

  // 2. Test User Login
  console.log(`2️⃣ Testing login authentication...`);
  const loginResult = await AuthService.login(testEmail, testPassword, '192.168.1.100');
  console.log(`✅ Logged in user: ${loginResult.user.email}`);

  // 3. Test Audit Log retrieval
  console.log(`3️⃣ Retrieving audit trail logs for user #${regResult.user.id}...`);
  const logs = AuditLogger.getLogs(regResult.user.id);
  console.log(`✅ Found ${logs.length} audit trail entries for user #${regResult.user.id}!`);

  const actions = logs.map(l => l.action);
  if (logs.length >= 2 && actions.includes('LOGIN') && actions.includes('REGISTER')) {
    console.log('\n🎉 ALL MULTI-USER AUTH & AUDIT LOG TESTS PASSED!');
  } else {
    throw new Error('Audit log assertion failed.');
  }
}

runAuthTests().catch(err => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
