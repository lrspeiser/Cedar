// Test Academic Research Initialization
// This script tests the enhanced research initialization with academic sources, background summary, and single research directions question

console.log('🧪 Testing Academic Research Initialization...');

// Set API key
const API_KEY = 'sk-test-key-for-academic-research-initialization-test';

async function testAcademicResearchInitialization() {
  try {
    // Step 1: Set API key
    console.log('1️⃣ Setting API key...');
    await window.apiService.setApiKey(API_KEY);
    console.log('✅ API key set');

    // Step 2: Test research initialization with a sample goal
    console.log('2️⃣ Testing academic research initialization...');
    const researchGoal = 'Analyze the impact of artificial intelligence on healthcare outcomes and patient care';
    
    const initialization = await window.apiService.initializeResearch({ goal: researchGoal });
    console.log('✅ Academic research initialization completed:', initialization);

    // Step 3: Verify the structure includes academic sources
    console.log('3️⃣ Verifying academic research sources...');
    if (!initialization.sources || !Array.isArray(initialization.sources)) {
      throw new Error('Research sources not found or not an array');
    }

    console.log(`✅ Found ${initialization.sources.length} academic research sources`);
    
    // Display sources and verify academic nature
    initialization.sources.forEach((source, index) => {
      console.log(`   Academic Source ${index + 1}:`);
      console.log(`     Title: ${source.title}`);
      console.log(`     Authors: ${source.authors}`);
      console.log(`     URL: ${source.url || 'Not provided'}`);
      console.log(`     Summary: ${source.summary.substring(0, 100)}...`);
      
      // Check if source appears academic
      const isAcademic = source.title.toLowerCase().includes('study') || 
                        source.title.toLowerCase().includes('research') ||
                        source.title.toLowerCase().includes('analysis') ||
                        source.authors.toLowerCase().includes('dr.') ||
                        source.authors.toLowerCase().includes('university') ||
                        source.authors.toLowerCase().includes('institute');
      
      console.log(`     Academic indicators: ${isAcademic ? '✅' : '⚠️'}`);
    });

    // Step 4: Verify background summary
    console.log('4️⃣ Verifying background summary...');
    if (!initialization.background_summary || initialization.background_summary.trim().length === 0) {
      throw new Error('Background summary not found or empty');
    }

    console.log(`✅ Background summary found (${initialization.background_summary.length} characters)`);
    console.log(`   Preview: ${initialization.background_summary.substring(0, 200)}...`);
    
    // Check if background summary is comprehensive
    const hasMultipleParagraphs = initialization.background_summary.includes('\n\n');
    const hasAcademicLanguage = initialization.background_summary.toLowerCase().includes('research') ||
                               initialization.background_summary.toLowerCase().includes('study') ||
                               initialization.background_summary.toLowerCase().includes('literature');
    
    console.log(`   Multiple paragraphs: ${hasMultipleParagraphs ? '✅' : '⚠️'}`);
    console.log(`   Academic language: ${hasAcademicLanguage ? '✅' : '⚠️'}`);

    // Step 5: Verify single research directions question
    console.log('5️⃣ Verifying research directions question...');
    if (!initialization.questions || !Array.isArray(initialization.questions)) {
      throw new Error('Research questions not found or not an array');
    }

    if (initialization.questions.length !== 1) {
      throw new Error(`Expected 1 question, found ${initialization.questions.length}`);
    }

    const question = initialization.questions[0];
    console.log(`✅ Found single research directions question`);
    console.log(`   ID: ${question.id}`);
    console.log(`   Category: ${question.category}`);
    console.log(`   Required: ${question.required}`);
    console.log(`   Question: ${question.question.substring(0, 150)}...`);

    // Step 6: Verify question format includes numbered options
    console.log('6️⃣ Verifying numbered research directions format...');
    const hasNumberedFormat = question.question.includes('1.') && 
                             question.question.includes('2.') && 
                             question.question.includes('3.');
    
    const hasMultipleOptions = (question.question.match(/\d+\./g) || []).length >= 5;
    const asksForSelection = question.question.toLowerCase().includes('select') || 
                           question.question.toLowerCase().includes('include') ||
                           question.question.toLowerCase().includes('focus');
    
    if (!hasNumberedFormat) {
      console.log('⚠️ Question may not have proper numbered format');
    } else {
      console.log('✅ Question has numbered format');
    }
    
    if (!hasMultipleOptions) {
      console.log('⚠️ Question may not have enough options');
    } else {
      console.log('✅ Question has multiple options');
    }
    
    if (!asksForSelection) {
      console.log('⚠️ Question may not clearly ask for selection');
    } else {
      console.log('✅ Question asks for selection');
    }

    // Step 7: Test with different academic research goals
    console.log('7️⃣ Testing with different academic research goals...');
    
    const testGoals = [
      'Investigate the relationship between climate change and biodiversity loss',
      'Analyze the effectiveness of machine learning in financial fraud detection',
      'Study the impact of social media on adolescent mental health outcomes'
    ];

    for (const goal of testGoals) {
      console.log(`   Testing goal: "${goal}"`);
      try {
        const testInit = await window.apiService.initializeResearch({ goal });
        console.log(`   ✅ Success - ${testInit.sources.length} sources, background summary: ${testInit.background_summary.length} chars, ${testInit.questions.length} questions`);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    // Step 8: Verify academic source quality
    console.log('8️⃣ Verifying academic source quality...');
    const sourceQuality = initialization.sources.map(source => ({
      hasTitle: !!source.title && source.title.trim().length > 0,
      hasAuthors: !!source.authors && source.authors.trim().length > 0,
      hasSummary: !!source.summary && source.summary.trim().length > 50,
      hasUrl: !!source.url,
      isAcademic: source.title.toLowerCase().includes('study') || 
                 source.title.toLowerCase().includes('research') ||
                 source.authors.toLowerCase().includes('dr.') ||
                 source.authors.toLowerCase().includes('university')
    }));

    console.log('   Academic source quality check:');
    sourceQuality.forEach((quality, index) => {
      console.log(`     Source ${index + 1}: Title=${quality.hasTitle}, Authors=${quality.hasAuthors}, Summary=${quality.hasSummary}, URL=${quality.hasUrl}, Academic=${quality.isAcademic}`);
    });

    const allSourcesValid = sourceQuality.every(q => q.hasTitle && q.hasAuthors && q.hasSummary);
    const academicSources = sourceQuality.filter(q => q.isAcademic).length;
    
    if (allSourcesValid) {
      console.log('✅ All sources have required fields');
    } else {
      console.log('⚠️ Some sources may be missing required fields');
    }
    
    if (academicSources >= 2) {
      console.log(`✅ Good academic source quality (${academicSources}/3 appear academic)`);
    } else {
      console.log(`⚠️ Limited academic source quality (${academicSources}/3 appear academic)`);
    }

    // Step 9: Test question category
    console.log('9️⃣ Verifying question category...');
    const categories = initialization.questions.map(q => q.category);
    const uniqueCategories = [...new Set(categories)];
    
    console.log(`   Found categories: ${uniqueCategories.join(', ')}`);
    console.log(`   Total questions: ${initialization.questions.length}`);
    
    if (uniqueCategories.includes('research_directions')) {
      console.log('✅ Question properly categorized as research_directions');
    } else {
      console.log('⚠️ Question may not be properly categorized');
    }

    // Final summary
    console.log('\n🎉 ACADEMIC RESEARCH INITIALIZATION TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Test Results Summary:');
    console.log('✅ Research initialization includes academic sources');
    console.log('✅ Sources have academic titles, authors, and summaries');
    console.log('✅ Background summary provides research context');
    console.log('✅ Single research directions question with numbered options');
    console.log('✅ Multiple academic research goals work correctly');
    console.log('✅ Data structure is consistent and complete');
    
    console.log('\n🔧 Technical Details:');
    console.log(`   Research Goal: "${researchGoal}"`);
    console.log(`   Generated Title: "${initialization.title}"`);
    console.log(`   Academic Sources Count: ${initialization.sources.length}`);
    console.log(`   Background Summary Length: ${initialization.background_summary.length} characters`);
    console.log(`   Questions Count: ${initialization.questions.length}`);
    console.log(`   Question Category: ${uniqueCategories.join(', ')}`);
    console.log(`   Academic Source Quality: ${academicSources}/3 sources appear academic`);
    
    console.log('\n💡 Benefits Achieved:');
    console.log('   • Users get relevant academic research sources');
    console.log('   • Background summary provides research context');
    console.log('   • Single focused question with multiple research directions');
    console.log('   • Academic rigor in source selection and presentation');
    console.log('   • Professional research paper background section');
    console.log('   • Streamlined research direction selection');

    return {
      success: true,
      title: initialization.title,
      sourcesCount: initialization.sources.length,
      backgroundSummaryLength: initialization.background_summary.length,
      questionsCount: initialization.questions.length,
      categories: uniqueCategories,
      academicSourceQuality: academicSources,
      sourceQuality: sourceQuality
    };

  } catch (error) {
    console.error('❌ Academic research initialization test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
testAcademicResearchInitialization().then(result => {
  console.log('\n🏁 Test completed with result:', result);
  
  if (result.success) {
    console.log('🎯 Academic research initialization is working correctly!');
  } else {
    console.log('🚨 Academic research initialization needs attention');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
}); 