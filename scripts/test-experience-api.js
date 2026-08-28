/**
 * Test script for Experience API endpoint
 * Tests the /api/candidates/experience POST endpoint with various scenarios
 * 
 * Usage:
 *   node scripts/test-experience-api.js [candidateId]
 * 
 * If candidateId is not provided, you'll need to set it in the script or it will use a test ID
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 Test: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testExperienceAPI(candidateId, testData, expectedStatus, testName) {
  try {
    logInfo(`Sending request to: POST /api/candidates/experience`);
    logInfo(`Candidate ID: ${candidateId}`);
    logInfo(`Request data: ${JSON.stringify(testData, null, 2)}`);

    const response = await fetch(`${BASE_URL}/api/candidates/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId,
        experienceData: testData,
      }),
    });

    const responseData = await response.json();
    const statusCode = response.status;

    logInfo(`Response Status: ${statusCode}`);
    logInfo(`Response Data: ${JSON.stringify(responseData, null, 2)}`);

    if (statusCode === expectedStatus) {
      logSuccess(`Test passed: Expected status ${expectedStatus}, got ${statusCode}`);
      return { success: true, response: responseData };
    } else {
      logError(`Test failed: Expected status ${expectedStatus}, got ${statusCode}`);
      return { success: false, response: responseData, status: statusCode };
    }
  } catch (error) {
    logError(`Test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests(candidateId) {
  if (!candidateId) {
    logError('Candidate ID is required. Please provide it as an argument or set it in the script.');
    logInfo('Usage: node scripts/test-experience-api.js [candidateId]');
    process.exit(1);
  }

  log('\n🚀 Starting Experience API Tests', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Candidate ID: ${candidateId}`, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Test 1: Missing startDate (should fail with 400)
  logTest('Test 1: Missing startDate');
  const test1Data = {
    companyName: 'Test Company',
    designation: 'Software Engineer',
    isCurrent: false,
    industry: 'Technology',
    level: 'Mid',
    companyProfile: 'Test company profile',
    keyAchievements: 'Test achievements',
    experienceType: 'work',
    // startDate is missing - should fail
  };
  const result1 = await testExperienceAPI(candidateId, test1Data, 400, 'Missing startDate');
  results.total++;
  if (result1.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Empty startDate (should fail with 400)
  logTest('Test 2: Empty startDate');
  const test2Data = {
    ...test1Data,
    startDate: '', // Empty string - should fail
  };
  const result2 = await testExperienceAPI(candidateId, test2Data, 400, 'Empty startDate');
  results.total++;
  if (result2.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Valid work experience with startDate (should succeed with 200)
  logTest('Test 3: Valid work experience with startDate');
  const test3Data = {
    companyName: 'Test Company Inc',
    designation: 'Senior Software Engineer',
    startDate: '2020-01-15',
    endDate: '2023-12-31',
    isCurrent: false,
    industry: 'Technology',
    level: 'Senior',
    companyProfile: 'A leading technology company',
    rolesResponsibilities: 'Developed and maintained web applications',
    keyAchievements: 'Led a team of 5 developers',
    experienceType: 'work',
  };
  const result3 = await testExperienceAPI(candidateId, test3Data, 200, 'Valid work experience');
  results.total++;
  if (result3.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Valid internship with startDate (should succeed with 200)
  logTest('Test 4: Valid internship with startDate');
  const test4Data = {
    companyName: 'Internship Company',
    designation: 'Software Development Intern',
    startDate: '2022-06-01',
    endDate: '2022-08-31',
    isCurrent: false,
    industry: 'Technology',
    level: 'Entry',
    companyProfile: 'A tech startup',
    rolesResponsibilities: 'Assisted in development tasks',
    keyAchievements: 'Completed 3 major features',
    experienceType: 'internship',
  };
  const result4 = await testExperienceAPI(candidateId, test4Data, 200, 'Valid internship');
  results.total++;
  if (result4.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Current employment (endDate should be null, should succeed)
  logTest('Test 5: Current employment (no endDate)');
  const test5Data = {
    companyName: 'Current Company',
    designation: 'Lead Developer',
    startDate: '2024-01-01',
    endDate: null, // null for current employment
    isCurrent: true,
    industry: 'Technology',
    level: 'Lead',
    companyProfile: 'Current employer',
    rolesResponsibilities: 'Leading development team',
    keyAchievements: 'Improved system performance by 50%',
    experienceType: 'work',
  };
  const result5 = await testExperienceAPI(candidateId, test5Data, 200, 'Current employment');
  results.total++;
  if (result5.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: startDate with different field name (start_date) - should still work
  logTest('Test 6: startDate as start_date (snake_case)');
  const test6Data = {
    companyName: 'Snake Case Company',
    designation: 'Developer',
    start_date: '2021-03-01', // snake_case instead of camelCase
    end_date: '2021-12-31',
    isCurrent: false,
    industry: 'Technology',
    level: 'Mid',
    companyProfile: 'Test',
    keyAchievements: 'Test',
    experienceType: 'work',
  };
  const result6 = await testExperienceAPI(candidateId, test6Data, 200, 'Snake case field names');
  results.total++;
  if (result6.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: Missing required fields (companyName, designation) - should fail
  logTest('Test 7: Missing companyName');
  const test7Data = {
    // companyName is missing
    designation: 'Developer',
    startDate: '2021-01-01',
    isCurrent: false,
    experienceType: 'work',
  };
  const result7 = await testExperienceAPI(candidateId, test7Data, 400, 'Missing companyName');
  results.total++;
  if (result7.success) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'blue');

  if (results.failed === 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Get candidate ID from command line arguments or use default
const candidateId = process.argv[2];

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  logError('This script requires Node.js 18+ with native fetch support.');
  logInfo('Alternatively, you can install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runTests(candidateId).catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

