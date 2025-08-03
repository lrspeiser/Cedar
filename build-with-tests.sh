#!/bin/bash

set -e  # Exit on any error

echo "🚀 Cedar Build Process with Comprehensive Testing"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Step 1: Check if we're in the right directory
print_status "📁 Checking project structure..."
if [ ! -f "Cargo.toml" ] || [ ! -f "src-tauri/Cargo.toml" ]; then
    print_error "❌ Not in Cedar project root directory"
    exit 1
fi
print_success "✅ Project structure verified"

# Step 2: Clean previous builds
print_status "🧹 Cleaning previous builds..."
cargo clean
print_success "✅ Clean completed"

# Step 3: Check Rust toolchain
print_status "🔧 Checking Rust toolchain..."
rustc --version
cargo --version
print_success "✅ Rust toolchain verified"

# Step 4: Run all Rust unit tests
print_status "🧪 Running Rust unit tests..."
cargo test --workspace
if [ $? -eq 0 ]; then
    print_success "✅ All Rust unit tests passed"
else
    print_error "❌ Rust unit tests failed"
    exit 1
fi

# Step 5: Run backend integration tests
print_status "🔬 Running backend integration tests..."
cd Tests
cargo test --bin data_analysis_test
if [ $? -eq 0 ]; then
    print_success "✅ Backend data analysis tests passed"
else
    print_error "❌ Backend data analysis tests failed"
    exit 1
fi

cargo test --bin real_backend_test
if [ $? -eq 0 ]; then
    print_success "✅ Backend real function tests passed"
else
    print_error "❌ Backend real function tests failed"
    exit 1
fi

cargo test --bin comprehensive_backend_test
if [ $? -eq 0 ]; then
    print_success "✅ Backend comprehensive tests passed"
else
    print_error "❌ Backend comprehensive tests failed"
    exit 1
fi
cd ..

# Step 6: Run frontend tests
print_status "🎨 Running frontend tests..."
cd frontend
npm test -- --watchAll=false
if [ $? -eq 0 ]; then
    print_success "✅ Frontend tests passed"
else
    print_error "❌ Frontend tests failed"
    exit 1
fi
cd ..

# Step 7: Check for API key (required for LLM tests)
print_status "🔑 Checking API key configuration..."
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "⚠️  OPENAI_API_KEY not set - LLM functionality will be limited"
    print_warning "   Set OPENAI_API_KEY environment variable for full functionality"
else
    print_success "✅ API key found"
fi

# Step 8: Run LLM integration tests (if API key available)
if [ ! -z "$OPENAI_API_KEY" ]; then
    print_status "🤖 Running LLM integration tests..."
    cd Tests
    cargo run --bin real_backend_test --manifest-path Cargo.toml
    if [ $? -eq 0 ]; then
        print_success "✅ LLM integration tests passed"
    else
        print_error "❌ LLM integration tests failed"
        exit 1
    fi
    cd ..
else
    print_warning "⚠️  Skipping LLM integration tests (no API key)"
fi

# Step 9: Build the application
print_status "🔨 Building Cedar application..."
cargo tauri build
if [ $? -eq 0 ]; then
    print_success "✅ Application built successfully"
else
    print_error "❌ Application build failed"
    exit 1
fi

# Step 10: Final verification
print_status "🔍 Final verification..."
if [ -f "src-tauri/target/release/cedar-app" ]; then
    print_success "✅ Executable created successfully"
else
    print_error "❌ Executable not found"
    exit 1
fi

echo ""
echo "🎉 Cedar Build Process Completed Successfully!"
echo "================================================"
print_success "✅ All tests passed"
print_success "✅ Application built"
print_success "✅ Ready for deployment"
echo ""
echo "📁 Build artifacts:"
echo "   - Executable: src-tauri/target/release/cedar-app"
echo "   - Frontend: frontend/dist/"
echo ""
echo "🚀 To run the application:"
echo "   ./src-tauri/target/release/cedar-app"
echo ""
echo "🔧 To run in development mode:"
echo "   cd src-tauri && cargo tauri dev" 