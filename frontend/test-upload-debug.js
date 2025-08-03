// Test script to debug upload functionality
// Run this in the browser console when the Cedar app is open

console.log('🔍 Starting upload debug test...');

// Test 1: Check if logger is available
console.log('📝 Logger available:', typeof window.logger !== 'undefined');
if (window.logger) {
  console.log('📝 Logger methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.logger)));
}

// Test 2: Check if apiService is available
console.log('🔌 API Service available:', typeof window.apiService !== 'undefined');

// Test 3: Test logger functionality
if (window.logger) {
  window.logger.info('TestScript', 'Testing logger functionality', { test: true });
  window.logger.warn('TestScript', 'Testing warning', { test: true });
  window.logger.error('TestScript', 'Testing error logging', { test: true });
}

// Test 4: Create test data
const testCsvData = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago
Alice,28,Boston`;

// Test 5: Test file upload simulation
async function testFileUpload() {
  console.log('🧪 Testing file upload simulation...');
  
  try {
    // Create a mock file
    const mockFile = new File([testCsvData], 'test-data.csv', { type: 'text/csv' });
    console.log('📁 Mock file created:', mockFile);
    
    // Test reading file content
    const reader = new FileReader();
    const content = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(mockFile);
    });
    
    console.log('📖 File content read:', content.substring(0, 100) + '...');
    
    // Test API call (this will fail since endpoints are commented out, but we'll see the error)
    if (window.apiService) {
      console.log('🔌 Testing API call...');
      const result = await window.apiService.uploadDataFile({
        projectId: 'test-project',
        filename: 'test-data.csv',
        content: content,
        fileType: 'csv'
      });
      console.log('✅ API call successful:', result);
    } else {
      console.log('❌ API service not available');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error);
    if (window.logger) {
      window.logger.error('TestScript', 'File upload test failed', { error });
    }
  }
}

// Test 6: Test pasted data
async function testPastedData() {
  console.log('🧪 Testing pasted data...');
  
  try {
    if (window.apiService) {
      const result = await window.apiService.uploadDataFile({
        projectId: 'test-project',
        filename: `pasted_data_${Date.now()}.csv`,
        content: testCsvData,
        fileType: 'csv'
      });
      console.log('✅ Pasted data test successful:', result);
    }
  } catch (error) {
    console.log('❌ Pasted data test failed:', error);
    if (window.logger) {
      window.logger.error('TestScript', 'Pasted data test failed', { error });
    }
  }
}

// Test 7: Export logs
async function exportLogs() {
  if (window.logger) {
    const logs = await window.logger.exportLogs();
    console.log('📋 Current logs:');
    console.log(logs);
    
    // Also save to localStorage for easy access
    localStorage.setItem('cedar-debug-logs', logs);
    console.log('💾 Logs saved to localStorage as "cedar-debug-logs"');
  }
}

// Test 8: Check for existing logs
function checkExistingLogs() {
  const apiLogs = localStorage.getItem('cedar-api-logs');
  const debugLogs = localStorage.getItem('cedar-debug-logs');
  
  console.log('📋 Existing API logs:', apiLogs ? JSON.parse(apiLogs).length : 0);
  console.log('📋 Existing debug logs:', debugLogs ? debugLogs.split('\n').length : 0);
  
  if (apiLogs) {
    console.log('📋 Recent API logs:', JSON.parse(apiLogs).slice(-5));
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all upload debug tests...');
  
  checkExistingLogs();
  await testFileUpload();
  await testPastedData();
  await exportLogs();
  
  console.log('✅ All tests completed. Check console and logs for results.');
}

// Make functions available globally
window.testUploadDebug = {
  testFileUpload,
  testPastedData,
  exportLogs,
  checkExistingLogs,
  runAllTests
};

console.log('🔧 Debug functions available as window.testUploadDebug');
console.log('💡 Run window.testUploadDebug.runAllTests() to execute all tests'); 