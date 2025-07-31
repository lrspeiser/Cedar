// Test script to verify API fixes work correctly
// Run this in the browser console when the Cedar app is running

async function testApiFixes() {
  console.log('🧪 Testing API fixes...');
  
  try {
    // Test 1: Start Research (this was the failing one)
    console.log('\n1. Testing startResearch...');
    const researchResult = await apiService.startResearch({
      projectId: 'test-project-123',
      sessionId: 'test-session-456',
      goal: 'Test the API fix'
    });
    console.log('✅ startResearch result:', researchResult);
    
    // Test 2: Execute Code
    console.log('\n2. Testing executeCode...');
    const codeResult = await apiService.executeCode({
      code: 'print("Hello from API test!")',
      sessionId: 'test-session-456'
    });
    console.log('✅ executeCode result:', codeResult);
    
    // Test 3: Generate Questions
    console.log('\n3. Testing generateQuestions...');
    const questionsResult = await apiService.generateQuestions({
      projectId: 'test-project-123',
      goal: 'Test the API fix'
    });
    console.log('✅ generateQuestions result:', questionsResult);
    
    console.log('\n🎉 All API fixes are working correctly!');
    return {
      success: true,
      research: researchResult,
      code: codeResult,
      questions: questionsResult
    };
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in console
window.testApiFixes = testApiFixes;

// Auto-run if this script is loaded
if (typeof apiService !== 'undefined') {
  console.log('🚀 Auto-running API fix tests...');
  testApiFixes().then(result => {
    if (result.success) {
      console.log('🎉 API fixes are working correctly!');
    } else {
      console.error('❌ API fixes still have issues:', result.error);
    }
  });
} else {
  console.log('⚠️ apiService not available. Make sure the Cedar app is running.');
  console.log('💡 Run testApiFixes() manually when ready.');
} 