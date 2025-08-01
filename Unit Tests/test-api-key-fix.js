// Test script to verify API key environment variable fix
// Run this in the browser console when the Cedar app is running

async function testApiKeyEnvironmentVariable() {
  console.log('🧪 Testing API key environment variable fix...');
  
  try {
    // Test 1: Check current API key status
    console.log('\n1. Checking current API key status...');
    const apiStatus = await apiService.getApiKeyStatus();
    console.log('✅ API key status:', apiStatus);
    
    if (!apiStatus.has_key) {
      console.log('❌ No API key configured - please set one first');
      console.log('Use: await apiService.setApiKey("sk-your-key-here")');
      return;
    }
    
    // Test 2: Try to start research (this should now work with environment variable)
    console.log('\n2. Testing startResearch with environment variable...');
    try {
      const researchResult = await apiService.startResearch({
        projectId: 'test-env-var-123',
        sessionId: 'test-session-env-456',
        goal: 'Test the API key environment variable fix'
      });
      console.log('✅ SUCCESS: Research started successfully!');
      console.log('Research result:', researchResult);
      
      if (researchResult.plan_cells && researchResult.plan_cells.length > 0) {
        console.log('🎉 CONFIRMED: Real LLM research plan generated!');
        console.log('Plan cells:', researchResult.plan_cells.length);
        researchResult.plan_cells.forEach((cell, index) => {
          console.log(`  Cell ${index + 1}: ${cell.cell_type} - ${cell.content.substring(0, 100)}...`);
        });
      }
      
    } catch (error) {
      console.log('❌ ERROR: Research still failed:', error);
      console.log('This suggests the environment variable fix may not be working');
    }
    
    // Test 3: Test code execution
    console.log('\n3. Testing executeCode with environment variable...');
    try {
      const codeResult = await apiService.executeCode({
        code: 'print("Hello from environment variable test!")',
        sessionId: 'test-session-env-456'
      });
      console.log('✅ SUCCESS: Code execution worked!');
      console.log('Code result:', codeResult);
    } catch (error) {
      console.log('❌ ERROR: Code execution failed:', error);
    }
    
    // Test 4: Test question generation
    console.log('\n4. Testing generateQuestions with environment variable...');
    try {
      const questionsResult = await apiService.generateQuestions({
        projectId: 'test-env-var-123',
        goal: 'Test the API key environment variable fix'
      });
      console.log('✅ SUCCESS: Question generation worked!');
      console.log('Questions result:', questionsResult);
    } catch (error) {
      console.log('❌ ERROR: Question generation failed:', error);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- API Key Status: ' + (apiStatus.has_key ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'));
    console.log('- Environment Variable: ' + (apiStatus.has_key ? '✅ SHOULD BE SET' : '❌ NOT SET'));
    console.log('- Research Functionality: ' + (apiStatus.has_key ? '✅ TESTED' : '❌ NOT TESTED'));
    
    console.log('\n💡 If research is still failing:');
    console.log('1. Check that the API key is valid');
    console.log('2. Restart the Cedar app to ensure environment variable is set');
    console.log('3. Check the backend logs for more details');
    
  } catch (error) {
    console.error('❌ Error testing API key environment variable:', error);
  }
}

// Export for use in browser console
window.testApiKeyEnvironmentVariable = testApiKeyEnvironmentVariable;

console.log('🧪 API key environment variable test script loaded!');
console.log('Run: testApiKeyEnvironmentVariable() to test the fix'); 