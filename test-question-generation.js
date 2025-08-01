// Test script for improved question generation
const { invoke } = require('@tauri-apps/api/tauri');

async function testQuestionGeneration() {
  console.log('🧪 Testing improved question generation...');
  
  try {
    // Test with a specific research goal
    const testGoal = "Analyze customer churn patterns in an e-commerce dataset";
    
    const result = await invoke('generate_questions', {
      request: {
        project_id: 'test-project-123',
        goal: testGoal
      }
    });
    
    console.log('✅ Question generation result:', JSON.stringify(result, null, 2));
    
    // Verify the questions are specific and focused on Python script setup
    const questions = result.questions || result;
    
    if (Array.isArray(questions)) {
      console.log('\n📋 Generated Questions:');
      questions.forEach((q, i) => {
        console.log(`${i + 1}. ${q.question}`);
        console.log(`   Category: ${q.category}`);
        console.log(`   Status: ${q.status}\n`);
      });
      
      // Check if questions are specific to the research goal
      const isSpecific = questions.some(q => 
        q.question.toLowerCase().includes('data') || 
        q.question.toLowerCase().includes('analysis') ||
        q.question.toLowerCase().includes('python') ||
        q.question.toLowerCase().includes('script')
      );
      
      if (isSpecific) {
        console.log('✅ Questions are specific to the research goal and Python script setup');
      } else {
        console.log('⚠️  Questions may be too generic');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testQuestionGeneration(); 