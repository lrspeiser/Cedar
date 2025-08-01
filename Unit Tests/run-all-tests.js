#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Cedar
 * 
 * This script runs all test files in the Unit Tests folder and provides
 * a detailed summary of test results.
 * 
 * Usage:
 *   node "Unit Tests/run-all-tests.js"
 *   npm run test
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Function to print colored output
function printColor(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Function to print header
function printHeader() {
  console.log('\n' + '='.repeat(80));
  printColor('bright', '🧪 CEDAR COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80));
  console.log(`📁 Test Directory: ${__dirname}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80) + '\n');
}

// Function to print test result
function printTestResult(testFile, success, output, error) {
  const status = success ? '✅ PASSED' : '❌ FAILED';
  const color = success ? 'green' : 'red';
  
  printColor(color, `\n${status}: ${testFile}`);
  
  if (output) {
    console.log('📋 Output:');
    console.log(output);
  }
  
  if (error) {
    console.log('🚨 Error:');
    console.log(error);
  }
  
  console.log('-'.repeat(60));
}

// Function to run a single test file
function runTestFile(testFile) {
  const testPath = path.join(__dirname, testFile);
  
  printColor('blue', `\n🔍 Running: ${testFile}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(testPath)) {
      throw new Error(`Test file not found: ${testPath}`);
    }
    
    // Check if this is a browser-dependent test
    const fileContent = fs.readFileSync(testPath, 'utf8');
    const isBrowserTest = fileContent.includes('window') || 
                         fileContent.includes('__TAURI__') || 
                         fileContent.includes('@tauri-apps/api');
    
    if (isBrowserTest) {
      printColor('yellow', `⏭️  SKIPPED: ${testFile} (Browser-dependent test)`);
      testResults.skipped++;
      testResults.details.push({
        file: testFile,
        status: 'skipped',
        output: 'Browser-dependent test - requires Tauri environment',
        error: null
      });
      return;
    }
    
    // Run the test file
    const output = execSync(`node "${testPath}"`, { 
      encoding: 'utf8',
      timeout: 30000, // 30 second timeout
      stdio: 'pipe'
    });
    
    testResults.passed++;
    testResults.details.push({
      file: testFile,
      status: 'passed',
      output: output,
      error: null
    });
    
    printTestResult(testFile, true, output, null);
    
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      file: testFile,
      status: 'failed',
      output: error.stdout || '',
      error: error.stderr || error.message
    });
    
    printTestResult(testFile, false, error.stdout || '', error.stderr || error.message);
  }
  
  testResults.total++;
}

// Function to run Rust tests
function runRustTests() {
  printColor('blue', '\n🔍 Running Rust Unit Tests...');
  
  try {
    const output = execSync('cargo test --bin cedar-app', { 
      encoding: 'utf8',
      timeout: 60000, // 60 second timeout
      stdio: 'pipe'
    });
    
    testResults.passed++;
    testResults.details.push({
      file: 'Rust Unit Tests',
      status: 'passed',
      output: output,
      error: null
    });
    
    printTestResult('Rust Unit Tests', true, output, null);
    
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      file: 'Rust Unit Tests',
      status: 'failed',
      output: error.stdout || '',
      error: error.stderr || error.message
    });
    
    printTestResult('Rust Unit Tests', false, error.stdout || '', error.stderr || error.message);
  }
  
  testResults.total++;
}

// Function to run frontend tests
function runFrontendTests() {
  printColor('blue', '\n🔍 Running Frontend Tests...');
  
  try {
    // Check if we're in the right directory for frontend tests
    const frontendPath = path.join(__dirname, '..', 'frontend');
    if (!fs.existsSync(frontendPath)) {
      throw new Error('Frontend directory not found');
    }
    
    // Check if package.json has a test script
    const packageJsonPath = path.join(frontendPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('Frontend package.json not found');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.test) {
      printColor('yellow', '⏭️  SKIPPED: Frontend Tests (No test script defined)');
      testResults.skipped++;
      testResults.details.push({
        file: 'Frontend Tests',
        status: 'skipped',
        output: 'No test script defined in package.json',
        error: null
      });
      return;
    }
    
    // Change to frontend directory and run tests
    const output = execSync('npm test', { 
      cwd: frontendPath,
      encoding: 'utf8',
      timeout: 30000,
      stdio: 'pipe'
    });
    
    testResults.passed++;
    testResults.details.push({
      file: 'Frontend Tests',
      status: 'passed',
      output: output,
      error: null
    });
    
    printTestResult('Frontend Tests', true, output, null);
    
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      file: 'Frontend Tests',
      status: 'failed',
      output: error.stdout || '',
      error: error.stderr || error.message
    });
    
    printTestResult('Frontend Tests', false, error.stdout || '', error.stderr || error.message);
  }
  
  testResults.total++;
}

// Function to print summary
function printSummary() {
  console.log('\n' + '='.repeat(80));
  printColor('bright', '📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`📈 Total Tests: ${testResults.total}`);
  printColor('green', `✅ Passed: ${testResults.passed}`);
  printColor('red', `❌ Failed: ${testResults.failed}`);
  printColor('yellow', `⏭️  Skipped: ${testResults.skipped}`);
  
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 Failed Tests:');
    testResults.details
      .filter(result => result.status === 'failed')
      .forEach(result => {
        printColor('red', `  - ${result.file}`);
      });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`⏰ Completed at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Function to get all test files
function getTestFiles() {
  const testFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file.startsWith('test-'))
    .sort();
  
  return testFiles;
}

// Main execution
function main() {
  printHeader();
  
  // Get all test files
  const testFiles = getTestFiles();
  
  printColor('cyan', `📋 Found ${testFiles.length} test files:`);
  testFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Run Rust tests first
  runRustTests();
  
  // Run individual test files
  testFiles.forEach(runTestFile);
  
  // Print summary
  printSummary();
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 Cedar Test Runner

Usage:
  node "Unit Tests/run-all-tests.js"           # Run all tests
  node "Unit Tests/run-all-tests.js" --help    # Show this help

Options:
  --help, -h    Show this help message

Test Files:
  All test-*.js files in the Unit Tests folder will be executed.
  
Output:
  - Detailed results for each test
  - Summary with pass/fail counts
  - Success rate calculation
  - Exit code 0 for success, 1 for failures
`);
  process.exit(0);
}

// Run the main function
main(); 