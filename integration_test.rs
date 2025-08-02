use cedar::file_analyzer::{FileAnalyzer, FileAnalysisResult, FileMetadata};
use std::fs::write;
use tempfile::NamedTempFile;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 File Analyzer Integration Test\n");

    // Create a test file with various data types and issues
    let test_file = create_test_file()?;
    let file_path = test_file.path().to_str().unwrap();

    println!("📁 Test file created: {}", file_path);
    println!("📊 File contents:");
    let content = std::fs::read_to_string(file_path)?;
    for (i, line) in content.lines().enumerate() {
        println!("   {}: {}", i + 1, line);
    }
    println!();

    // Step 1: Analyze the file
    println!("🔍 Step 1: Analyzing file...");
    let analysis_result = FileAnalyzer::analyze_file(file_path)?;
    
    if !analysis_result.success {
        println!("❌ File analysis failed: {:?}", analysis_result.error);
        return Ok(());
    }

    let metadata = analysis_result.metadata.unwrap();
    
    // Step 2: Display comprehensive metadata
    println!("📋 Step 2: File Metadata Summary");
    display_metadata_summary(&metadata);

    // Step 3: Display detailed column analysis
    println!("\n📊 Step 3: Detailed Column Analysis");
    display_column_analysis(&metadata);

    // Step 4: Display first 5 rows
    println!("\n📄 Step 4: First 5 Rows");
    display_first_5_rows(&metadata);

    // Step 5: Generate parquet conversion recommendations
    println!("\n💾 Step 5: Parquet Conversion Recommendations");
    generate_parquet_recommendations(&metadata);

    println!("\n✅ Integration test completed successfully!");
    Ok(())
}

fn create_test_file() -> Result<NamedTempFile, Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let csv_content = r#"ID,Name,Age,City,Salary,Department,StartDate,Active,Rating,Notes
1,John Doe,25,New York,50000,Engineering,2023-01-15,true,4.5,Good performer
2,Jane Smith,30,Los Angeles,60000,Marketing,2022-11-20,true,4.8,Excellent communication
3,Bob Johnson,35,Chicago,55000,Sales,2023-03-10,false,3.9,Needs improvement
4,Alice Brown,28,Boston,52000,HR,2023-02-01,true,4.2,Team player
5,Charlie Wilson,42,Seattle,70000,Engineering,2021-08-15,true,4.7,Senior developer
6,David Lee,,San Francisco,65000,Engineering,2023-04-05,true,4.1,New hire
7,Eva Garcia,29,Miami,48000,Marketing,2023-01-30,false,3.5,Resigned
8,Frank Miller,31,Denver,58000,Sales,2022-12-15,true,4.3,Top performer
9,Grace Taylor,26,Austin,51000,HR,2023-05-01,true,4.0,Recent graduate
10,Henry Adams,38,Portland,62000,Engineering,2022-09-10,true,4.6,Experienced"#;
    
    write(&temp_file, csv_content)?;
    Ok(temp_file)
}

fn display_metadata_summary(metadata: &FileMetadata) {
    println!("   📁 File Information:");
    println!("      Name: {}", metadata.file_name);
    println!("      Type: {}", metadata.file_type);
    println!("      Size: {} bytes", metadata.file_size);
    println!("      Records: {}", metadata.total_records);
    println!("      Columns: {}", metadata.column_count);
    println!("      Has Headers: {}", metadata.has_headers);
    println!("      Delimiter: {:?}", metadata.delimiter);
    println!("   📝 Summary: {}", metadata.summary);
}

fn display_column_analysis(metadata: &FileMetadata) {
    for column in &metadata.columns {
        println!("   🔍 Column: '{}'", column.name);
        println!("      Type: {}", column.data_type);
        println!("      Total Values: {}", column.total_count);
        println!("      Null Values: {} ({:.1}%)", 
            column.null_count, 
            (column.null_count as f64 / column.total_count as f64) * 100.0);
        
        if let Some(min) = &column.min_value {
            println!("      Min: {}, Max: {}, Median: {}", 
                min, 
                column.max_value.as_ref().unwrap_or(&"N/A".to_string()),
                column.median_value.as_ref().unwrap_or(&"N/A".to_string()));
        }
        
        println!("      Sample Values: {:?}", column.sample_values);
        println!();
    }
}

fn display_first_5_rows(metadata: &FileMetadata) {
    for (i, row) in metadata.first_5_rows.iter().enumerate() {
        println!("   Row {}: {:?}", i + 1, row);
    }
}

fn generate_parquet_recommendations(metadata: &FileMetadata) {
    println!("   🎯 Data Quality Assessment:");
    
    let mut total_nulls = 0;
    let mut mixed_type_columns = 0;
    let mut numeric_columns = 0;
    let mut text_columns = 0;
    
    for column in &metadata.columns {
        total_nulls += column.null_count;
        match column.data_type.as_str() {
            "numeric" => numeric_columns += 1,
            "text" => text_columns += 1,
            "mixed" => mixed_type_columns += 1,
            _ => {}
        }
    }
    
    let total_cells = metadata.total_records * metadata.column_count;
    let null_percentage = (total_nulls as f64 / total_cells as f64) * 100.0;
    
    println!("      Total null values: {} ({:.1}%)", total_nulls, null_percentage);
    println!("      Numeric columns: {}", numeric_columns);
    println!("      Text columns: {}", text_columns);
    println!("      Mixed type columns: {}", mixed_type_columns);
    
    println!("   💡 Parquet Conversion Recommendations:");
    
    if null_percentage > 10.0 {
        println!("      ⚠️  High null percentage detected. Consider data cleaning before conversion.");
    }
    
    if mixed_type_columns > 0 {
        println!("      ⚠️  Mixed type columns detected. Review data types for consistency.");
    }
    
    println!("      ✅ Use snappy compression for optimal performance");
    println!("      ✅ Set appropriate data types based on column analysis");
    println!("      ✅ Handle null values appropriately");
    
    // Generate Python conversion code
    println!("   🐍 Recommended Python Conversion Code:");
    println!("   ```python");
    println!("   import pandas as pd");
    println!("   import pyarrow as pa");
    println!("   import pyarrow.parquet as pq");
    println!();
    println!("   # Read the file");
    println!("   df = pd.read_csv('{}', delimiter='{:?}')", metadata.file_name, metadata.delimiter);
    println!();
    println!("   # Data type conversions based on analysis:");
    for column in &metadata.columns {
        match column.data_type.as_str() {
            "numeric" => println!("   df['{}'] = pd.to_numeric(df['{}'], errors='coerce')", column.name, column.name),
            "text" => println!("   df['{}'] = df['{}'].astype(str)", column.name, column.name),
            "mixed" => println!("   # Review column '{}' - mixed data types detected", column.name),
            _ => {}
        }
    }
    println!();
    println!("   # Convert to parquet");
    println!("   df.to_parquet('{}.parquet', index=False, compression='snappy')", 
        metadata.file_name.replace(".csv", ""));
    println!("   print(f'Converted {{len(df)}} rows and {{len(df.columns)}} columns to parquet')");
    println!("   ```");
} 