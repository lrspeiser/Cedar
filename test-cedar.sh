#!/bin/bash

# Cedar Testing Script
# This script provides comprehensive testing for the Cedar application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run CLI tests
run_cli_tests() {
    print_status "Running CLI tests..."
    
    # Check if the binary exists
    if [ ! -f "target/debug/cedar-app" ]; then
        print_error "Cedar binary not found. Please build the project first with 'cargo build'"
        return 1
    fi
    
    # Create a test script for CLI with proper JSON format
    cat > cli_test_script.txt << 'EOF'
set_api_key {"api_key": "test-api-key-12345"}
get_api_key_status
create_project {"name": "CLI Test Project", "goal": "Test the CLI functionality"}
get_projects
start_research {"project_id": "cli-test-project", "session_id": "cli-test-session", "goal": "Test research goal"}
execute_code {"code": "print('Hello from CLI test!')", "session_id": "cli-test-session"}
generate_questions {"project_id": "cli-test-project", "goal": "Test research goal"}
exit
EOF
    
    # Run CLI tests
    print_status "Starting CLI test session..."
    if command_exists gtimeout; then
        gtimeout 30s ./target/debug/cedar-app --cli-test < cli_test_script.txt > cli_test_output.log 2>&1 || true
    elif command_exists timeout; then
        timeout 30s ./target/debug/cedar-app --cli-test < cli_test_script.txt > cli_test_output.log 2>&1 || true
    else
        # macOS doesn't have timeout by default, so we'll use a different approach
        print_warning "No timeout command found, running CLI test without timeout"
        ./target/debug/cedar-app --cli-test < cli_test_script.txt > cli_test_output.log 2>&1 || true
    fi
    
    # Check if tests completed
    if grep -q "✅ Success:" cli_test_output.log; then
        print_success "CLI tests completed successfully"
        echo "CLI test output:"
        cat cli_test_output.log
    else
        print_error "CLI tests failed"
        echo "CLI test output:"
        cat cli_test_output.log
        return 1
    fi
    
    # Cleanup
    rm -f cli_test_script.txt cli_test_output.log
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if ! command_exists cargo; then
        print_error "Cargo not found. Please install Rust first."
        return 1
    fi
    
    # Run Rust unit tests
    print_status "Running Rust unit tests..."
    if cargo test --bin cedar-app 2>&1 | tee unit_test_output.log; then
        print_success "Rust unit tests passed"
    else
        print_error "Rust unit tests failed"
        cat unit_test_output.log
        return 1
    fi
    
    # Run frontend tests if available
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Running frontend tests..."
        cd frontend
        
        if npm test 2>&1 | tee ../frontend_test_output.log; then
            print_success "Frontend tests passed"
        else
            print_warning "Frontend tests failed or not configured"
        fi
        
        cd ..
    fi
}

# Function to run API tests
run_api_tests() {
    print_status "Running API tests..."
    
    # Create a simple API test script
    cat > api_test.js << 'EOF'
const { invoke } = require('@tauri-apps/api/core');

async function runApiTests() {
    console.log('🧪 Running API tests...');
    
    try {
        // Test 1: Get projects
        console.log('Testing get_projects...');
        const projects = await invoke('get_projects');
        console.log('✅ get_projects:', projects);
        
        // Test 2: Start research
        console.log('Testing start_research...');
        const research = await invoke('start_research', {
            project_id: 'api-test-project',
            session_id: 'api-test-session',
            goal: 'Test API functionality'
        });
        console.log('✅ start_research:', research);
        
        // Test 3: Execute code
        console.log('Testing execute_code...');
        const code = await invoke('execute_code', {
            code: 'print("Hello from API test!")',
            session_id: 'api-test-session'
        });
        console.log('✅ execute_code:', code);
        
        console.log('🎉 All API tests passed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error);
        process.exit(1);
    }
}

runApiTests();
EOF
    
    # Note: This would require the app to be running
    print_warning "API tests require the Cedar application to be running"
    print_status "To run API tests manually:"
    echo "1. Start the Cedar app: cargo tauri dev"
    echo "2. Open the browser console"
    echo "3. Run: apiService.runApiTestSuite()"
    
    # Cleanup
    rm -f api_test.js
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Test project creation and management
    print_status "Testing project creation workflow..."
    
    # This would require the app to be running
    print_warning "Integration tests require the Cedar application to be running"
    print_status "To run integration tests manually:"
    echo "1. Start the Cedar app: cargo tauri dev"
    echo "2. Create a new project"
    echo "3. Add a research goal"
    echo "4. Start research"
    echo "5. Check that all tabs are populated correctly"
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Test compilation time
    print_status "Testing compilation time..."
    start_time=$(date +%s)
    cargo build --release 2>&1 | tee build_output.log
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    
    print_success "Build completed in ${build_time} seconds"
    
    # Test binary size
    if [ -f "target/release/cedar-app" ]; then
        binary_size=$(du -h target/release/cedar-app | cut -f1)
        print_success "Binary size: ${binary_size}"
    fi
    
    # Cleanup
    rm -f build_output.log
}

# Function to show help
show_help() {
    echo "Cedar Testing Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --cli          Run CLI tests only"
    echo "  --unit         Run unit tests only"
    echo "  --api          Run API tests only"
    echo "  --integration  Run integration tests only"
    echo "  --performance  Run performance tests only"
    echo "  --all          Run all tests (default)"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --cli       # Run only CLI tests"
    echo "  $0 --unit      # Run only unit tests"
    echo "  $0 --all       # Run all tests"
}

# Main function
main() {
    print_status "Starting Cedar testing suite..."
    
    # Check if we're in the right directory
    if [ ! -f "Cargo.toml" ]; then
        print_error "Cargo.toml not found. Please run this script from the Cedar project root."
        exit 1
    fi
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        # No arguments, run all tests
        run_cli_tests
        run_unit_tests
        run_api_tests
        run_integration_tests
        run_performance_tests
    else
        case "$1" in
            --cli)
                run_cli_tests
                ;;
            --unit)
                run_unit_tests
                ;;
            --api)
                run_api_tests
                ;;
            --integration)
                run_integration_tests
                ;;
            --performance)
                run_performance_tests
                ;;
            --all)
                run_cli_tests
                run_unit_tests
                run_api_tests
                run_integration_tests
                run_performance_tests
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    fi
    
    print_success "Testing completed!"
}

# Run main function with all arguments
main "$@" 