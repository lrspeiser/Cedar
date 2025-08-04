// Test script to verify that the real research functionality is working
// Run this in the browser console when the Cedar app is running

async function testRealResearch() {
  console.log('🧪 Testing REAL research functionality...');
  
  try {
    // Test 1: Start Research with real cedar-core functionality
    console.log('\n1. Testing startResearch with real agent...');
    const researchResult = await apiService.startResearch({
      projectId: 'test-real-research-123',
      sessionId: 'test-session-456',
      goal: 'Analyze the relationship between temperature and humidity in weather data'
    });
    console.log('✅ startResearch result:', researchResult);
    
    // Check if we got a real plan with cells
    if (researchResult.plan_cells && researchResult.plan_cells.length > 0) {
      console.log('🎉 SUCCESS: Real research plan generated!');
      console.log('Plan cells:', researchResult.plan_cells);
    } else {
      console.log('⚠️ WARNING: No plan cells returned - might still be using placeholder');
    }
    
    // Test 2: Execute Code with real Python execution
    console.log('\n2. Testing executeCode with real Python execution...');
    const codeResult = await apiService.executeCode({
      code: 'import pandas as pd\nimport numpy as np\nprint("Hello from real Python execution!")\nprint("Python version:", pd.__version__)',
      sessionId: 'test-session-456'
    });
    console.log('✅ executeCode result:', codeResult);
    
    // Check if we got real Python output
    if (codeResult.output && codeResult.output.includes('Hello from real Python execution')) {
      console.log('🎉 SUCCESS: Real Python code executed!');
    } else {
      console.log('⚠️ WARNING: Might still be using placeholder execution');
    }
    
    // Test 3: Generate Questions with real LLM
    console.log('\n3. Testing generateQuestions with real LLM...');
    const questionsResult = await apiService.generateQuestions({
      projectId: 'test-real-research-123',
      goal: 'Analyze the relationship between temperature and humidity in weather data'
    });
    console.log('✅ generateQuestions result:', questionsResult);
    
    // Check if we got real questions
    if (questionsResult.questions && questionsResult.questions.length > 0) {
      console.log('🎉 SUCCESS: Real questions generated!');
      console.log('Questions:', questionsResult.questions);
    } else {
      console.log('⚠️ WARNING: No questions returned - might still be using placeholder');
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- Research Plan: ' + (researchResult.plan_cells ? '✅ REAL' : '❌ PLACEHOLDER'));
    console.log('- Code Execution: ' + (codeResult.output && codeResult.output.includes('Hello from real Python execution') ? '✅ REAL' : '❌ PLACEHOLDER'));
    console.log('- Question Generation: ' + (questionsResult.questions && questionsResult.questions.length > 0 ? '✅ REAL' : '❌ PLACEHOLDER'));
    
  } catch (error) {
    console.error('❌ Error testing real research:', error);
  }
}

// Export for use in browser console
window.testRealResearch = testRealResearch;

console.log('🧪 Real research test script loaded!');
console.log('Run: testRealResearch() to test the functionality'); 