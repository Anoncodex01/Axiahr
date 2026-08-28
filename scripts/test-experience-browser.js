/**
 * Browser-based test script for Experience API
 * 
 * This script can be run in the browser console while logged in as a candidate.
 * It tests the experience submission functionality directly from the browser.
 * 
 * Usage:
 *   1. Open your browser's developer console (F12)
 *   2. Navigate to the candidate profile page while logged in
 *   3. Copy and paste this entire script into the console
 *   4. The tests will run automatically
 */

(function() {
  'use strict';

  // Colors for console output (browser-safe)
  const log = {
    success: (msg) => console.log('%c✅ ' + msg, 'color: green; font-weight: bold'),
    error: (msg) => console.log('%c❌ ' + msg, 'color: red; font-weight: bold'),
    warning: (msg) => console.log('%c⚠️  ' + msg, 'color: orange; font-weight: bold'),
    info: (msg) => console.log('%cℹ️  ' + msg, 'color: blue; font-weight: bold'),
    test: (msg) => console.log('%c🧪 ' + msg, 'color: cyan; font-weight: bold'),
  };

  // Get candidate ID from localStorage
  function getCandidateId() {
    try {
      const candidateUser = localStorage.getItem('candidateUser');
      const candidateData = localStorage.getItem('candidateData');
      
      if (candidateUser) {
        const data = JSON.parse(candidateUser);
        if (data.id) return data.id;
      }
      
      if (candidateData) {
        const data = JSON.parse(candidateData);
        if (data.id || data.candidateId) return data.id || data.candidateId;
      }
      
      return null;
    } catch (error) {
      log.error('Error getting candidate ID: ' + error.message);
      return null;
    }
  }

  // Test function
  async function testExperienceAPI(testData, expectedStatus, testName) {
    const candidateId = getCandidateId();
    
    if (!candidateId) {
      log.error('Cannot find candidate ID in localStorage. Please make sure you are logged in.');
      return { success: false, error: 'No candidate ID' };
    }

    log.test(`Running: ${testName}`);
    log.info(`Candidate ID: ${candidateId}`);
    log.info(`Request data: ${JSON.stringify(testData, null, 2)}`);

    try {
      const response = await fetch('/api/candidates/experience', {
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

      log.info(`Response Status: ${statusCode}`);
      log.info(`Response Data: ${JSON.stringify(responseData, null, 2)}`);

      if (statusCode === expectedStatus) {
        log.success(`✓ Test passed: Expected status ${expectedStatus}, got ${statusCode}`);
        return { success: true, response: responseData };
      } else {
        log.error(`✗ Test failed: Expected status ${expectedStatus}, got ${statusCode}`);
        return { success: false, response: responseData, status: statusCode };
      }
    } catch (error) {
      log.error(`Test error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Run all tests
  async function runTests() {
    console.log('%c🚀 Starting Experience API Browser Tests', 'color: cyan; font-size: 16px; font-weight: bold');
    console.log('='.repeat(60));

    const candidateId = getCandidateId();
    if (!candidateId) {
      log.error('Please log in first and navigate to the candidate profile page.');
      return;
    }

    log.info(`Candidate ID: ${candidateId}`);
    log.info('Running tests...\n');

    const results = {
      passed: 0,
      failed: 0,
      total: 0,
    };

    // Test 1: Missing startDate (should fail)
    console.log('\n' + '='.repeat(60));
    log.test('Test 1: Missing startDate (should fail with 400)');
    const test1 = await testExperienceAPI({
      companyName: 'Test Company',
      designation: 'Software Engineer',
      isCurrent: false,
      industry: 'Technology',
      level: 'Mid',
      experienceType: 'work',
    }, 400, 'Missing startDate');
    results.total++;
    if (test1.success) results.passed++; else results.failed++;

    // Test 2: Empty startDate (should fail)
    console.log('\n' + '='.repeat(60));
    log.test('Test 2: Empty startDate (should fail with 400)');
    const test2 = await testExperienceAPI({
      companyName: 'Test Company',
      designation: 'Software Engineer',
      startDate: '',
      isCurrent: false,
      experienceType: 'work',
    }, 400, 'Empty startDate');
    results.total++;
    if (test2.success) results.passed++; else results.failed++;

    // Test 3: Valid experience (should succeed)
    console.log('\n' + '='.repeat(60));
    log.test('Test 3: Valid work experience (should succeed with 200)');
    const test3 = await testExperienceAPI({
      companyName: 'Test Company Inc',
      designation: 'Senior Software Engineer',
      startDate: '2020-01-15',
      endDate: '2023-12-31',
      isCurrent: false,
      industry: 'Technology',
      level: 'Senior',
      companyProfile: 'A leading technology company',
      rolesResponsibilities: 'Developed web applications',
      keyAchievements: 'Led a team of developers',
      experienceType: 'work',
    }, 200, 'Valid work experience');
    results.total++;
    if (test3.success) results.passed++; else results.failed++;

    // Test 4: Valid internship (should succeed)
    console.log('\n' + '='.repeat(60));
    log.test('Test 4: Valid internship (should succeed with 200)');
    const test4 = await testExperienceAPI({
      companyName: 'Internship Company',
      designation: 'Software Development Intern',
      startDate: '2022-06-01',
      endDate: '2022-08-31',
      isCurrent: false,
      industry: 'Technology',
      level: 'Entry',
      companyProfile: 'A tech startup',
      rolesResponsibilities: 'Assisted in development',
      keyAchievements: 'Completed major features',
      experienceType: 'internship',
    }, 200, 'Valid internship');
    results.total++;
    if (test4.success) results.passed++; else results.failed++;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('%c📊 Test Summary', 'color: cyan; font-size: 14px; font-weight: bold');
    console.log('='.repeat(60));
    log.info(`Total Tests: ${results.total}`);
    log.success(`Passed: ${results.passed}`);
    log.error(`Failed: ${results.failed}`);
    log.info(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
      console.log('%c\n🎉 All tests passed!', 'color: green; font-size: 16px; font-weight: bold');
    } else {
      console.log('%c\n⚠️  Some tests failed. Please review the output above.', 'color: orange; font-size: 14px; font-weight: bold');
    }

    return results;
  }

  // Auto-run tests
  console.log('%cExperience API Test Script Loaded', 'color: green; font-weight: bold');
  console.log('Starting tests in 1 second...\n');
  
  setTimeout(() => {
    runTests().catch(error => {
      log.error('Fatal error: ' + error.message);
      console.error(error);
    });
  }, 1000);

  // Export for manual testing
  window.testExperienceAPI = testExperienceAPI;
  window.runExperienceTests = runTests;
  console.log('\n%c💡 Tip: You can manually run tests using:', 'color: blue; font-style: italic');
  console.log('%c   window.runExperienceTests()', 'color: gray; font-family: monospace');
})();

