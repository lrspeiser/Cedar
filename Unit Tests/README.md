# Unit Tests

This folder contains all test files for the Cedar application, organized for better management and maintainability.

## 📁 Folder Structure

```
Unit Tests/
├── README.md                           # This documentation file
├── run-all-tests.js                    # Comprehensive test runner
├── test-cedar.sh                       # Legacy test script
├── frontend_test_output.log            # Frontend test output logs
├── unit_test_output.log                # Unit test output logs
├── test-academic-research-initialization.js
├── test-api-key-fix.js
├── test-categorization-system.js
├── test-data-management.js
├── test-enhanced-execution.js
├── test-intelligent-steps.js
├── test-library-detection.js
├── test-question-generation.js
├── test-research-initialization.js
├── test-research-plan-system.js
├── test-session-persistence.js
├── test-variable-detection.js
└── test-write-up-generation.js
```

## 🧪 Test Categories

### **Research & Initialization Tests**
- `test-academic-research-initialization.js` - Academic research setup and initialization
- `test-research-initialization.js` - General research initialization
- `test-research-plan-system.js` - Research plan generation and management

### **System & Management Tests**
- `test-api-key-fix.js` - API key management and validation
- `test-categorization-system.js` - Content categorization and routing
- `test-data-management.js` - Data file handling and storage
- `test-session-persistence.js` - Session management and persistence

### **Execution & Processing Tests**
- `test-enhanced-execution.js` - Code execution and monitoring
- `test-intelligent-steps.js` - Intelligent step generation
- `test-question-generation.js` - Research question generation

### **Detection & Analysis Tests**
- `test-library-detection.js` - Library dependency detection
- `test-variable-detection.js` - Variable detection and management

### **Content Generation Tests**
- `test-write-up-generation.js` - Research write-up generation

## 🚀 Running Tests

### **Option 1: Comprehensive Test Runner (Recommended)**
```bash
# Run all tests with detailed output
node "Unit Tests/run-all-tests.js"

# Run with help
node "Unit Tests/run-all-tests.js" --help
```

### **Option 2: Build Script Integration**
```bash
# Run tests as part of the build process
./build-with-tests.sh --tests-only

# Run full build with tests
./build-with-tests.sh --full
```

### **Option 3: Individual Test Files**
```bash
# Run a specific test file
node "Unit Tests/test-data-management.js"

# Run multiple specific tests
node "Unit Tests/test-api-key-fix.js" && node "Unit Tests/test-session-persistence.js"
```

## 📊 Test Output

The comprehensive test runner provides:

- **Colored Output**: Green for passes, red for failures
- **Detailed Results**: Full output and error messages for each test
- **Summary Statistics**: Total tests, pass/fail counts, success rate
- **Timing Information**: Start and completion timestamps
- **Exit Codes**: 0 for success, 1 for failures

### **Example Output**
```
================================================================================
🧪 CEDAR COMPREHENSIVE TEST SUITE
================================================================================
📁 Test Directory: /path/to/Cedar/Unit Tests
⏰ Started at: 1/1/2024, 12:00:00 PM
================================================================================

🔍 Running Rust Unit Tests...
✅ PASSED: Rust Unit Tests

🔍 Running Frontend Tests...
✅ PASSED: Frontend Tests

🔍 Running: test-api-key-fix.js
✅ PASSED: test-api-key-fix.js

================================================================================
📊 TEST SUMMARY
================================================================================
📈 Total Tests: 15
✅ Passed: 15
❌ Failed: 0
⏭️  Skipped: 0
📊 Success Rate: 100.0%
================================================================================
⏰ Completed at: 1/1/2024, 12:05:00 PM
================================================================================
```

## 🔧 Adding New Tests

### **1. Create Test File**
```javascript
// test-new-feature.js
console.log('🧪 Testing New Feature...');

async function testNewFeature() {
  try {
    // Test implementation
    console.log('✅ New feature test passed');
  } catch (error) {
    console.error('❌ New feature test failed:', error);
    process.exit(1);
  }
}

testNewFeature();
```

### **2. Naming Convention**
- Use `test-` prefix for all test files
- Use descriptive names: `test-feature-name.js`
- Use kebab-case for file names

### **3. Test Structure**
- Include descriptive console output
- Use try-catch for error handling
- Exit with code 1 on failure
- Provide clear success/failure messages

## 📝 Test Logs

The folder contains log files for debugging:

- `frontend_test_output.log` - Frontend test execution logs
- `unit_test_output.log` - Unit test execution logs

## 🔄 Integration with Build Process

The build script (`build-with-tests.sh`) automatically:

1. Checks for the `Unit Tests` directory
2. Runs the comprehensive test runner
3. Proceeds with build only if all tests pass
4. Provides clear feedback on test results

## 🎯 Best Practices

### **Test Organization**
- Keep related tests together
- Use descriptive file names
- Maintain consistent structure
- Document test purposes

### **Test Execution**
- Run tests before committing code
- Use the comprehensive runner for full validation
- Check logs for detailed debugging information
- Monitor success rates over time

### **Maintenance**
- Update tests when features change
- Remove obsolete test files
- Keep test documentation current
- Regular test suite validation

## 🚨 Troubleshooting

### **Common Issues**

1. **Test Runner Not Found**
   ```bash
   # Ensure you're in the project root
   cd /path/to/Cedar
   node "Unit Tests/run-all-tests.js"
   ```

2. **Permission Denied**
   ```bash
   # Make test runner executable
   chmod +x "Unit Tests/run-all-tests.js"
   ```

3. **Node.js Not Found**
   ```bash
   # Install Node.js or use nvm
   nvm use node
   ```

4. **Test Timeout**
   - Increase timeout in `run-all-tests.js`
   - Check for hanging processes
   - Review test implementation

### **Debug Mode**
```bash
# Run with verbose output
DEBUG=1 node "Unit Tests/run-all-tests.js"
```

## 📞 Support

For test-related issues:

1. Check the test logs in this folder
2. Review the test runner output
3. Verify test file syntax and structure
4. Ensure all dependencies are installed

---

**Last Updated**: January 2024  
**Test Runner Version**: 1.0.0  
**Total Test Files**: 13 