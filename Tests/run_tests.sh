#!/bin/bash

echo "🧪 Running Cedar Backend Tests"
echo "================================"

# Change to the Tests directory
cd "$(dirname "$0")"

# Run the data analysis test
echo "📊 Running Data Analysis Test..."
cargo run --bin data_analysis_test

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo "================================"
    echo "📝 Test Summary:"
    echo "   - File upload and analysis: ✅"
    echo "   - Pasted content analysis: ✅"
    echo "   - Analysis cell operations: ✅"
    echo ""
    echo "🔧 Backend functionality verified:"
    echo "   - CSV, JSON, TSV file formats supported"
    echo "   - Content type detection working"
    echo "   - Rust analysis pipeline functional"
    echo "   - LLM analysis simulation working"
    echo "   - Analysis cell management operational"
    echo ""
    echo "🚀 Ready to integrate with frontend!"
else
    echo ""
    echo "❌ Some tests failed!"
    echo "================================"
    echo "Please check the error messages above and fix the issues."
    exit 1
fi 