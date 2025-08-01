// Test script for enhanced research execution with logging and LLM evaluation
const { invoke } = window.__TAURI__;

async function testEnhancedExecution() {
    console.log("🧪 Testing Enhanced Research Execution with Logging and LLM Evaluation");
    
    try {
        // First, set up an API key (you'll need to provide your own)
        console.log("🔑 Setting up API key...");
        await invoke('set_api_key', { 
            request: { api_key: 'your-openai-api-key-here' } 
        });
        
        // Create a test project
        console.log("📁 Creating test project...");
        const project = await invoke('create_project', {
            request: {
                name: "Enhanced Execution Test",
                goal: "Test comprehensive logging and LLM evaluation of research steps"
            }
        });
        
        console.log("✅ Project created:", project);
        
        // Start research with enhanced execution
        console.log("🚀 Starting enhanced research execution...");
        const sessionId = `session-${Date.now()}`;
        
        const researchResult = await invoke('start_research', {
            request: {
                project_id: project.id,
                session_id: sessionId,
                goal: "Analyze a simple dataset to demonstrate enhanced logging and LLM evaluation capabilities",
                answers: {
                    "data_source": "We'll create a synthetic dataset for testing",
                    "analysis_type": "Descriptive statistics and basic visualization",
                    "output_format": "Comprehensive logs and LLM assessments"
                }
            }
        });
        
        console.log("✅ Research started:", researchResult);
        
        // Monitor the execution progress
        console.log("📊 Monitoring execution progress...");
        let completed = false;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
                const sessionData = await invoke('load_session', { session_id: sessionId });
                console.log(`📈 Session status: ${sessionData?.status || 'unknown'}`);
                
                if (sessionData?.execution_results) {
                    console.log(`📊 Execution results: ${sessionData.execution_results.length} steps completed`);
                    
                    // Show detailed results for each step
                    sessionData.execution_results.forEach((result, index) => {
                        console.log(`\n🔧 Step ${result.step_number + 1}:`);
                        console.log(`   Description: ${result.description}`);
                        console.log(`   Status: ${result.status}`);
                        console.log(`   Execution Time: ${result.execution_time_ms}ms`);
                        
                        if (result.logs && result.logs.length > 0) {
                            console.log(`   📊 Logs (${result.logs.length} entries):`);
                            result.logs.slice(0, 3).forEach(log => console.log(`      ${log}`));
                            if (result.logs.length > 3) {
                                console.log(`      ... and ${result.logs.length - 3} more logs`);
                            }
                        }
                        
                        if (result.data_summary) {
                            console.log(`   📈 Data Summary: ${result.data_summary.substring(0, 100)}...`);
                        }
                        
                        if (result.output) {
                            console.log(`   📤 Output: ${result.output.substring(0, 100)}...`);
                        }
                    });
                }
                
                if (sessionData?.status === 'completed') {
                    completed = true;
                    console.log("✅ Research execution completed!");
                }
                
            } catch (error) {
                console.log("⚠️ Error checking session:", error);
            }
            
            attempts++;
        }
        
        if (!completed) {
            console.log("⏰ Timeout reached, execution may still be running");
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Export for use in browser console
window.testEnhancedExecution = testEnhancedExecution;

console.log("🧪 Enhanced execution test script loaded!");
console.log("Run testEnhancedExecution() to start the test"); 