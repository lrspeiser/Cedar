// Cedar Research Test Script
// Run this in the browser console when the Cedar app is running

console.log('🧪 Starting Cedar Research Tests...');

async function testResearchFunctionality() {
    try {
        // Test 1: Set API key
        console.log('1. Testing API key setup...');
        await apiService.setApiKey('test-api-key-12345');
        console.log('✅ API key set successfully');

        // Test 2: Check API key status
        console.log('2. Testing API key status...');
        const keyStatus = await apiService.getApiKeyStatus();
        console.log('✅ API key status:', keyStatus);

        // Test 3: Create a test project
        console.log('3. Testing project creation...');
        const project = await apiService.createProject({
            name: 'Research Test Project',
            goal: 'Test the research functionality'
        });
        console.log('✅ Project created:', project);

        // Test 4: Start research
        console.log('4. Testing research start...');
        const researchResult = await apiService.startResearch({
            projectId: project.id,
            sessionId: 'test-session-' + Date.now(),
            goal: 'Test the research functionality'
        });
        console.log('✅ Research started:', researchResult);

        // Test 5: Execute code
        console.log('5. Testing code execution...');
        const codeResult = await apiService.executeCode({
            code: 'print("Hello from research test!")',
            sessionId: researchResult.session_id || 'test-session'
        });
        console.log('✅ Code executed:', codeResult);

        // Test 6: Generate questions
        console.log('6. Testing question generation...');
        const questionsResult = await apiService.generateQuestions({
            projectId: project.id,
            goal: 'Test the research functionality'
        });
        console.log('✅ Questions generated:', questionsResult);

        // Test 7: Run API test suite
        console.log('7. Testing API test suite...');
        const testSuiteResult = await apiService.runApiTestSuite();
        console.log('✅ API test suite completed:', testSuiteResult);

        console.log('🎉 All research tests passed!');
        return {
            success: true,
            project: project,
            research: researchResult,
            code: codeResult,
            questions: questionsResult,
            testSuite: testSuiteResult
        };

    } catch (error) {
        console.error('❌ Research test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export for use in console
window.testResearchFunctionality = testResearchFunctionality;

// Auto-run if this script is loaded
if (typeof apiService !== 'undefined') {
    console.log('🚀 Auto-running research tests...');
    testResearchFunctionality().then(result => {
        if (result.success) {
            console.log('🎉 Research functionality is working correctly!');
        } else {
            console.error('❌ Research functionality has issues:', result.error);
        }
    });
} else {
    console.log('⚠️ apiService not available. Make sure the Cedar app is running.');
    console.log('💡 Run testResearchFunctionality() manually when ready.');
} 