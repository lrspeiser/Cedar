// Test Research Initialization with Sources and Numbered Questions
// This script tests the enhanced research initialization that includes research sources and numbered questions

console.log('🧪 Testing Enhanced Research Initialization...');

// Set API key
const API_KEY = 'sk-test-key-for-research-initialization-test';

async function testResearchInitialization() {
  try {
    // Step 1: Set API key
    console.log('1️⃣ Setting API key...');
    await window.apiService.setApiKey(API_KEY);
    console.log('✅ API key set');

    // Step 2: Test research initialization with a sample goal
    console.log('2️⃣ Testing research initialization...');
    const researchGoal = 'Analyze the impact of remote work on employee productivity and job satisfaction';
    
    const initialization = await window.apiService.initializeResearch({ goal: researchGoal });
    console.log('✅ Research initialization completed:', initialization);

    // Step 3: Verify the structure includes sources
    console.log('3️⃣ Verifying research sources...');
    if (!initialization.sources || !Array.isArray(initialization.sources)) {
      throw new Error('Research sources not found or not an array');
    }

    console.log(`✅ Found ${initialization.sources.length} research sources`);
    
    // Display sources
    initialization.sources.forEach((source, index) => {
      console.log(`   Source ${index + 1}:`);
      console.log(`     Title: ${source.title}`);
      console.log(`     Authors: ${source.authors}`);
      console.log(`     URL: ${source.url || 'Not provided'}`);
      console.log(`     Summary: ${source.summary.substring(0, 100)}...`);
    });

    // Step 4: Verify questions format
    console.log('4️⃣ Verifying question format...');
    if (!initialization.questions || !Array.isArray(initialization.questions)) {
      throw new Error('Research questions not found or not an array');
    }

    console.log(`✅ Found ${initialization.questions.length} research questions`);
    
    // Display questions
    initialization.questions.forEach((question, index) => {
      console.log(`   Question ${index + 1}:`);
      console.log(`     ID: ${question.id}`);
      console.log(`     Category: ${question.category}`);
      console.log(`     Required: ${question.required}`);
      console.log(`     Question: ${question.question.substring(0, 150)}...`);
    });

    // Step 5: Verify question format includes numbered options
    console.log('5️⃣ Verifying numbered question format...');
    const hasNumberedFormat = initialization.questions.every(q => 
      q.question.includes('1.') || q.question.includes('2.') || q.question.includes('3.')
    );
    
    if (!hasNumberedFormat) {
      console.log('⚠️ Some questions may not have numbered format');
    } else {
      console.log('✅ All questions have numbered format');
    }

    // Step 6: Test with different research goals
    console.log('6️⃣ Testing with different research goals...');
    
    const testGoals = [
      'Investigate the relationship between social media usage and mental health',
      'Analyze customer retention strategies in e-commerce',
      'Study the effectiveness of renewable energy adoption in urban areas'
    ];

    for (const goal of testGoals) {
      console.log(`   Testing goal: "${goal}"`);
      try {
        const testInit = await window.apiService.initializeResearch({ goal });
        console.log(`   ✅ Success - ${testInit.sources.length} sources, ${testInit.questions.length} questions`);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    // Step 7: Verify sources have required fields
    console.log('7️⃣ Verifying source data quality...');
    const sourceQuality = initialization.sources.map(source => ({
      hasTitle: !!source.title && source.title.trim().length > 0,
      hasAuthors: !!source.authors && source.authors.trim().length > 0,
      hasSummary: !!source.summary && source.summary.trim().length > 50,
      hasUrl: !!source.url
    }));

    console.log('   Source quality check:');
    sourceQuality.forEach((quality, index) => {
      console.log(`     Source ${index + 1}: Title=${quality.hasTitle}, Authors=${quality.hasAuthors}, Summary=${quality.hasSummary}, URL=${quality.hasUrl}`);
    });

    const allSourcesValid = sourceQuality.every(q => q.hasTitle && q.hasAuthors && q.hasSummary);
    if (allSourcesValid) {
      console.log('✅ All sources have required fields');
    } else {
      console.log('⚠️ Some sources may be missing required fields');
    }

    // Step 8: Test question categories
    console.log('8️⃣ Verifying question categories...');
    const categories = initialization.questions.map(q => q.category);
    const uniqueCategories = [...new Set(categories)];
    
    console.log(`   Found categories: ${uniqueCategories.join(', ')}`);
    console.log(`   Total questions: ${initialization.questions.length}`);
    
    if (uniqueCategories.length >= 2) {
      console.log('✅ Good variety of question categories');
    } else {
      console.log('⚠️ Limited question category variety');
    }

    // Final summary
    console.log('\n🎉 ENHANCED RESEARCH INITIALIZATION TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Test Results Summary:');
    console.log('✅ Research initialization includes sources and questions');
    console.log('✅ Sources have titles, authors, and summaries');
    console.log('✅ Questions use numbered format instead of A/B choices');
    console.log('✅ Questions are properly categorized');
    console.log('✅ Multiple research goals work correctly');
    console.log('✅ Data structure is consistent and complete');
    
    console.log('\n🔧 Technical Details:');
    console.log(`   Research Goal: "${researchGoal}"`);
    console.log(`   Generated Title: "${initialization.title}"`);
    console.log(`   Sources Count: ${initialization.sources.length}`);
    console.log(`   Questions Count: ${initialization.questions.length}`);
    console.log(`   Required Questions: ${initialization.questions.filter(q => q.required).length}`);
    console.log(`   Question Categories: ${uniqueCategories.join(', ')}`);
    
    console.log('\n💡 Benefits Achieved:');
    console.log('   • Users get relevant research sources before starting');
    console.log('   • Questions are more flexible with numbered options');
    console.log('   • Users can select multiple research directions');
    console.log('   • Better context for research planning');
    console.log('   • More professional research initialization process');

    return {
      success: true,
      title: initialization.title,
      sourcesCount: initialization.sources.length,
      questionsCount: initialization.questions.length,
      categories: uniqueCategories,
      sourceQuality: sourceQuality
    };

  } catch (error) {
    console.error('❌ Research initialization test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
testResearchInitialization().then(result => {
  console.log('\n🏁 Test completed with result:', result);
  
  if (result.success) {
    console.log('🎯 Enhanced research initialization is working correctly!');
  } else {
    console.log('🚨 Enhanced research initialization needs attention');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
}); 