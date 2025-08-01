// Test script for intelligent step generation based on tab information
const { invoke } = window.__TAURI__;

async function testIntelligentSteps() {
    console.log("🧪 Testing Intelligent Step Generation Based on Tab Information");
    
    try {
        // First, set up an API key (you'll need to provide your own)
        console.log("🔑 Setting up API key...");
        await invoke('set_api_key', { 
            request: { api_key: 'your-openai-api-key-here' } 
        });
        
        // Create a test project with minimal resources
        console.log("📁 Creating test project with minimal resources...");
        const project = await invoke('create_project', {
            request: {
                name: "Intelligent Steps Test",
                goal: "Test intelligent step generation when resources are missing"
            }
        });
        
        console.log("✅ Project created:", project);
        
        // Start research with a goal that will require missing resources
        console.log("🚀 Starting research that will trigger intelligent step generation...");
        const sessionId = `session-${Date.now()}`;
        
        const researchResult = await invoke('start_research', {
            request: {
                project_id: project.id,
                session_id: sessionId,
                goal: "Analyze customer data with pandas and create visualizations with matplotlib and seaborn. Perform machine learning analysis with scikit-learn.",
                answers: {
                    "data_source": "We need to create sample data since no data files are available",
                    "analysis_type": "Comprehensive analysis requiring multiple libraries",
                    "output_format": "Show how intelligent steps are generated"
                }
            }
        });
        
        console.log("✅ Research started:", researchResult);
        
        // Monitor the execution progress and intelligent step generation
        console.log("📊 Monitoring execution and intelligent step generation...");
        let completed = false;
        let attempts = 0;
        const maxAttempts = 90; // 90 seconds max for more complex execution
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
                // Check session progress
                const sessionData = await invoke('load_session', { session_id: sessionId });
                console.log(`📈 Session status: ${sessionData?.status || 'unknown'}`);
                
                // Check execution results for intelligent steps
                if (sessionData?.execution_results) {
                    console.log(`📊 Execution results: ${sessionData.execution_results.length} steps completed`);
                    
                    // Show intelligent steps that were generated
                    const suggestedSteps = sessionData.execution_results.filter(result => result.is_suggested_step);
                    const regularSteps = sessionData.execution_results.filter(result => !result.is_suggested_step);
                    
                    if (suggestedSteps.length > 0) {
                        console.log(`🔧 Intelligent steps generated: ${suggestedSteps.length}`);
                        suggestedSteps.forEach((step, index) => {
                            console.log(`\n🔧 Intelligent Step ${step.step_number}:`);
                            console.log(`   Description: ${step.description}`);
                            console.log(`   Status: ${step.status}`);
                            console.log(`   Type: Auto-added resource preparation`);
                            if (step.execution_time_ms) {
                                console.log(`   Execution time: ${step.execution_time_ms}ms`);
                            }
                            if (step.output) {
                                console.log(`   Output preview: ${step.output.substring(0, 100)}${step.output.length > 100 ? '...' : ''}`);
                            }
                        });
                    }
                    
                    if (regularSteps.length > 0) {
                        console.log(`📋 Regular steps executed: ${regularSteps.length}`);
                        regularSteps.forEach((step, index) => {
                            console.log(`\n📋 Regular Step ${step.step_number}:`);
                            console.log(`   Description: ${step.description}`);
                            console.log(`   Status: ${step.status}`);
                            if (step.execution_time_ms) {
                                console.log(`   Execution time: ${step.execution_time_ms}ms`);
                            }
                        });
                    }
                    
                    // Show variable detection from intelligent steps
                    const variables = await invoke('get_variables', { project_id: project.id });
                    if (variables.length > 0) {
                        console.log(`📊 Variables detected: ${variables.length}`);
                        variables.forEach(variable => {
                            console.log(`   ${variable.name}: ${variable.type_name} - ${variable.purpose}`);
                        });
                    }
                    
                    // Show library detection from intelligent steps
                    const libraries = await invoke('get_libraries', { project_id: project.id });
                    if (libraries.length > 0) {
                        console.log(`📚 Libraries detected: ${libraries.length}`);
                        libraries.forEach(library => {
                            console.log(`   ${library.name}: ${library.status} (${library.source})`);
                        });
                    }
                }
                
                if (sessionData?.status === 'completed') {
                    completed = true;
                    console.log("✅ Research execution completed!");
                }
                
            } catch (error) {
                console.log("⚠️ Error checking progress:", error);
            }
            
            attempts++;
        }
        
        if (!completed) {
            console.log("⏰ Timeout reached, execution may still be running");
        }
        
        // Final analysis of intelligent step generation
        console.log("\n📊 Final Analysis of Intelligent Step Generation:");
        const finalSessionData = await invoke('load_session', { session_id: sessionId });
        const finalVariables = await invoke('get_variables', { project_id: project.id });
        const finalLibraries = await invoke('get_libraries', { project_id: project.id });
        
        if (finalSessionData?.execution_results) {
            const allSteps = finalSessionData.execution_results;
            const suggestedSteps = allSteps.filter(result => result.is_suggested_step);
            const regularSteps = allSteps.filter(result => !result.is_suggested_step);
            
            console.log(`\n📈 Step Generation Summary:`);
            console.log(`  Total steps executed: ${allSteps.length}`);
            console.log(`  Regular steps: ${regularSteps.length}`);
            console.log(`  Intelligent steps (auto-added): ${suggestedSteps.length}`);
            console.log(`  Intelligent step ratio: ${((suggestedSteps.length / allSteps.length) * 100).toFixed(1)}%`);
            
            // Analyze what resources were automatically added
            console.log(`\n🔧 Resources Automatically Added:`);
            
            // Data files
            if (finalVariables.some(v => v.source === "file_loading" || v.purpose.includes("sample data"))) {
                console.log(`  ✅ Sample data created for analysis`);
            }
            
            // Libraries
            const autoDetectedLibraries = finalLibraries.filter(l => l.source === "auto_detected");
            if (autoDetectedLibraries.length > 0) {
                console.log(`  ✅ ${autoDetectedLibraries.length} libraries auto-detected and added`);
                autoDetectedLibraries.forEach(lib => {
                    console.log(`     - ${lib.name}: ${lib.status}`);
                });
            }
            
            // Variables
            const autoCreatedVariables = finalVariables.filter(v => v.source === "code_execution" || v.source === "computation");
            if (autoCreatedVariables.length > 0) {
                console.log(`  ✅ ${autoCreatedVariables.length} variables created during execution`);
                autoCreatedVariables.forEach(variable => {
                    console.log(`     - ${variable.name}: ${variable.type_name} (${variable.purpose})`);
                });
            }
        }
        
        // Show the benefits of intelligent step generation
        console.log(`\n🎯 Benefits of Intelligent Step Generation:`);
        console.log(`  ✅ Automatic resource detection and creation`);
        console.log(`  ✅ Seamless execution without manual intervention`);
        console.log(`  ✅ Comprehensive project context awareness`);
        console.log(`  ✅ Smart library and data management`);
        console.log(`  ✅ Enhanced research reproducibility`);
        
        // Show what the system learned about the project
        console.log(`\n🧠 System Learning Summary:`);
        console.log(`  Project goal: ${project.goal}`);
        console.log(`  Variables available: ${finalVariables.length}`);
        console.log(`  Libraries available: ${finalLibraries.length}`);
        console.log(`  Execution steps: ${finalSessionData?.execution_results?.length || 0}`);
        console.log(`  Research status: ${finalSessionData?.status || 'unknown'}`);
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Export for use in browser console
window.testIntelligentSteps = testIntelligentSteps;

console.log("🧪 Intelligent steps test script loaded!");
console.log("Run testIntelligentSteps() to start the test"); 