// Test script for session persistence
const { invoke } = require('@tauri-apps/api/tauri');

async function testSessionPersistence() {
  console.log('🧪 Testing session persistence...');
  
  try {
    // Step 1: Create a test project
    console.log('1️⃣ Creating test project...');
    const project = await invoke('create_project', {
      request: {
        name: 'Session Persistence Test',
        goal: 'Test session data persistence across tab switches'
      }
    });
    
    console.log('✅ Project created:', {
      id: project.id,
      name: project.name,
      sessionId: project.session_id,
      sessionStatus: project.session_status
    });

    // Step 2: Start research to generate session data
    console.log('2️⃣ Starting research...');
    const sessionId = `session_${project.id}`;
    
    const researchResult = await invoke('start_research', {
      request: {
        project_id: project.id,
        session_id: sessionId,
        goal: project.goal,
        answers: {
          q1: 'A) focus on statistical analysis',
          q2: 'A) analyze historical data',
          q3: 'A) interactive charts and graphs'
        }
      }
    });
    
    console.log('✅ Research started:', {
      hasCells: !!researchResult.cells,
      cellCount: researchResult.cells?.length || 0,
      status: researchResult.status
    });

    // Step 3: Save some additional session data
    console.log('3️⃣ Saving additional session data...');
    const testCells = [
      {
        id: 'test-cell-1',
        cell_type: 'Code',
        content: 'print("Test cell 1")',
        origin: 'user',
        execution_result: 'Test cell 1\n',
        metadata: {
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
      },
      {
        id: 'test-cell-2',
        cell_type: 'Text',
        content: 'This is a test text cell',
        origin: 'user',
        execution_result: null,
        metadata: {
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      }
    ];

    await invoke('save_session', {
      session_id: sessionId,
      data: {
        project_id: project.id,
        goal: project.goal,
        plan_cells: testCells,
        status: 'completed',
        execution_results: [],
        updated_at: new Date().toISOString()
      }
    });
    
    console.log('✅ Additional session data saved');

    // Step 4: Load session data
    console.log('4️⃣ Loading session data...');
    const loadedSession = await invoke('load_session', {
      session_id: sessionId
    });
    
    if (!loadedSession) {
      throw new Error('Session data was not loaded');
    }

    console.log('✅ Session loaded:', {
      hasSession: !!loadedSession,
      hasPlanCells: !!loadedSession.plan_cells,
      planCellsCount: loadedSession.plan_cells?.length || 0,
      status: loadedSession.status
    });

    // Step 5: Verify the data matches what we saved
    console.log('5️⃣ Verifying session data integrity...');
    const savedCellsCount = testCells.length;
    const loadedCellsCount = loadedSession.plan_cells?.length || 0;
    
    if (loadedCellsCount < savedCellsCount) {
      throw new Error(`Cell count mismatch: saved ${savedCellsCount}, loaded ${loadedCellsCount}`);
    }

    console.log('✅ Session data integrity verified');

    // Step 6: Test project reopening
    console.log('6️⃣ Testing project reopening...');
    
    // Simulate reopening by getting the project again
    const reopenedProject = await invoke('get_project', {
      project_id: project.id
    });
    
    console.log('✅ Project reopened:', {
      id: reopenedProject.id,
      name: reopenedProject.name,
      sessionId: reopenedProject.session_id,
      sessionStatus: reopenedProject.session_status
    });

    // Step 7: Load session data after reopening
    console.log('7️⃣ Loading session data after reopening...');
    const reopenedSessionData = await invoke('load_session', {
      session_id: reopenedProject.session_id
    });
    
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

    // Step 8: Verify the session data matches what we had before
    console.log('8️⃣ Verifying session data consistency...');
    
    const originalCellsCount = loadedSession?.plan_cells?.length || 0;
    const reopenedCellsCount = reopenedSessionData?.plan_cells?.length || 0;
    
    if (originalCellsCount !== reopenedCellsCount) {
      throw new Error(`Cell count mismatch: original had ${originalCellsCount}, reopened has ${reopenedCellsCount}`);
    }

    console.log('✅ Session data consistency verified');

    // Step 9: Test that we can continue working with the session
    console.log('9️⃣ Testing continued session usage...');
    
    // Try to execute some code in the existing session
    const testCode = 'print("Testing session persistence - this should work!")';
    const codeExecutionResult = await invoke('execute_code', {
      request: {
        code: testCode,
        session_id: sessionId
      }
    });
    
    console.log('✅ Code execution in session:', {
      success: !!codeExecutionResult,
      hasOutput: !!codeExecutionResult.output
    });

    // Step 10: Final session save and verification
    console.log('🔟 Final session save and verification...');
    
    // Save the session one more time
    await invoke('save_session', {
      session_id: sessionId,
      data: {
        project_id: project.id,
        goal: project.goal,
        plan_cells: [...testCells, {
          id: 'final-test-cell',
          cell_type: 'Code',
          content: testCode,
          origin: 'user',
          execution_result: codeExecutionResult.output || 'No output',
          metadata: {
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        }],
        status: 'completed',
        execution_results: [],
        updated_at: new Date().toISOString()
      }
    });
    
    // Load one final time to verify everything is saved
    const finalSessionData = await invoke('load_session', {
      session_id: sessionId
    });
    
    console.log('✅ Final session verification:', {
      hasSession: !!finalSessionData,
      finalCellCount: finalSessionData?.plan_cells?.length || 0
    });

    console.log('🎉 All session persistence tests passed!');
    
    // Cleanup: Delete the test project
    console.log('🧹 Cleaning up test project...');
    await invoke('delete_project', {
      project_id: project.id
    });
    console.log('✅ Test project deleted');

  } catch (error) {
    console.error('❌ Session persistence test failed:', error);
    throw error;
  }
}

// Run the test
testSessionPersistence(); 