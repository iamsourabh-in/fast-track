import { initDatabase } from '../src/memory/db.js';
import { RealJobScraper } from '../src/browser/real-job-scraper.js';

async function testRealScraper() {
  console.log('🧪 Testing Real Job Scraper on live websites...');
  initDatabase();

  // Test 1: Real LinkedIn scraping
  console.log('1️⃣ Scraping live LinkedIn jobs for "DevOps"...');
  const linkedInJobs = await RealJobScraper.scrapeLinkedInJobs('DevOps', 'Remote');
  console.log(`✅ Scraped ${linkedInJobs.length} live LinkedIn jobs!`);
  if (linkedInJobs.length > 0) {
    console.log('Sample LinkedIn Job:', linkedInJobs[0].title, 'at', linkedInJobs[0].company, 'URL:', linkedInJobs[0].url);
  }

  // Test 2: Real Custom Career URL crawling
  console.log('\n2️⃣ Crawling real custom career page (https://boards.greenhouse.io)...');
  const customJobs = await RealJobScraper.crawlCustomCareerUrl('https://boards.greenhouse.io');
  console.log(`✅ Crawled ${customJobs.length} live application links!`);

  console.log('\n🎉 REAL SCRAPER TEST COMPLETED SUCCESSFULLY!');
}

testRealScraper().catch((err) => {
  console.error('❌ Real scraper test error:', err);
  process.exit(1);
});
