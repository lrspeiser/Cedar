// Test script for automatic write-up generation
const { invoke } = window.__TAURI__;

async function testWriteUpGeneration() {
    console.log("🧪 Testing Automatic Write-up Generation");
    
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
                name: "Write-up Generation Test",
                goal: "Test automatic write-up generation with comprehensive research execution"
            }
        });
        
        console.log("✅ Project created:", project);
        
        // Start research that will generate a comprehensive write-up
        console.log("🚀 Starting research with write-up generation...");
        const sessionId = `session-${Date.now()}`;
        
        const researchResult = await invoke('start_research', {
            request: {
                project_id: project.id,
                session_id: sessionId,
                goal: "Analyze customer data patterns and create visualizations. Perform statistical analysis and generate insights about customer behavior.",
                answers: {
                    "data_source": "We'll create sample customer data for analysis",
                    "analysis_type": "Comprehensive statistical analysis with visualizations",
                    "output_format": "Generate detailed insights and findings"
                }
            }
        });
        
        console.log("✅ Research started:", researchResult);
        
        // Monitor the execution progress and write-up generation
        console.log("📊 Monitoring execution and write-up generation...");
        let completed = false;
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes max for comprehensive execution
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
                // Check session progress
                const sessionData = await invoke('load_session', { session_id: sessionId });
                console.log(`📈 Session status: ${sessionData?.status || 'unknown'}`);
                
                // Check execution results
                if (sessionData?.execution_results) {
                    console.log(`📊 Execution results: ${sessionData.execution_results.length} steps completed`);
                    
                    // Show progress of execution
                    const successfulSteps = sessionData.execution_results.filter(r => r.status === 'success').length;
                    const intelligentSteps = sessionData.execution_results.filter(r => r.is_suggested_step).length;
                    
                    console.log(`✅ Successful steps: ${successfulSteps}`);
                    console.log(`🔧 Intelligent steps: ${intelligentSteps}`);
                    
                    // Show latest step details
                    if (sessionData.execution_results.length > 0) {
                        const latestStep = sessionData.execution_results[sessionData.execution_results.length - 1];
                        console.log(`📋 Latest step: ${latestStep.description}`);
                        console.log(`⏱️ Execution time: ${latestStep.execution_time_ms || 'N/A'}ms`);
                    }
                }
                
                // Check if execution is complete
                if (sessionData?.status === 'completed') {
                    completed = true;
                    console.log("✅ Research execution completed! Write-up should be generated...");
                    
                    // Wait a moment for write-up generation
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Check if write-up was generated
                    const projectData = await invoke('get_project', { project_id: project.id });
                    if (projectData && projectData.write_up) {
                        console.log("📄 Write-up generated successfully!");
                        console.log(`📊 Write-up length: ${projectData.write_up.length} characters`);
                        
                        // Show write-up preview
                        const preview = projectData.write_up.substring(0, 500);
                        console.log("📝 Write-up preview:");
                        console.log(preview);
                        console.log("...");
                    } else {
                        console.log("⚠️ Write-up not found in project data");
                    }
                }
                
            } catch (error) {
                console.log("⚠️ Error checking progress:", error);
            }
            
            attempts++;
        }
        
        if (!completed) {
            console.log("⏰ Timeout reached, execution may still be running");
        }
        
        // Final analysis of write-up generation
        console.log("\n📊 Final Analysis of Write-up Generation:");
        
        // Get final project data
        const finalProjectData = await invoke('get_project', { project_id: project.id });
        const finalSessionData = await invoke('load_session', { session_id: sessionId });
        const finalVariables = await invoke('get_variables', { project_id: project.id });
        const finalLibraries = await invoke('get_libraries', { project_id: project.id });
        
        if (finalProjectData && finalProjectData.write_up) {
            console.log(`\n📄 Write-up Generation Summary:`);
            console.log(`  Write-up generated: ✅ Yes`);
            console.log(`  Write-up length: ${finalProjectData.write_up.length} characters`);
            console.log(`  Write-up filename: research_write_up.md`);
            
            // Analyze write-up content
            const writeUpContent = finalProjectData.write_up;
            
            // Check for key sections
            const sections = {
                'Executive Summary': writeUpContent.includes('## Executive Summary'),
                'Methodology': writeUpContent.includes('## Methodology'),
                'Execution Steps': writeUpContent.includes('## Execution Steps'),
                'Key Findings': writeUpContent.includes('## Key Findings'),
                'Conclusions': writeUpContent.includes('## Conclusions'),
                'Technical Details': writeUpContent.includes('## Technical Details'),
                'Appendices': writeUpContent.includes('## Appendices')
            };
            
            console.log(`\n📋 Write-up Sections:`);
            Object.entries(sections).forEach(([section, present]) => {
                console.log(`  ${section}: ${present ? '✅' : '❌'}`);
            });
            
            // Show execution statistics from write-up
            const executionMatch = writeUpContent.match(/Total steps executed: (\d+)/);
            const successMatch = writeUpContent.match(/Successful steps: (\d+)/);
            const intelligentMatch = writeUpContent.match(/Intelligent steps \(auto-generated\): (\d+)/);
            
            if (executionMatch && successMatch && intelligentMatch) {
                console.log(`\n📈 Execution Statistics from Write-up:`);
                console.log(`  Total steps: ${executionMatch[1]}`);
                console.log(`  Successful steps: ${successMatch[1]}`);
                console.log(`  Intelligent steps: ${intelligentMatch[1]}`);
            }
            
            // Show sample content from key sections
            console.log(`\n📝 Sample Write-up Content:`);
            
            // Executive Summary
            const execSummaryMatch = writeUpContent.match(/## Executive Summary\n\n([\s\S]*?)(?=##)/);
            if (execSummaryMatch) {
                console.log(`\n📊 Executive Summary:`);
                console.log(execSummaryMatch[1].substring(0, 300) + "...");
            }
            
            // Key Findings
            const findingsMatch = writeUpContent.match(/## Key Findings\n\n([\s\S]*?)(?=##)/);
            if (findingsMatch) {
                console.log(`\n🔍 Key Findings:`);
                console.log(findingsMatch[1].substring(0, 300) + "...");
            }
            
            // Conclusions
            const conclusionsMatch = writeUpContent.match(/## Conclusions\n\n([\s\S]*?)(?=##)/);
            if (conclusionsMatch) {
                console.log(`\n🎯 Conclusions:`);
                console.log(conclusionsMatch[1].substring(0, 300) + "...");
            }
            
        } else {
            console.log(`\n❌ Write-up Generation Failed:`);
            console.log(`  Write-up generated: ❌ No`);
            console.log(`  Project data available: ${!!finalProjectData}`);
        }
        
        // Show project statistics
        console.log(`\n📊 Project Statistics:`);
        console.log(`  Variables created: ${finalVariables.length}`);
        console.log(`  Libraries used: ${finalLibraries.length}`);
        console.log(`  Execution steps: ${finalSessionData?.execution_results?.length || 0}`);
        console.log(`  Research status: ${finalSessionData?.status || 'unknown'}`);
        
        // Show benefits of automatic write-up generation
        console.log(`\n🎯 Benefits of Automatic Write-up Generation:`);
        console.log(`  ✅ Comprehensive documentation of research process`);
        console.log(`  ✅ Automatic inclusion of methodology and findings`);
        console.log(`  ✅ Technical details and execution statistics`);
        console.log(`  ✅ Professional markdown formatting`);
        console.log(`  ✅ Integration with all project tabs`);
        console.log(`  ✅ Time-saving for researchers`);
        console.log(`  ✅ Reproducible research documentation`);
        
        // Show how to access the write-up
        console.log(`\n📖 How to Access the Write-up:`);
        console.log(`  1. Go to the project in the Cedar interface`);
        console.log(`  2. Navigate to the "Paper" tab`);
        console.log(`  3. View the generated research report`);
        console.log(`  4. Edit or export the markdown content`);
        console.log(`  5. Use for publications, presentations, or documentation`);
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Export for use in browser console
window.testWriteUpGeneration = testWriteUpGeneration;

console.log("🧪 Write-up generation test script loaded!");
console.log("Run testWriteUpGeneration() to start the test"); 