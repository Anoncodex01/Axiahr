# Experience API Test Scripts

This directory contains test scripts for validating the Experience API endpoint functionality, specifically testing the `startDate` validation fix.

## Available Test Scripts

### 1. Node.js Test Script (`test-experience-api.js`)

A comprehensive Node.js script that tests the Experience API endpoint with various scenarios.

**Requirements:**
- Node.js 18+ (for native `fetch` support)
- Running Next.js development server (default: `http://localhost:3000`)

**Usage:**

```bash
# Using npm script
npm run test:experience [candidateId]

# Or directly with node
node scripts/test-experience-api.js [candidateId]
```

**Example:**
```bash
npm run test:experience 32
```

**What it tests:**
1. ✅ Missing `startDate` - should fail with 400
2. ✅ Empty `startDate` - should fail with 400
3. ✅ Valid work experience with `startDate` - should succeed with 200
4. ✅ Valid internship with `startDate` - should succeed with 200
5. ✅ Current employment (no endDate) - should succeed with 200
6. ✅ Snake case field names (`start_date`) - should still work
7. ✅ Missing required fields - should fail with 400

**Environment Variables:**
- `NEXT_PUBLIC_BASE_URL` - Base URL for the API (default: `http://localhost:3000`)

### 2. Browser Test Script (`test-experience-browser.js`)

A browser-based test script that can be run directly in the browser console.

**Requirements:**
- Browser with developer console
- Logged in as a candidate
- Navigate to candidate profile page

**Usage:**

1. Open your browser's developer console (F12)
2. Navigate to `/candidate/profile` while logged in
3. Copy and paste the entire contents of `test-experience-browser.js` into the console
4. Tests will run automatically

**Manual execution:**
```javascript
// After loading the script, you can manually run tests
window.runExperienceTests();

// Or test individual scenarios
window.testExperienceAPI({
  companyName: 'Test',
  designation: 'Developer',
  startDate: '2020-01-01',
  experienceType: 'work'
}, 200, 'My custom test');
```

## Test Scenarios Covered

### Validation Tests (Should Fail)
- ❌ Missing `startDate` field
- ❌ Empty `startDate` string
- ❌ Missing `companyName`
- ❌ Missing `designation`

### Success Tests (Should Pass)
- ✅ Valid work experience with all required fields
- ✅ Valid internship with all required fields
- ✅ Current employment (isCurrent: true, endDate: null)
- ✅ Different field name formats (camelCase vs snake_case)

## Expected Results

After running the tests, you should see:

```
📊 Test Summary
============================================================
Total Tests: 7
✅ Passed: 7
❌ Failed: 0
Success Rate: 100.0%

🎉 All tests passed!
```

## Troubleshooting

### "Cannot find candidate ID"
- Make sure you're logged in as a candidate
- Check that `localStorage` contains `candidateUser` or `candidateData`
- For Node.js script, provide candidate ID as argument

### "Network error" or "Connection refused"
- Ensure the Next.js development server is running
- Check that `BASE_URL` is correct
- Verify the API endpoint is accessible

### "Expected status 400, got 200"
- This means validation is not working correctly
- Check that the API route has proper validation
- Verify that `startDate` is being checked in the API handler

### "Expected status 200, got 400"
- Check the response error message for details
- Verify all required fields are included
- Ensure date format is correct (YYYY-MM-DD)

## Integration with CI/CD

You can integrate the Node.js test script into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Test Experience API
  run: |
    npm run dev &
    sleep 10
    npm run test:experience ${{ secrets.TEST_CANDIDATE_ID }}
```

## Notes

- The test script creates actual database records. Consider using a test database or cleaning up test data after running.
- The candidate ID used for testing should be a valid candidate in your database.
- Some tests may fail if the candidate already has duplicate experiences (depending on your database constraints).

