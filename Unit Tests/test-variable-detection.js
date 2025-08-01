// Test script for comprehensive variable detection and tracking
const { invoke } = window.__TAURI__;

async function testVariableDetection() {
    console.log("🧪 Testing Comprehensive Variable Detection and Tracking");
    
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
                name: "Variable Detection Test",
                goal: "Test comprehensive variable detection and tracking from Python code"
            }
        });
        
        console.log("✅ Project created:", project);
        
        // Start research with code that creates various types of variables
        console.log("🚀 Starting research with variable-rich code...");
        const sessionId = `session-${Date.now()}`;
        
        const researchResult = await invoke('start_research', {
            request: {
                project_id: project.id,
                session_id: sessionId,
                goal: "Create a comprehensive data analysis script that demonstrates variable detection with various data types, shapes, and purposes",
                answers: {
                    "data_source": "We'll create synthetic data for testing variable detection",
                    "analysis_type": "Comprehensive analysis with multiple variable types",
                    "output_format": "Show variable detection in action with metadata"
                }
            }
        });
        
        console.log("✅ Research started:", researchResult);
        
        // Monitor the execution progress and variable detection
        console.log("📊 Monitoring execution and variable detection...");
        let completed = false;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max
        
        while (!completed && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
                // Check session progress
                const sessionData = await invoke('load_session', { session_id: sessionId });
                console.log(`📈 Session status: ${sessionData?.status || 'unknown'}`);
                
                // Check variables
                const variables = await invoke('get_variables', { project_id: project.id });
                console.log(`📊 Variables detected: ${variables.length}`);
                
                if (variables.length > 0) {
                    console.log("📋 Variable details:");
                    variables.forEach(variable => {
                        console.log(`\n🔧 Variable: ${variable.name}`);
                        console.log(`   Type: ${variable.type_name}`);
                        console.log(`   Shape: ${variable.shape || 'N/A'}`);
                        console.log(`   Purpose: ${variable.purpose}`);
                        console.log(`   Source: ${variable.source}`);
                        console.log(`   Units: ${variable.units || 'N/A'}`);
                        console.log(`   Tags: [${variable.tags.join(', ')}]`);
                        console.log(`   Related to: [${variable.related_to.join(', ')}]`);
                        console.log(`   Visibility: ${variable.visibility}`);
                        console.log(`   Example value: ${variable.example_value.substring(0, 100)}${variable.example_value.length > 100 ? '...' : ''}`);
                        console.log(`   Updated: ${variable.updated_at}`);
                    });
                }
                
                if (sessionData?.execution_results) {
                    console.log(`📊 Execution results: ${sessionData.execution_results.length} steps completed`);
                    
                    // Show variable detection in execution results
                    sessionData.execution_results.forEach((result, index) => {
                        console.log(`\n🔧 Step ${result.step_number + 1}:`);
                        console.log(`   Description: ${result.description}`);
                        console.log(`   Status: ${result.status}`);
                        if (result.execution_time_ms) {
                            console.log(`   Execution time: ${result.execution_time_ms}ms`);
                        }
                        
                        // Look for variable detection messages in logs
                        if (result.logs && result.logs.length > 0) {
                            const variableLogs = result.logs.filter(log => 
                                log.includes("Extracted") || 
                                log.includes("variables") ||
                                log.includes("Variable")
                            );
                            if (variableLogs.length > 0) {
                                console.log(`   📊 Variable activity:`);
                                variableLogs.forEach(log => console.log(`      ${log}`));
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
        
        // Final variable status with comprehensive analysis
        console.log("\n📊 Final Variable Analysis:");
        const finalVariables = await invoke('get_variables', { project_id: project.id });
        
        // Group variables by type
        const variablesByType = {};
        finalVariables.forEach(variable => {
            if (!variablesByType[variable.type_name]) {
                variablesByType[variable.type_name] = [];
            }
            variablesByType[variable.type_name].push(variable);
        });
        
        console.log("\n📈 Variables by Type:");
        Object.entries(variablesByType).forEach(([type, vars]) => {
            console.log(`  ${type}: ${vars.length} variable(s)`);
        });
        
        // Group variables by source
        const variablesBySource = {};
        finalVariables.forEach(variable => {
            if (!variablesBySource[variable.source]) {
                variablesBySource[variable.source] = [];
            }
            variablesBySource[variable.source].push(variable);
        });
        
        console.log("\n📂 Variables by Source:");
        Object.entries(variablesBySource).forEach(([source, vars]) => {
            console.log(`  ${source.replace('_', ' ')}: ${vars.length} variable(s)`);
        });
        
        // Show variables with units
        const variablesWithUnits = finalVariables.filter(v => v.units);
        if (variablesWithUnits.length > 0) {
            console.log("\n📏 Variables with Units:");
            variablesWithUnits.forEach(variable => {
                console.log(`  ${variable.name}: ${variable.units}`);
            });
        }
        
        // Show variables with related variables
        const variablesWithRelations = finalVariables.filter(v => v.related_to.length > 0);
        if (variablesWithRelations.length > 0) {
            console.log("\n🔗 Variables with Relationships:");
            variablesWithRelations.forEach(variable => {
                console.log(`  ${variable.name} → [${variable.related_to.join(', ')}]`);
            });
        }
        
        // Show most common tags
        const allTags = finalVariables.flatMap(v => v.tags);
        const tagCounts = {};
        allTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
        
        console.log("\n🏷️ Most Common Tags:");
        Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([tag, count]) => {
                console.log(`  ${tag}: ${count} variable(s)`);
            });
        
        // Summary statistics
        console.log(`\n📊 Summary:`);
        console.log(`  Total variables: ${finalVariables.length}`);
        console.log(`  Variables with shapes: ${finalVariables.filter(v => v.shape).length}`);
        console.log(`  Variables with units: ${variablesWithUnits.length}`);
        console.log(`  Variables with relationships: ${variablesWithRelations.length}`);
        console.log(`  Public variables: ${finalVariables.filter(v => v.visibility === 'public').length}`);
        console.log(`  Hidden variables: ${finalVariables.filter(v => v.visibility === 'hidden').length}`);
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Export for use in browser console
window.testVariableDetection = testVariableDetection;

console.log("🧪 Variable detection test script loaded!");
console.log("Run testVariableDetection() to start the test"); 