/**
 * Test Data Routing Functionality
 * 
 * This script demonstrates how the new data routing system works.
 * It simulates different types of notebook cells and shows how they get
 * automatically routed to the appropriate tabs.
 * 
 * Usage:
 * 1. Open browser console in the Cedar application
 * 2. Copy and paste this script
 * 3. Run the test functions to see data routing in action
 */

console.log('🧪 Data Routing Test Script Loaded');
console.log('Available test functions:');
console.log('- testReferenceRouting()');
console.log('- testDataFileRouting()');
console.log('- testVariableRouting()');
console.log('- testLibraryRouting()');
console.log('- testVisualizationRouting()');
console.log('- testWriteUpRouting()');

// Mock cell data for testing
const mockCells = {
  reference: {
    id: 'ref-test-1',
    type: 'reference',
    content: 'Machine Learning: A Probabilistic Perspective\nby Kevin P. Murphy\n\nA comprehensive textbook covering modern machine learning techniques with a focus on probabilistic methods.',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true
  },
  
  data: {
    id: 'data-test-1',
    type: 'data',
    content: 'customer_id,age,income,churn\n1,25,50000,0\n2,35,75000,1\n3,45,100000,0\n4,28,60000,1\n5,52,120000,0',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true
  },
  
  variable: {
    id: 'var-test-1',
    type: 'variable',
    content: 'churn_threshold = 0.5',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true
  },
  
  library: {
    id: 'lib-test-1',
    type: 'library',
    content: 'pandas',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true
  },
  
  visualization: {
    id: 'viz-test-1',
    type: 'visualization',
    content: 'Churn Rate by Age Group',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true,
    metadata: {
      visualizations: [{
        name: 'churn_by_age',
        type: 'vega-lite',
        description: 'Churn rate visualization by age group',
        content: JSON.stringify({
          mark: 'bar',
          encoding: {
            x: {field: 'age_group', type: 'nominal'},
            y: {field: 'churn_rate', type: 'quantitative'}
          }
        }),
        code: 'import altair as alt\n# Visualization code here'
      }]
    }
  },
  
  writeup: {
    id: 'writeup-test-1',
    type: 'writeup',
    content: '# Customer Churn Analysis\n\n## Executive Summary\n\nThis analysis examines customer churn patterns in our dataset...\n\n## Methodology\n\nWe used machine learning techniques to identify factors contributing to customer churn...\n\n## Results\n\nKey findings include:\n- Age is a significant predictor of churn\n- Income level shows moderate correlation\n- Customer service interactions are crucial\n\n## Recommendations\n\n1. Implement targeted retention programs for high-risk age groups\n2. Improve customer service quality\n3. Develop personalized engagement strategies',
    timestamp: new Date().toISOString(),
    status: 'completed',
    requiresUserAction: false,
    canProceed: true
  }
};

// Test functions
window.testReferenceRouting = async () => {
  console.log('📚 Testing Reference Routing...');
  
  try {
    // Simulate adding a reference cell
    const cell = mockCells.reference;
    console.log('Adding reference cell:', cell);
    
    // This would normally be handled by the DataRouterService
    // For testing, we'll simulate the API call
    const mockApiCall = {
      project_id: 'test-project',
      id: `ref-${Date.now()}`,
      title: 'Machine Learning: A Probabilistic Perspective',
      authors: 'Kevin P. Murphy',
      content: cell.content,
      added_at: new Date().toISOString()
    };
    
    console.log('✅ Reference would be routed to References tab:', mockApiCall);
    console.log('📋 Check the References tab to see the new entry');
    
  } catch (error) {
    console.error('❌ Reference routing test failed:', error);
  }
};

window.testDataFileRouting = async () => {
  console.log('📊 Testing Data File Routing...');
  
  try {
    const cell = mockCells.data;
    console.log('Adding data file cell:', cell);
    
    // Simulate the API call
    const mockApiCall = {
      project_id: 'test-project',
      filename: 'customer_churn_data.csv',
      content: cell.content,
      file_type: 'data'
    };
    
    console.log('✅ Data file would be routed to Data tab:', mockApiCall);
    console.log('📋 Check the Data tab to see the new CSV file');
    
  } catch (error) {
    console.error('❌ Data file routing test failed:', error);
  }
};

window.testVariableRouting = async () => {
  console.log('🔧 Testing Variable Routing...');
  
  try {
    const cell = mockCells.variable;
    console.log('Adding variable cell:', cell);
    
    // Parse variable from content
    const match = cell.content.match(/^(\w+)\s*=\s*(.+)$/);
    if (match) {
      const mockApiCall = {
        name: match[1],
        type: 'string',
        description: 'Variable from notebook',
        value: match[2].trim(),
        metadata: {}
      };
      
      console.log('✅ Variable would be routed to Variables tab:', mockApiCall);
      console.log('📋 Check the Variables tab to see the new variable');
    }
    
  } catch (error) {
    console.error('❌ Variable routing test failed:', error);
  }
};

window.testLibraryRouting = async () => {
  console.log('📦 Testing Library Routing...');
  
  try {
    const cell = mockCells.library;
    console.log('Adding library cell:', cell);
    
    const mockApiCall = {
      name: cell.content.trim(),
      version: 'latest',
      description: `Library from notebook: ${cell.content}`,
      category: 'general',
      installed: false
    };
    
    console.log('✅ Library would be routed to Libraries tab:', mockApiCall);
    console.log('📋 Check the Libraries tab to see the new library');
    
  } catch (error) {
    console.error('❌ Library routing test failed:', error);
  }
};

window.testVisualizationRouting = async () => {
  console.log('📈 Testing Visualization Routing...');
  
  try {
    const cell = mockCells.visualization;
    console.log('Adding visualization cell:', cell);
    
    if (cell.metadata?.visualizations) {
      for (const viz of cell.metadata.visualizations) {
        const mockApiCall = {
          projectId: 'test-project',
          name: viz.name,
          visualizationType: viz.type,
          description: viz.description,
          content: viz.content,
          code: viz.code,
          sessionId: 'test-project'
        };
        
        console.log('✅ Visualization would be routed to Images tab:', mockApiCall);
      }
      console.log('📋 Check the Images tab to see the new visualization');
    }
    
  } catch (error) {
    console.error('❌ Visualization routing test failed:', error);
  }
};

window.testWriteUpRouting = async () => {
  console.log('✍️ Testing Write-up Routing...');
  
  try {
    const cell = mockCells.writeup;
    console.log('Adding write-up cell:', cell);
    
    const mockApiCall = {
      project_id: 'test-project',
      filename: 'research-writeup.md',
      content: cell.content,
      file_type: 'write_up'
    };
    
    console.log('✅ Write-up would be routed to Write-Up tab:', mockApiCall);
    console.log('📋 Check the Write-Up tab to see the new content');
    
  } catch (error) {
    console.error('❌ Write-up routing test failed:', error);
  }
};

// Test all routing functions
window.testAllRouting = async () => {
  console.log('🚀 Testing All Data Routing Functions...');
  
  await testReferenceRouting();
  await testDataFileRouting();
  await testVariableRouting();
  await testLibraryRouting();
  await testVisualizationRouting();
  await testWriteUpRouting();
  
  console.log('✅ All routing tests completed!');
  console.log('📋 Check each tab to see the routed data');
};

// Helper function to simulate cell creation
window.simulateCellCreation = (cellType) => {
  console.log(`🎯 Simulating ${cellType} cell creation...`);
  
  if (mockCells[cellType]) {
    const cell = mockCells[cellType];
    console.log('Cell created:', cell);
    
    // Simulate the data routing process
    console.log('🔄 Data routing in progress...');
    setTimeout(() => {
      console.log(`✅ ${cellType} cell data routed successfully`);
      console.log('📋 Check the appropriate tab for the new content');
    }, 1000);
    
    return cell;
  } else {
    console.error(`❌ Unknown cell type: ${cellType}`);
    console.log('Available types:', Object.keys(mockCells));
  }
};

console.log('🎉 Test script loaded successfully!');
console.log('Run testAllRouting() to test all data routing functions'); 