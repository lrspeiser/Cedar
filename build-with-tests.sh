#!/bin/bash

# Cedar Build Script with Comprehensive Unit Testing
# This script runs unit tests for every function before building and starting the program

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_test_header() {
    echo -e "${PURPLE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_test_result() {
    if [ $1 -eq 0 ]; then
        print_success "$2"
    else
        print_error "$2"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        print_warning "Port $1 is in use. Killing process..."
        lsof -ti :$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to test API key management
test_api_key_functions() {
    print_test_header "Testing API Key Management Functions"
    
    # Test set_api_key
    print_status "Testing set_api_key..."
    if cargo test --bin cedar-app -- test_set_api_key 2>/dev/null; then
        print_success "set_api_key function test passed"
    else
        print_error "set_api_key function test failed"
    fi
    
    # Test get_api_key_status
    print_status "Testing get_api_key_status..."
    if cargo test --bin cedar-app -- test_get_api_key_status 2>/dev/null; then
        print_success "get_api_key_status function test passed"
    else
        print_error "get_api_key_status function test failed"
    fi
}

# Function to test project management
test_project_functions() {
    print_test_header "Testing Project Management Functions"
    
    # Test create_project
    print_status "Testing create_project..."
    if cargo test --bin cedar-app -- test_create_project 2>/dev/null; then
        print_success "create_project function test passed"
    else
        print_error "create_project function test failed"
    fi
    
    # Test get_projects
    print_status "Testing get_projects..."
    if cargo test --bin cedar-app -- test_get_projects 2>/dev/null; then
        print_success "get_projects function test passed"
    else
        print_error "get_projects function test failed"
    fi
    
    # Test update_project
    print_status "Testing update_project..."
    if cargo test --bin cedar-app -- test_update_project 2>/dev/null; then
        print_success "update_project function test passed"
    else
        print_error "update_project function test failed"
    fi
    
    # Test delete_project
    print_status "Testing delete_project..."
    if cargo test --bin cedar-app -- test_delete_project 2>/dev/null; then
        print_success "delete_project function test passed"
    else
        print_error "delete_project function test failed"
    fi
}

# Function to test research functions
test_research_functions() {
    print_test_header "Testing Research Functions"
    
    # Test initialize_research
    print_status "Testing initialize_research..."
    if cargo test --bin cedar-app -- test_initialize_research 2>/dev/null; then
        print_success "initialize_research function test passed"
    else
        print_error "initialize_research function test failed"
    fi
    
    # Test generate_title
    print_status "Testing generate_title..."
    if cargo test --bin cedar-app -- test_generate_title 2>/dev/null; then
        print_success "generate_title function test passed"
    else
        print_error "generate_title function test failed"
    fi
    
    # Test generate_research_plan
    print_status "Testing generate_research_plan..."
    if cargo test --bin cedar-app -- test_generate_research_plan 2>/dev/null; then
        print_success "generate_research_plan function test passed"
    else
        print_error "generate_research_plan function test failed"
    fi
    
    # Test start_research
    print_status "Testing start_research..."
    if cargo test --bin cedar-app -- test_start_research 2>/dev/null; then
        print_success "start_research function test passed"
    else
        print_error "start_research function test failed"
    fi
}

# Function to test code execution
test_code_execution_functions() {
    print_test_header "Testing Code Execution Functions"
    
    # Test execute_code
    print_status "Testing execute_code..."
    if cargo test --bin cedar-app -- test_execute_code 2>/dev/null; then
        print_success "execute_code function test passed"
    else
        print_error "execute_code function test failed"
    fi
    
    # Test execute_step
    print_status "Testing execute_step..."
    if cargo test --bin cedar-app -- test_execute_step 2>/dev/null; then
        print_success "execute_step function test passed"
    else
        print_error "execute_step function test failed"
    fi
}

# Function to test data management
test_data_functions() {
    print_test_header "Testing Data Management Functions"
    
    # Test save_file
    print_status "Testing save_file..."
    if cargo test --bin cedar-app -- test_save_file 2>/dev/null; then
        print_success "save_file function test passed"
    else
        print_error "save_file function test failed"
    fi
    
    # Test upload_data_file
    print_status "Testing upload_data_file..."
    if cargo test --bin cedar-app -- test_upload_data_file 2>/dev/null; then
        print_success "upload_data_file function test passed"
    else
        print_error "upload_data_file function test failed"
    fi
    
    # Test analyze_data_file
    print_status "Testing analyze_data_file..."
    if cargo test --bin cedar-app -- test_analyze_data_file 2>/dev/null; then
        print_success "analyze_data_file function test passed"
    else
        print_error "analyze_data_file function test failed"
    fi
}

# Function to test session management
test_session_functions() {
    print_test_header "Testing Session Management Functions"
    
    # Test save_session
    print_status "Testing save_session..."
    if cargo test --bin cedar-app -- test_save_session 2>/dev/null; then
        print_success "save_session function test passed"
    else
        print_error "save_session function test failed"
    fi
    
    # Test load_session
    print_status "Testing load_session..."
    if cargo test --bin cedar-app -- test_load_session 2>/dev/null; then
        print_success "load_session function test passed"
    else
        print_error "load_session function test failed"
    fi
    
    # Test update_session
    print_status "Testing update_session..."
    if cargo test --bin cedar-app -- test_update_session 2>/dev/null; then
        print_success "update_session function test passed"
    else
        print_error "update_session function test failed"
    fi
}

# Function to test variable management
test_variable_functions() {
    print_test_header "Testing Variable Management Functions"
    
    # Test add_variable
    print_status "Testing add_variable..."
    if cargo test --bin cedar-app -- test_add_variable 2>/dev/null; then
        print_success "add_variable function test passed"
    else
        print_error "add_variable function test failed"
    fi
    
    # Test get_variables
    print_status "Testing get_variables..."
    if cargo test --bin cedar-app -- test_get_variables 2>/dev/null; then
        print_success "get_variables function test passed"
    else
        print_error "get_variables function test failed"
    fi
    
    # Test update_variable
    print_status "Testing update_variable..."
    if cargo test --bin cedar-app -- test_update_variable 2>/dev/null; then
        print_success "update_variable function test passed"
    else
        print_error "update_variable function test failed"
    fi
}

# Function to test library management
test_library_functions() {
    print_test_header "Testing Library Management Functions"
    
    # Test add_library
    print_status "Testing add_library..."
    if cargo test --bin cedar-app -- test_add_library 2>/dev/null; then
        print_success "add_library function test passed"
    else
        print_error "add_library function test failed"
    fi
    
    # Test get_libraries
    print_status "Testing get_libraries..."
    if cargo test --bin cedar-app -- test_get_libraries 2>/dev/null; then
        print_success "get_libraries function test passed"
    else
        print_error "get_libraries function test failed"
    fi
    
    # Test install_library
    print_status "Testing install_library..."
    if cargo test --bin cedar-app -- test_install_library 2>/dev/null; then
        print_success "install_library function test passed"
    else
        print_error "install_library function test failed"
    fi
}

# Function to test visualization functions
test_visualization_functions() {
    print_test_header "Testing Visualization Functions"
    
    # Test create_visualization
    print_status "Testing create_visualization..."
    if cargo test --bin cedar-app -- test_create_visualization 2>/dev/null; then
        print_success "create_visualization function test passed"
    else
        print_error "create_visualization function test failed"
    fi
    
    # Test generate_visualization
    print_status "Testing generate_visualization..."
    if cargo test --bin cedar-app -- test_generate_visualization 2>/dev/null; then
        print_success "generate_visualization function test passed"
    else
        print_error "generate_visualization function test failed"
    fi
}

# Function to test LLM functions
test_llm_functions() {
    print_test_header "Testing LLM Functions"
    
    # Test ask_llm (GPT-4o)
    print_status "Testing ask_llm (GPT-4o)..."
    if cargo test --bin cedar-app -- test_ask_llm 2>/dev/null; then
        print_success "ask_llm function test passed"
    else
        print_error "ask_llm function test failed"
    fi
    
    # Test ask_llm_for_title (GPT-4.1 nano)
    print_status "Testing ask_llm_for_title (GPT-4.1 nano)..."
    if cargo test --bin cedar-app -- test_ask_llm_for_title 2>/dev/null; then
        print_success "ask_llm_for_title function test passed"
    else
        print_error "ask_llm_for_title function test failed"
    fi
}

# Function to test write-up generation
test_writeup_functions() {
    print_test_header "Testing Write-up Generation Functions"
    
    # Test generate_final_write_up
    print_status "Testing generate_final_write_up..."
    if cargo test --bin cedar-app -- test_generate_final_write_up 2>/dev/null; then
        print_success "generate_final_write_up function test passed"
    else
        print_error "generate_final_write_up function test failed"
    fi
}

# Function to run all unit tests
run_all_unit_tests() {
  print_status "Starting comprehensive unit testing..."
  
  # Check if Unit Tests directory exists
  if [ ! -d "Unit Tests" ]; then
    print_error "Unit Tests directory not found. Please ensure test files are organized in the Unit Tests folder."
    return 1
  fi
  
  # Run the comprehensive test runner
  print_status "Running comprehensive test suite from Unit Tests folder..."
  
  if node "Unit Tests/run-all-tests.js"; then
    print_success "All unit tests passed! Proceeding with build..."
    return 0
  else
    print_error "Some unit tests failed. Please fix the issues before building."
    return 1
  fi
}

# Function to build the project
build_project() {
    print_status "Building Cedar project..."
    
    # Clean previous build
    print_status "Cleaning previous build..."
    cargo clean
    
    # Build the project
    print_status "Building with cargo..."
    if cargo build --release; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to start the application
start_application() {
    print_status "Starting Cedar application..."
    
    # Kill any existing processes on required ports
    kill_port 3000  # Frontend port
    kill_port 1420  # Tauri port
    
    # Start the application
    print_status "Starting with cargo tauri dev..."
    cargo tauri dev
}

# Function to show help
show_help() {
    echo "Cedar Build Script with Comprehensive Unit Testing"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --tests-only    Run unit tests only, don't build or start"
    echo "  --build-only    Build only, don't run tests or start"
    echo "  --start-only    Start only, don't run tests or build"
    echo "  --full          Run tests, build, and start (default)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --tests-only  # Run all unit tests"
    echo "  $0 --build-only  # Build the project"
    echo "  $0 --full        # Run tests, build, and start"
}

# Main function
main() {
    print_status "Starting Cedar build process with comprehensive testing..."
    
    # Check if we're in the right directory
    if [ ! -f "Cargo.toml" ]; then
        print_error "Cargo.toml not found. Please run this script from the Cedar project root."
        exit 1
    fi
    
    # Check if cargo is available
    if ! command_exists cargo; then
        print_error "Cargo not found. Please install Rust first."
        exit 1
    fi
    
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        # No arguments, run full process
        MODE="full"
    else
        case "$1" in
            --tests-only)
                MODE="tests"
                ;;
            --build-only)
                MODE="build"
                ;;
            --start-only)
                MODE="start"
                ;;
            --full)
                MODE="full"
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
    
    # Execute based on mode
    case "$MODE" in
        "tests")
            run_all_unit_tests
            ;;
        "build")
            build_project
            ;;
        "start")
            start_application
            ;;
        "full")
            run_all_unit_tests
            if [ $? -eq 0 ]; then
                build_project
                start_application
            else
                print_error "Unit tests failed. Aborting build and start."
                exit 1
            fi
            ;;
    esac
    
    print_success "Build process completed!"
}

# Run main function with all arguments
main "$@" 