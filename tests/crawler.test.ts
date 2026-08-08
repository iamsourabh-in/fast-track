import { initDatabase } from '../src/memory/db.js';
import { JobCrawlerEngine } from '../src/browser/job-crawler.js';

async function testCrawler() {
  console.log('🧪 Testing Multi-Platform Job Crawler & Custom Career Page Navigator...');

  initDatabase();

  // Test 1: Refresh platform jobs
  const linkedinJobs = await JobCrawlerEngine.refreshPlatformJobs('linkedin');
  console.log('✅ LinkedIn Jobs Crawled:', linkedinJobs.length);
  if (linkedinJobs.length === 0 || linkedinJobs[0].platform !== 'linkedin') {
    throw new Error('Failed to refresh LinkedIn jobs!');
  }

  const naukriJobs = await JobCrawlerEngine.refreshPlatformJobs('naukri');
  console.log('✅ Naukri Jobs Crawled:', naukriJobs.length);
  if (naukriJobs.length === 0 || naukriJobs[0].platform !== 'naukri') {
    throw new Error('Failed to refresh Naukri jobs!');
  }

  // Test 2: Custom Career URL Crawling
  const customJobs = await JobCrawlerEngine.crawlCustomCareerUrl('https://stripe.com/jobs');
  console.log('✅ Custom Career URL Crawled (stripe.com/jobs):', customJobs.length, 'matched positions found.');
  if (customJobs.length === 0) {
    throw new Error('Failed to crawl custom career URL!');
  }

  console.log('\n🎉 CRAWLER TESTS PASSED!');
}

testCrawler().catch((err) => {
  console.error('❌ Crawler test failed:', err);
  process.exit(1);
});
