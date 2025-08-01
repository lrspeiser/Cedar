/**
 * Data Management Test Suite
 * 
 * This file tests the comprehensive data management functionality including:
 * - File upload with automatic analysis
 * - LLM-powered data structure understanding
 * - DuckDB integration with PostgreSQL-style queries
 * - Data file listing and metadata
 * 
 * USAGE:
 * 1. Open browser console in Cedar app
 * 2. Copy and paste this entire file
 * 3. Run testDataManagement() to execute all tests
 * 
 * REQUIREMENTS:
 * - Valid OpenAI API key configured
 * - Active project created
 */

// Test configuration
const TEST_CONFIG = {
  projectId: null, // Will be set after project creation
  testFiles: {
    csv: {
      name: 'test_data.csv',
      content: `name,age,city,salary
John Doe,30,New York,75000
Jane Smith,25,Los Angeles,65000
Bob Johnson,35,Chicago,80000
Alice Brown,28,Boston,70000
Charlie Wilson,32,Seattle,72000`
    },
    json: {
      name: 'test_data.json',
      content: `[
  {"id": 1, "name": "Product A", "price": 29.99, "category": "Electronics", "in_stock": true},
  {"id": 2, "name": "Product B", "price": 19.99, "category": "Books", "in_stock": false},
  {"id": 3, "name": "Product C", "price": 49.99, "category": "Electronics", "in_stock": true},
  {"id": 4, "name": "Product D", "price": 9.99, "category": "Books", "in_stock": true},
  {"id": 5, "name": "Product E", "price": 39.99, "category": "Clothing", "in_stock": false}
]`
    }
  }
};

/**
 * Test 1: Create a test project
 */
async function testCreateProject() {
  console.log('🧪 Test 1: Creating test project...');
  
  try {
    const project = await apiService.createProject({
      name: 'Data Management Test Project',
      goal: 'Test comprehensive data management functionality with DuckDB integration'
    });
    
    TEST_CONFIG.projectId = project.id;
    console.log('✅ Test project created:', project.id);
    return project;
  } catch (error) {
    console.error('❌ Failed to create test project:', error);
    throw error;
  }
}

/**
 * Test 2: Upload CSV data file
 */
async function testUploadCSVFile() {
  console.log('🧪 Test 2: Uploading CSV data file...');
  
  try {
    const result = await apiService.uploadDataFile({
      projectId: TEST_CONFIG.projectId,
      filename: TEST_CONFIG.testFiles.csv.name,
      content: TEST_CONFIG.testFiles.csv.content,
      fileType: 'csv'
    });
    
    console.log('✅ CSV file uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to upload CSV file:', error);
    throw error;
  }
}

/**
 * Test 3: Upload JSON data file
 */
async function testUploadJSONFile() {
  console.log('🧪 Test 3: Uploading JSON data file...');
  
  try {
    const result = await apiService.uploadDataFile({
      projectId: TEST_CONFIG.projectId,
      filename: TEST_CONFIG.testFiles.json.name,
      content: TEST_CONFIG.testFiles.json.content,
      fileType: 'json'
    });
    
    console.log('✅ JSON file uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to upload JSON file:', error);
    throw error;
  }
}

/**
 * Test 4: List data files
 */
async function testListDataFiles() {
  console.log('🧪 Test 4: Listing data files...');
  
  try {
    const result = await apiService.listDataFiles({
      projectId: TEST_CONFIG.projectId
    });
    
    console.log('✅ Data files listed successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to list data files:', error);
    throw error;
  }
}

/**
 * Test 5: Analyze data file
 */
async function testAnalyzeDataFile(fileId) {
  console.log('🧪 Test 5: Analyzing data file...');
  
  try {
    const result = await apiService.analyzeDataFile({
      projectId: TEST_CONFIG.projectId,
      fileId: fileId
    });
    
    console.log('✅ Data file analyzed successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to analyze data file:', error);
    throw error;
  }
}

/**
 * Test 6: Execute DuckDB queries
 */
async function testDuckDBQueries(tableName) {
  console.log('🧪 Test 6: Executing DuckDB queries...');
  
  const queries = [
    {
      name: 'Select all data',
      query: `SELECT * FROM ${tableName} LIMIT 5;`
    },
    {
      name: 'Count rows',
      query: `SELECT COUNT(*) as total_rows FROM ${tableName};`
    },
    {
      name: 'Column information',
      query: `DESCRIBE ${tableName};`
    },
    {
      name: 'Sample aggregation',
      query: `SELECT 
  COUNT(*) as count,
  AVG(CAST(age AS FLOAT)) as avg_age,
  MIN(CAST(age AS FLOAT)) as min_age,
  MAX(CAST(age AS FLOAT)) as max_age
FROM ${tableName} WHERE age IS NOT NULL;`
    }
  ];
  
  const results = [];
  
  for (const queryTest of queries) {
    try {
      console.log(`  Running query: ${queryTest.name}`);
      const result = await apiService.executeDuckDBQuery({
        projectId: TEST_CONFIG.projectId,
        tableName: tableName,
        query: queryTest.query
      });
      
      console.log(`  ✅ ${queryTest.name} executed successfully:`, result);
      results.push({ name: queryTest.name, result });
    } catch (error) {
      console.error(`  ❌ ${queryTest.name} failed:`, error);
      results.push({ name: queryTest.name, error: error.message });
    }
  }
  
  return results;
}

/**
 * Test 7: Complex data operations
 */
async function testComplexDataOperations() {
  console.log('🧪 Test 7: Complex data operations...');
  
  try {
    // Create a more complex dataset
    const complexData = {
      name: 'complex_data.csv',
      content: `id,name,department,salary,hire_date,performance_score
1,Alice Johnson,Engineering,85000,2020-01-15,4.2
2,Bob Smith,Marketing,72000,2019-03-22,3.8
3,Carol Davis,Sales,68000,2021-06-10,4.5
4,David Wilson,Engineering,92000,2018-11-05,4.1
5,Eva Brown,Marketing,75000,2020-09-18,3.9
6,Frank Miller,Sales,71000,2021-02-14,4.3
7,Grace Lee,Engineering,88000,2019-08-30,4.4
8,Henry Taylor,Marketing,78000,2020-12-03,3.7
9,Ivy Chen,Sales,69000,2021-04-25,4.6
10,Jack Anderson,Engineering,95000,2018-05-12,4.0`
    };
    
    // Upload complex data
    const uploadResult = await apiService.uploadDataFile({
      projectId: TEST_CONFIG.projectId,
      filename: complexData.name,
      content: complexData.content,
      fileType: 'csv'
    });
    
    console.log('✅ Complex data uploaded:', uploadResult);
    
    // Execute complex queries
    const complexQueries = [
      {
        name: 'Department statistics',
        query: `SELECT 
  department,
  COUNT(*) as employee_count,
  AVG(CAST(salary AS FLOAT)) as avg_salary,
  AVG(CAST(performance_score AS FLOAT)) as avg_performance
FROM table_${uploadResult.file_info.id.replace(/-/g, '_')}
GROUP BY department
ORDER BY avg_salary DESC;`
      },
      {
        name: 'Top performers',
        query: `SELECT 
  name,
  department,
  salary,
  performance_score
FROM table_${uploadResult.file_info.id.replace(/-/g, '_')}
WHERE CAST(performance_score AS FLOAT) >= 4.0
ORDER BY performance_score DESC, salary DESC
LIMIT 5;`
      },
      {
        name: 'Salary distribution',
        query: `SELECT 
  CASE 
    WHEN CAST(salary AS FLOAT) < 70000 THEN 'Low'
    WHEN CAST(salary AS FLOAT) < 80000 THEN 'Medium'
    ELSE 'High'
  END as salary_range,
  COUNT(*) as count
FROM table_${uploadResult.file_info.id.replace(/-/g, '_')}
GROUP BY salary_range
ORDER BY count DESC;`
      }
    ];
    
    const queryResults = [];
    for (const queryTest of complexQueries) {
      try {
        const result = await apiService.executeDuckDBQuery({
          projectId: TEST_CONFIG.projectId,
          tableName: `table_${uploadResult.file_info.id.replace(/-/g, '_')}`,
          query: queryTest.query
        });
        
        console.log(`✅ ${queryTest.name}:`, result);
        queryResults.push({ name: queryTest.name, result });
      } catch (error) {
        console.error(`❌ ${queryTest.name} failed:`, error);
        queryResults.push({ name: queryTest.name, error: error.message });
      }
    }
    
    return { uploadResult, queryResults };
  } catch (error) {
    console.error('❌ Complex data operations failed:', error);
    throw error;
  }
}

/**
 * Test 8: Data integration with research workflow
 */
async function testDataIntegration() {
  console.log('🧪 Test 8: Data integration with research workflow...');
  
  try {
    // Start a research session that uses the uploaded data
    const researchResult = await apiService.startResearch({
      projectId: TEST_CONFIG.projectId,
      sessionId: `test-session-${Date.now()}`,
      goal: 'Analyze the uploaded employee data to understand salary distribution and performance patterns across departments'
    });
    
    console.log('✅ Research session started with data integration:', researchResult);
    return researchResult;
  } catch (error) {
    console.error('❌ Data integration test failed:', error);
    throw error;
  }
}

/**
 * Main test function
 */
async function testDataManagement() {
  console.log('🚀 Starting Data Management Test Suite...');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Create project
    const project = await testCreateProject();
    
    // Test 2: Upload CSV file
    const csvResult = await testUploadCSVFile();
    
    // Test 3: Upload JSON file
    const jsonResult = await testUploadJSONFile();
    
    // Test 4: List data files
    const fileList = await testListDataFiles();
    
    // Test 5: Analyze CSV file
    if (csvResult.file_info?.id) {
      await testAnalyzeDataFile(csvResult.file_info.id);
    }
    
    // Test 6: Execute DuckDB queries on CSV data
    if (csvResult.file_info?.table_name) {
      await testDuckDBQueries(csvResult.file_info.table_name);
    }
    
    // Test 7: Complex data operations
    await testComplexDataOperations();
    
    // Test 8: Data integration
    await testDataIntegration();
    
    console.log('=' .repeat(60));
    console.log('🎉 All Data Management Tests Completed Successfully!');
    console.log('📊 Project ID:', TEST_CONFIG.projectId);
    console.log('📁 Data Files:', fileList.count);
    
    return {
      projectId: TEST_CONFIG.projectId,
      csvResult,
      jsonResult,
      fileList
    };
    
  } catch (error) {
    console.error('💥 Data Management Test Suite Failed:', error);
    throw error;
  }
}

/**
 * Cleanup function to delete test project
 */
async function cleanupTestProject() {
  if (!TEST_CONFIG.projectId) {
    console.log('No test project to clean up');
    return;
  }
  
  try {
    await apiService.deleteProject(TEST_CONFIG.projectId);
    console.log('✅ Test project cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to clean up test project:', error);
  }
}

// Export functions for manual testing
window.testDataManagement = testDataManagement;
window.cleanupTestProject = cleanupTestProject;
window.TEST_CONFIG = TEST_CONFIG;

console.log('📋 Data Management Test Suite loaded!');
console.log('Available functions:');
console.log('- testDataManagement() - Run all tests');
console.log('- cleanupTestProject() - Clean up test project');
console.log('- TEST_CONFIG - Test configuration object'); 