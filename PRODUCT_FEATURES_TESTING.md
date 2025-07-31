# Cedar Product Features Testing Guide

This document provides comprehensive testing instructions for all Cedar product features, including unit tests, CLI tests, API tests, and frontend tests.

## 🏗️ Architecture Overview

Cedar is built with a modern desktop application architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Tauri Backend  │◄──►│  Cedar Core     │
│   (TypeScript)   │    │   (Rust)        │    │   (Rust)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔐 API Key Management

### Feature Description
Secure API key handling with memory-only storage and automatic cleanup.

### Testing Instructions

#### Unit Tests
```bash
# Run API key management tests
cargo test test_api_key_management --bin cedar-app
```

#### CLI Tests
```bash
# Test API key setting
./target/debug/cedar-app --cli-test set_api_key '{"api_key": "sk-test-key-12345"}'

# Test API key status check
./target/debug/cedar-app --cli-test get_api_key_status
```

#### API Tests
```javascript
// Browser console testing
await apiService.setApiKey('sk-test-key-12345');
const hasKey = await apiService.getApiKeyStatus();
console.log('API key status:', hasKey);
```

#### Frontend Tests
```javascript
// Test API key input component
const apiKeyInput = screen.getByLabelText('API Key');
fireEvent.change(apiKeyInput, { target: { value: 'sk-test-key' } });
fireEvent.click(screen.getByText('Set API Key'));
expect(screen.getByText('API key set successfully')).toBeInTheDocument();
```

## 📁 Project Management

### Feature Description
Complete project lifecycle management with metadata, artifacts, and persistence.

### Testing Instructions

#### Unit Tests
```bash
# Run project management tests
cargo test test_project_creation test_project_management --bin cedar-app
```

#### CLI Tests
```bash
# Test project creation
./target/debug/cedar-app --cli-test create_project '{"name": "Test Project", "goal": "Test goal"}'

# Test project retrieval
./target/debug/cedar-app --cli-test get_projects
```

#### API Tests
```javascript
// Browser console testing
const project = await apiService.createProject({
  name: 'Test Research Project',
  goal: 'Analyze customer churn patterns'
});
console.log('Created project:', project);

const projects = await apiService.getProjects();
console.log('All projects:', projects);
```

#### Frontend Tests
```javascript
// Test project creation form
fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: 'Test Project' } });
fireEvent.change(screen.getByLabelText('Research Goal'), { target: { value: 'Test goal' } });
fireEvent.click(screen.getByText('Create Project'));
expect(screen.getByText('Project created successfully')).toBeInTheDocument();
```

## 🔬 Research Workflow

### Feature Description
AI-powered research planning and execution with step-by-step guidance.

### Testing Instructions

#### Unit Tests
```bash
# Run research workflow tests
cargo test test_research_workflow test_code_execution --bin cedar-app
```

#### CLI Tests
```bash
# Test research initiation
./target/debug/cedar-app --cli-test start_research '{"project_id": "project-123", "session_id": "session-456", "goal": "Analyze customer churn"}'

# Test code execution
./target/debug/cedar-app --cli-test execute_code '{"code": "print(\"Hello World\")", "session_id": "session-123"}'
```

#### API Tests
```javascript
// Browser console testing
const research = await apiService.startResearch({
  projectId: 'project-123',
  sessionId: 'session-456',
  goal: 'Analyze customer churn patterns'
});
console.log('Research started:', research);

const result = await apiService.executeCode({
  code: 'import pandas as pd\nprint("Hello World")',
  sessionId: 'session-123'
});
console.log('Code executed:', result);
```

#### Frontend Tests
```javascript
// Test research session component
const researchSession = render(<ResearchSession sessionId="test" projectId="test" goal="Test goal" />);
fireEvent.click(screen.getByText('Start Research'));
expect(screen.getByText('Research started successfully')).toBeInTheDocument();
```

## ❓ Question Generation

### Feature Description
AI-generated research questions to guide the research process.

### Testing Instructions

#### Unit Tests
```bash
# Run question generation tests
cargo test test_question_generation test_question_creation --bin cedar-app
```

#### CLI Tests
```bash
# Test question generation
./target/debug/cedar-app --cli-test generate_questions '{"project_id": "project-123", "goal": "Analyze customer churn"}'
```

#### API Tests
```javascript
// Browser console testing
const questions = await apiService.generateQuestions({
  projectId: 'project-123',
  goal: 'Analyze customer churn patterns'
});
console.log('Generated questions:', questions);
```

#### Frontend Tests
```javascript
// Test question display component
const questions = [
  { id: 'q1', question: 'What aspects interest you most?', category: 'initial' }
];
render(<QuestionsTab questions={questions} onAnswerQuestion={jest.fn()} />);
expect(screen.getByText('What aspects interest you most?')).toBeInTheDocument();
```

## 📚 Library Management

### Feature Description
Python library dependency management with auto-detection and installation.

### Testing Instructions

#### Unit Tests
```bash
# Run library management tests
cargo test test_library_creation --bin cedar-app
```

#### CLI Tests
```bash
# Test library installation
./target/debug/cedar-app --cli-test install_library '{"project_id": "project-123", "library_name": "pandas"}'
```

#### API Tests
```javascript
// Browser console testing
await apiService.installLibrary('project-123', 'pandas');
const libraries = await apiService.getLibraries('project-123');
console.log('Installed libraries:', libraries);
```

#### Frontend Tests
```javascript
// Test library management component
render(<LibrariesTab projectId="test" libraries={[]} />);
fireEvent.click(screen.getByText('Add Library'));
fireEvent.change(screen.getByLabelText('Library Name'), { target: { value: 'pandas' } });
fireEvent.click(screen.getByText('Install'));
expect(screen.getByText('Library installed successfully')).toBeInTheDocument();
```

## 📊 Variable Management

### Feature Description
Data variable tracking and management with type inference and relationships.

### Testing Instructions

#### Unit Tests
```bash
# Run variable management tests
cargo test test_variable_info_creation test_variable_info_serialization --bin cedar-app
```

#### CLI Tests
```bash
# Test variable addition (if implemented)
./target/debug/cedar-app --cli-test add_variable '{"project_id": "project-123", "variable": {...}}'
```

#### API Tests
```javascript
// Browser console testing
const variable = {
  name: 'customer_data',
  type_name: 'DataFrame',
  shape: '(1000, 10)',
  purpose: 'Customer transaction data'
};
await apiService.addVariable('project-123', variable);
const variables = await apiService.getVariables('project-123');
console.log('Project variables:', variables);
```

#### Frontend Tests
```javascript
// Test variable display component
const variables = [
  { name: 'customer_data', type_name: 'DataFrame', shape: '(1000, 10)' }
];
render(<VariablesTab projectId="test" variables={variables} />);
expect(screen.getByText('customer_data')).toBeInTheDocument();
expect(screen.getByText('DataFrame')).toBeInTheDocument();
```

## 📖 Reference Management

### Feature Description
Academic reference storage and management with citation metadata.

### Testing Instructions

#### Unit Tests
```bash
# Run reference management tests
cargo test test_reference_creation --bin cedar-app
```

#### CLI Tests
```bash
# Test reference addition (if implemented)
./target/debug/cedar-app --cli-test add_reference '{"project_id": "project-123", "reference": {...}}'
```

#### API Tests
```javascript
// Browser console testing
const reference = {
  id: 'ref-1',
  title: 'Customer Churn Analysis',
  authors: 'Smith, J., & Johnson, A.',
  url: 'https://example.com/paper.pdf',
  content: 'This paper provides...',
  added_at: new Date().toISOString()
};
await apiService.addReference('project-123', reference);
```

#### Frontend Tests
```javascript
// Test reference display component
const references = [
  { id: 'ref-1', title: 'Customer Churn Analysis', authors: 'Smith, J.' }
];
render(<ReferencesTab projectId="test" references={references} />);
expect(screen.getByText('Customer Churn Analysis')).toBeInTheDocument();
```

## 💾 Session Management

### Feature Description
Research session persistence with memory caching and disk storage.

### Testing Instructions

#### Unit Tests
```bash
# Run session management tests
cargo test test_session_management test_session_loading --bin cedar-app
```

#### CLI Tests
```bash
# Test session operations (if implemented)
./target/debug/cedar-app --cli-test save_session '{"session_id": "session-123", "data": {...}}'
./target/debug/cedar-app --cli-test load_session '{"session_id": "session-123"}'
```

#### API Tests
```javascript
// Browser console testing
const sessionData = { cells: [{ type: 'goal', content: 'Test goal' }] };
await apiService.saveSession('session-123', sessionData);
const loaded = await apiService.loadSession('session-123');
console.log('Loaded session:', loaded);
```

#### Frontend Tests
```javascript
// Test session persistence
const session = render(<ResearchSession sessionId="test" projectId="test" goal="Test" />);
// Simulate research activity
fireEvent.click(screen.getByText('Start Research'));
// Verify session is saved
expect(mockApiService.saveSession).toHaveBeenCalled();
```

## 🧪 Comprehensive Testing

### Running All Tests

#### Backend Tests
```bash
# Run all unit tests
cargo test --bin cedar-app

# Run tests with output
cargo test --bin cedar-app -- --nocapture

# Run specific test categories
cargo test test_api_key_management --bin cedar-app
cargo test test_project_management --bin cedar-app
cargo test test_research_workflow --bin cedar-app
```

#### CLI Tests
```bash
# Run all CLI tests
./test-cedar.sh --cli

# Run specific CLI test
./test-cedar.sh --cli-test start_research
```

#### Frontend Tests
```bash
# Run frontend tests (if configured)
cd frontend
npm test

# Run browser console tests
# Open browser console and run test-research.js
```

#### Integration Tests
```bash
# Run complete test suite
./test-cedar.sh --all

# Run API test suite
./test-cedar.sh --api
```

### Test Coverage

#### Backend Coverage
- ✅ API key management
- ✅ Project creation and management
- ✅ Research workflow
- ✅ Code execution
- ✅ Question generation
- ✅ Library management
- ✅ Variable management
- ✅ Reference management
- ✅ Session management
- ✅ Error handling
- ✅ Concurrent access
- ✅ Data consistency

#### Frontend Coverage
- ✅ API service methods
- ✅ Research session component
- ✅ Project management
- ✅ Question handling
- ✅ Library management
- ✅ Variable display
- ✅ Reference management
- ✅ Session persistence

#### CLI Coverage
- ✅ Command parsing
- ✅ JSON argument handling
- ✅ Research workflow commands
- ✅ Error handling
- ✅ Response formatting

### Manual Testing

#### Browser Console Testing
```javascript
// Load test script in browser console
// Copy and paste contents of frontend/test-research.js
// Run testResearchFunctionality() function
```

#### UI Testing
1. Launch Cedar application
2. Set API key in setup screen
3. Create a new research project
4. Submit research goal
5. Answer generated questions
6. Monitor research execution
7. Review results and visualizations
8. Check all tabs and features

### Performance Testing

#### Load Testing
```bash
# Test with multiple concurrent sessions
for i in {1..10}; do
  ./target/debug/cedar-app --cli-test start_research '{"project_id": "project-$i", "session_id": "session-$i", "goal": "Test goal $i"}' &
done
wait
```

#### Memory Testing
```bash
# Monitor memory usage during research
valgrind --tool=massif ./target/debug/cedar-app --cli-test start_research '{"project_id": "test", "session_id": "test", "goal": "Test goal"}'
```

## 🐛 Debugging

### Common Issues

#### API Key Issues
- Verify API key format (starts with 'sk-')
- Check API key permissions
- Ensure key is not expired

#### Research Workflow Issues
- Check if questions are answered
- Verify project and session IDs
- Monitor backend logs for errors

#### Code Execution Issues
- Check Python environment
- Verify library dependencies
- Monitor sandbox permissions

### Debug Commands
```bash
# Enable debug logging
RUST_LOG=debug cargo run --bin cedar-app

# Run with verbose output
./target/debug/cedar-app --cli-test start_research '{"project_id": "test", "session_id": "test", "goal": "Test"}' --verbose

# Check application logs
tail -f logs/cedar_*.log
```

## 📈 Continuous Integration

### Automated Testing
```yaml
# Example CI configuration
name: Cedar Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo test --bin cedar-app
      - run: ./test-cedar.sh --all
```

### Test Reporting
- Unit test results in JUnit format
- Coverage reports with codecov
- Performance benchmarks
- Security scan results

## 📚 Additional Resources

- [Cedar Core Documentation](../cedar-core/README.md)
- [Frontend Testing Guide](../frontend/README.md)
- [CLI Usage Guide](TESTING.md)
- [API Reference](../docs/api.md)

## 🤝 Contributing

When adding new features:

1. Add comprehensive unit tests
2. Update CLI test script
3. Add frontend component tests
4. Update this documentation
5. Verify all tests pass
6. Add performance benchmarks if applicable

For questions or issues, please refer to the main [README.md](../README.md) or create an issue in the repository. 