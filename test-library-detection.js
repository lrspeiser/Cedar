// Test script for automatic library detection and installation
const { invoke } = window.__TAURI__;

async function testLibraryDetection() {
    console.log("🧪 Testing Automatic Library Detection and Installation");
    
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
                name: "Library Detection Test",
                goal: "Test automatic library detection and installation from Python code"
            }
        });
        
        console.log("✅ Project created:", project);
        
        // Start research with code that uses various libraries
        console.log("🚀 Starting research with library-heavy code...");
        const sessionId = `session-${Date.now()}`;
        
        const researchResult = await invoke('start_research', {
            request: {
                project_id: project.id,
                session_id: sessionId,
                goal: "Create a comprehensive data analysis script that demonstrates automatic library detection",
                answers: {
                    "data_source": "We'll create synthetic data for testing",
                    "analysis_type": "Comprehensive analysis with multiple libraries",
                    "output_format": "Show library detection in action"
                }
            }
        });
        
        console.log("✅ Research started:", researchResult);
        
        // Monitor the execution progress and library detection
        console.log("📊 Monitoring execution and library detection...");
        let completed = false;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
                // Check session progress
                const sessionData = await invoke('load_session', { session_id: sessionId });
                console.log(`📈 Session status: ${sessionData?.status || 'unknown'}`);
                
                // Check libraries
                const libraries = await invoke('get_libraries', { project_id: project.id });
                console.log(`📦 Libraries detected: ${libraries.length}`);
                
                if (libraries.length > 0) {
                    console.log("📋 Library details:");
                    libraries.forEach(lib => {
                        console.log(`  - ${lib.name} (${lib.source}): ${lib.status}`);
                        if (lib.required_by.length > 0) {
                            console.log(`    Required by: ${lib.required_by.join(', ')}`);
                        }
                        if (lib.error_message) {
                            console.log(`    Error: ${lib.error_message}`);
                        }
                    });
                }
                
                if (sessionData?.execution_results) {
                    console.log(`📊 Execution results: ${sessionData.execution_results.length} steps completed`);
                    
                    // Show library detection in execution results
                    sessionData.execution_results.forEach((result, index) => {
                        console.log(`\n🔧 Step ${result.step_number + 1}:`);
                        console.log(`   Description: ${result.description}`);
                        console.log(`   Status: ${result.status}`);
                        if (result.execution_time_ms) {
                            console.log(`   Execution time: ${result.execution_time_ms}ms`);
                        }
                        
                        // Look for library detection messages in logs
                        if (result.logs && result.logs.length > 0) {
                            const libraryLogs = result.logs.filter(log => 
                                log.includes("Auto-detected library") || 
                                log.includes("Installing library") ||
                                log.includes("Successfully installed")
                            );
                            if (libraryLogs.length > 0) {
                                console.log(`   📦 Library activity:`);
                                libraryLogs.forEach(log => console.log(`      ${log}`));
                            }
                        }
                    });
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
        
        // Final library status
        console.log("\n📦 Final Library Status:");
        const finalLibraries = await invoke('get_libraries', { project_id: project.id });
        finalLibraries.forEach(lib => {
            const statusIcon = lib.status === 'installed' ? '✅' : 
                              lib.status === 'pending' ? '⏳' : 
                              lib.status === 'failed' ? '❌' : '❓';
            console.log(`${statusIcon} ${lib.name} (${lib.source}): ${lib.status}`);
        });
        
        // Show auto-detected vs manual libraries
        const autoDetected = finalLibraries.filter(l => l.source === 'auto_detected');
        const manual = finalLibraries.filter(l => l.source === 'manual');
        console.log(`\n📊 Summary:`);
        console.log(`  Auto-detected: ${autoDetected.length}`);
        console.log(`  Manual: ${manual.length}`);
        console.log(`  Total: ${finalLibraries.length}`);
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Export for use in browser console
window.testLibraryDetection = testLibraryDetection;

console.log("🧪 Library detection test script loaded!");
console.log("Run testLibraryDetection() to start the test"); 