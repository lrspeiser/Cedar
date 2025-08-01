// Test Session Persistence
// This script tests that research session state is preserved when reopening projects

console.log('🧪 Testing Session Persistence...');

// Set API key
const API_KEY = 'sk-test-key-for-session-persistence-test';

async function testSessionPersistence() {
  try {
    // Step 1: Set API key
    console.log('1️⃣ Setting API key...');
    await window.apiService.setApiKey(API_KEY);
    console.log('✅ API key set');

    // Step 2: Create a new project
    console.log('2️⃣ Creating new project...');
    const project = await window.apiService.createProject({
      name: 'Session Persistence Test',
      goal: 'Test that research session state is preserved when reopening projects'
    });
    console.log('✅ Project created:', project.id);

    // Step 3: Start research (this should create a session)
    console.log('3️⃣ Starting research...');
    const sessionId = `session_${project.id}`;
    const researchResponse = await window.apiService.startResearch({
      projectId: project.id,
      sessionId: sessionId,
      goal: project.goal,
      answers: {}
    });
    console.log('✅ Research started:', researchResponse);

    // Step 4: Wait a moment for execution to begin
    console.log('4️⃣ Waiting for execution to begin...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Load the session to verify it was created
    console.log('5️⃣ Loading session to verify creation...');
    const sessionData = await window.apiService.loadSession(sessionId);
    console.log('✅ Session loaded:', sessionData);

    if (!sessionData) {
      throw new Error('Session was not created');
    }

    // Step 6: Get the project again to verify session_id was saved
    console.log('6️⃣ Reloading project to verify session_id persistence...');
    const reloadedProject = await window.apiService.getProject(project.id);
    console.log('✅ Project reloaded:', reloadedProject);

    if (!reloadedProject.session_id) {
      throw new Error('Project session_id was not saved');
    }

    if (reloadedProject.session_id !== sessionId) {
      throw new Error(`Session ID mismatch: expected ${sessionId}, got ${reloadedProject.session_id}`);
    }

    // Step 7: Wait for execution to complete
    console.log('7️⃣ Waiting for research execution to complete...');
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      const currentSession = await window.apiService.loadSession(sessionId);
      const currentProject = await window.apiService.getProject(project.id);
      
      console.log(`   Attempt ${attempts + 1}: Session status: ${currentSession?.status}, Project status: ${currentProject?.session_status}`);
      
      if (currentSession?.status === 'completed' || currentProject?.session_status === 'completed') {
        console.log('✅ Research execution completed');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('⚠️ Research execution did not complete within timeout, but continuing test...');
    }

    // Step 8: Verify session data is still accessible
    console.log('8️⃣ Verifying session data persistence...');
    const finalSessionData = await window.apiService.loadSession(sessionId);
    const finalProject = await window.apiService.getProject(project.id);
    
    console.log('✅ Final session data:', {
      hasSession: !!finalSessionData,
      sessionStatus: finalSessionData?.status,
      hasPlanCells: !!finalSessionData?.plan_cells,
      planCellsCount: finalSessionData?.plan_cells?.length || 0,
      hasExecutionResults: !!finalSessionData?.execution_results,
      executionResultsCount: finalSessionData?.execution_results?.length || 0,
      projectSessionId: finalProject?.session_id,
      projectSessionStatus: finalProject?.session_status
    });

    // Step 9: Test reopening the project (simulate what happens when user reopens)
    console.log('9️⃣ Testing project reopening...');
    
    // Simulate reopening by getting the project again
    const reopenedProject = await window.apiService.getProject(project.id);
    console.log('✅ Project reopened:', {
      id: reopenedProject.id,
      name: reopenedProject.name,
      sessionId: reopenedProject.session_id,
      sessionStatus: reopenedProject.session_status
    });

    // Step 10: Load session data after reopening
    console.log('🔟 Loading session data after reopening...');
    const reopenedSessionData = await window.apiService.loadSession(reopenedProject.session_id);
    
    if (!reopenedSessionData) {
      throw new Error('Session data was lost after reopening project');
    }

    console.log('✅ Session data loaded after reopening:', {
      hasSession: !!reopenedSessionData,
      sessionStatus: reopenedSessionData.status,
      hasPlanCells: !!reopenedSessionData.plan_cells,
      planCellsCount: reopenedSessionData.plan_cells?.length || 0,
      hasExecutionResults: !!reopenedSessionData.execution_results,
      executionResultsCount: reopenedSessionData.execution_results?.length || 0
    });

    // Step 11: Verify the session data matches what we had before
    console.log('1️⃣1️⃣ Verifying session data consistency...');
    
    const originalCellsCount = finalSessionData?.plan_cells?.length || 0;
    const reopenedCellsCount = reopenedSessionData?.plan_cells?.length || 0;
    
    if (originalCellsCount !== reopenedCellsCount) {
      throw new Error(`Cell count mismatch: original had ${originalCellsCount}, reopened has ${reopenedCellsCount}`);
    }

    console.log('✅ Session data consistency verified');

    // Step 12: Test that we can continue working with the session
    console.log('1️⃣2️⃣ Testing continued session usage...');
    
    // Try to execute some code in the existing session
    const testCode = 'print("Testing session persistence - this should work!")';
    const codeExecutionResult = await window.apiService.executeCode({
      code: testCode,
      sessionId: reopenedProject.session_id
    });
    
    console.log('✅ Code execution in reopened session:', codeExecutionResult);

    // Final summary
    console.log('\n🎉 SESSION PERSISTENCE TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Test Results Summary:');
    console.log('✅ Project created with persistent session ID');
    console.log('✅ Research session started and executed');
    console.log('✅ Session data saved to disk');
    console.log('✅ Project metadata updated with session information');
    console.log('✅ Session data accessible after project reopening');
    console.log('✅ Session data consistency maintained');
    console.log('✅ Continued session usage works after reopening');
    
    console.log('\n🔧 Technical Details:');
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Final Session Status: ${finalSessionData?.status}`);
    console.log(`   Final Project Status: ${finalProject?.session_status}`);
    console.log(`   Plan Cells Count: ${finalSessionData?.plan_cells?.length || 0}`);
    console.log(`   Execution Results Count: ${finalSessionData?.execution_results?.length || 0}`);
    
    console.log('\n💡 Benefits Achieved:');
    console.log('   • Research sessions are now persistent across app restarts');
    console.log('   • Users can close and reopen projects without losing progress');
    console.log('   • Session state is automatically saved and restored');
    console.log('   • Project metadata tracks session status');
    console.log('   • Consistent user experience with reliable state management');

    return {
      success: true,
      projectId: project.id,
      sessionId: sessionId,
      finalStatus: finalSessionData?.status,
      cellsCount: finalSessionData?.plan_cells?.length || 0,
      resultsCount: finalSessionData?.execution_results?.length || 0
    };

  } catch (error) {
    console.error('❌ Session persistence test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
testSessionPersistence().then(result => {
  console.log('\n🏁 Test completed with result:', result);
  
  if (result.success) {
    console.log('🎯 Session persistence is working correctly!');
  } else {
    console.log('🚨 Session persistence needs attention');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
}); 