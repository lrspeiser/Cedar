# Cedar Testing Guide

This document provides comprehensive testing instructions for the Cedar research application.

## Quick Start

Run all tests:
```bash
./test-cedar.sh --all
```

Run specific test types:
```bash
./test-cedar.sh --cli      # CLI tests only
./test-cedar.sh --unit     # Unit tests only
./test-cedar.sh --api      # API tests only
./test-cedar.sh --integration  # Integration tests only
./test-cedar.sh --performance  # Performance tests only
```

## Test Types

### 1. CLI Tests

Tests the command-line interface functionality using the `--cli-test` mode.

**What it tests:**
- Command parsing and execution
- JSON argument handling
- Research workflow commands
- Error handling

**How to run:**
```bash
./test-cedar.sh --cli
```

**Manual CLI testing:**
```bash
cargo build
./target/debug/cedar-app --cli-test
```

Available commands in CLI mode:
- `set_api_key {"api_key": "test-key"}`
- `get_api_key_status`
- `create_project {"name": "Test", "goal": "Test goal"}`
- `get_projects`
- `start_research {"project_id": "test", "session_id": "test", "goal": "Test goal"}`
- `execute_code {"code": "print('test')", "session_id": "test"}`
- `generate_questions {"project_id": "test", "goal": "Test goal"}`
- `exit`

### 2. Unit Tests

Tests individual components and data structures.

**What it tests:**
- Data structure creation and validation
- Serialization/deserialization
- Request/response handling
- Error conditions

**How to run:**
```bash
./test-cedar.sh --unit
# or
cargo test --bin cedar-app
```

**Key test areas:**
- `StartResearchRequest` - Research request structure
- `ExecuteCodeRequest` - Code execution request structure
- `GenerateQuestionsRequest` - Question generation request structure
- JSON parsing for CLI mode
- Error handling for invalid JSON
- Research workflow integration

### 3. API Tests

Tests the Tauri backend API endpoints.

**What it tests:**
- API endpoint functionality
- Request/response handling
- Error conditions
- Performance metrics

**How to run:**
1. Start the Cedar application:
   ```bash
   cargo tauri dev
   ```
2. Open browser console and run:
   ```javascript
   apiService.runApiTestSuite()
   ```

**Available API endpoints:**
- `start_research` - Start a research session
- `execute_code` - Execute code in a session
- `generate_questions` - Generate research questions
- `create_project` - Create a new project
- `get_projects` - List all projects
- `set_api_key` - Set API key
- `get_api_key_status` - Check API key status

### 4. Frontend Tests

Tests the React frontend components and functionality.

**How to run:**
```bash
cd frontend
npm test
```

**Browser Console Testing:**
Load the test script in the browser console:
```javascript
// Copy and paste the contents of frontend/test-research.js
// or run:
testResearchFunctionality()
```

### 5. Integration Tests

Tests the complete workflow from frontend to backend.

**What it tests:**
- Complete research workflow
- Project creation and management
- Research session lifecycle
- Data persistence

**How to run manually:**
1. Start the Cedar app: `cargo tauri dev`
2. Create a new project
3. Add a research goal
4. Start research
5. Check that all tabs are populated correctly

### 6. Performance Tests

Tests build time and binary size.

**What it tests:**
- Compilation time
- Binary size
- Build optimization

**How to run:**
```bash
./test-cedar.sh --performance
```

## Research Functionality Testing

### Core Research Commands

The following commands are essential for research functionality:

1. **Start Research**
   ```javascript
   await apiService.startResearch({
       projectId: "project-123",
       sessionId: "session-456", 
       goal: "Research goal"
   });
   ```

2. **Execute Code**
   ```javascript
   await apiService.executeCode({
       code: "print('Hello, World!')",
       sessionId: "session-456"
   });
   ```

3. **Generate Questions**
   ```javascript
   await apiService.generateQuestions({
       projectId: "project-123",
       goal: "Research goal"
   });
   ```

### Expected Responses

**Start Research Response:**
```json
{
  "status": "started",
  "session_id": "session-456",
  "message": "Research started successfully",
  "next_step": "Generate initial questions"
}
```

**Execute Code Response:**
```json
{
  "status": "executed",
  "session_id": "session-456",
  "output": "Code execution completed (placeholder)",
  "success": true
}
```

**Generate Questions Response:**
```json
{
  "status": "generated",
  "project_id": "project-123",
  "questions": [
    {
      "id": "q1",
      "question": "What specific aspects of this research are you most interested in?",
      "category": "initial",
      "status": "pending"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **"command start_research missing required key request"**
   - **Cause**: Incorrect JSON format in CLI arguments
   - **Solution**: Ensure arguments are passed as JSON objects, not individual parameters

2. **"Failed to parse start_research args"**
   - **Cause**: Invalid JSON structure
   - **Solution**: Check that all required fields are present and properly formatted

3. **"API key not found"**
   - **Cause**: API key not set
   - **Solution**: Set API key using `set_api_key` command

### Debug Mode

Enable debug logging:
```bash
RUST_LOG=debug cargo tauri dev
```

### Manual Testing

For manual testing of research functionality:

1. **CLI Mode:**
   ```bash
   ./target/debug/cedar-app --cli-test
   ```

2. **Browser Console:**
   ```javascript
   // Load test script
   fetch('/test-research.js').then(r => r.text()).then(eval);
   
   // Run tests
   testResearchFunctionality();
   ```

3. **API Testing:**
   ```javascript
   // Test individual endpoints
   apiService.startResearch({...});
   apiService.executeCode({...});
   apiService.generateQuestions({...});
   ```

## Test Data

Test projects and sessions are automatically created during testing. They are stored in:
- Projects: `~/.local/share/cedar/projects/`
- Sessions: `~/.local/share/cedar/sessions/`

## Continuous Integration

The test suite is designed to run in CI environments:
- All tests are non-interactive
- CLI tests have timeout protection
- Unit tests are fast and reliable
- Performance tests provide metrics

## Contributing

When adding new research functionality:

1. Add unit tests for new data structures
2. Add CLI test commands if applicable
3. Add API test endpoints
4. Update this documentation
5. Ensure all tests pass before submitting

## Test Coverage

Current test coverage includes:
- ✅ Research request structures
- ✅ Code execution requests
- ✅ Question generation
- ✅ Project management
- ✅ API key handling
- ✅ JSON serialization/deserialization
- ✅ Error handling
- ✅ CLI command parsing
- ✅ Integration workflows 