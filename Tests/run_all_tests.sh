#!/bin/bash

set -e  # Exit on any error

echo "🧪 Running All Cedar Backend Tests"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Change to the Tests directory
cd "$(dirname "$0")"

# Test 1: Data Analysis Test
print_status "📊 Running Data Analysis Test..."
cargo run --bin data_analysis_test
if [ $? -eq 0 ]; then
    print_success "✅ Data Analysis Test passed"
else
    print_error "❌ Data Analysis Test failed"
    exit 1
fi
echo ""

# Test 2: Real Backend Test
print_status "🔬 Running Real Backend Test..."
cargo run --bin real_backend_test
if [ $? -eq 0 ]; then
    print_success "✅ Real Backend Test passed"
else
    print_error "❌ Real Backend Test failed"
    exit 1
fi
echo ""

# Test 3: Comprehensive Backend Test
print_status "🎯 Running Comprehensive Backend Test..."
cargo run --bin comprehensive_backend_test
if [ $? -eq 0 ]; then
    print_success "✅ Comprehensive Backend Test passed"
else
    print_error "❌ Comprehensive Backend Test failed"
    exit 1
fi
echo ""

echo "🎉 All Backend Tests Completed Successfully!"
echo "============================================="
print_success "✅ Data Analysis Test: PASSED"
print_success "✅ Real Backend Test: PASSED"
print_success "✅ Comprehensive Backend Test: PASSED"
echo ""
print_success "🚀 Backend is ready for production!"
echo ""
echo "📝 Test Coverage Summary:"
echo "   - File upload and analysis"
echo "   - Data processing and storage"
echo "   - LLM integration"
echo "   - Project management"
echo "   - Session management"
echo "   - Variable management"
echo "   - Library management"
echo "   - Visualization functions"
echo "   - Analysis cell operations"
echo "   - Research management"
echo "   - Code execution"
echo "   - Write-up generation"
echo "   - Academic paper functions"
echo "   - Question management"
echo "   - Reference management" 