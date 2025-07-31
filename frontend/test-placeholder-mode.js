// Test script to verify API key requirement for all research functionality
// Run this in the browser console when the Cedar app is running

async function testApiKeyRequirement() {
  console.log('🧪 Testing API key requirement for all research functionality...');
  
  try {
    // Test 1: Check API key status
    console.log('\n1. Checking API key status...');
    const apiStatus = await apiService.getApiKeyStatus();
    console.log('✅ API key status:', apiStatus);
    
    if (apiStatus.has_key) {
      console.log('✅ API key is configured - ready for real research');
      console.log('Run testRealResearch() to test real functionality');
      return;
    }
    
    console.log('❌ No API key configured - testing error handling...');
    
    // Test 2: Start Research without API key (should fail)
    console.log('\n2. Testing startResearch without API key...');
    try {
      const researchResult = await apiService.startResearch({
        projectId: 'test-no-key-123',
        sessionId: 'test-session-456',
        goal: 'Analyze the relationship between temperature and humidity in weather data'
      });
      console.log('❌ ERROR: Research should have failed but succeeded:', researchResult);
    } catch (error) {
      console.log('✅ SUCCESS: Research correctly failed without API key');
      console.log('Error message:', error);
    }
    
    // Test 3: Execute Code without API key (should fail)
    console.log('\n3. Testing executeCode without API key...');
    try {
      const codeResult = await apiService.executeCode({
        code: 'import pandas as pd\nprint("Hello from test!")',
        sessionId: 'test-session-456'
      });
      console.log('❌ ERROR: Code execution should have failed but succeeded:', codeResult);
    } catch (error) {
      console.log('✅ SUCCESS: Code execution correctly failed without API key');
      console.log('Error message:', error);
    }
    
    // Test 4: Generate Questions without API key (should fail)
    console.log('\n4. Testing generateQuestions without API key...');
    try {
      const questionsResult = await apiService.generateQuestions({
        projectId: 'test-no-key-123',
        goal: 'Analyze the relationship between temperature and humidity in weather data'
      });
      console.log('❌ ERROR: Question generation should have failed but succeeded:', questionsResult);
    } catch (error) {
      console.log('✅ SUCCESS: Question generation correctly failed without API key');
      console.log('Error message:', error);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- API Key Status: ' + (apiStatus.has_key ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'));
    console.log('- Research Plan: ' + (apiStatus.has_key ? '✅ READY' : '❌ BLOCKED'));
    console.log('- Code Execution: ' + (apiStatus.has_key ? '✅ READY' : '❌ BLOCKED'));
    console.log('- Question Generation: ' + (apiStatus.has_key ? '✅ READY' : '❌ BLOCKED'));
    
    console.log('\n💡 To enable real functionality:');
    console.log('1. Get an OpenAI API key from https://platform.openai.com/api-keys');
    console.log('2. Use apiService.setApiKey("sk-your-key-here")');
    console.log('3. Run testRealResearch() to test real functionality');
    
  } catch (error) {
    console.error('❌ Error testing API key requirement:', error);
  }
}

// Export for use in browser console
window.testApiKeyRequirement = testApiKeyRequirement;

console.log('🧪 API key requirement test script loaded!');
console.log('Run: testApiKeyRequirement() to test API key requirement'); 