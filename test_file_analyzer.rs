use std::fs::write;
use std::path::Path;
use tempfile::NamedTempFile;
use cedar_core::file_analyzer::FileAnalyzer;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing File Analyzer - Comprehensive Test Suite\n");

    // Test 1: CSV file with headers
    println!("=== Test 1: CSV File with Headers ===");
    test_csv_with_headers()?;

    // Test 2: TSV file with headers
    println!("\n=== Test 2: TSV File with Headers ===");
    test_tsv_with_headers()?;

    // Test 3: CSV file without headers
    println!("\n=== Test 3: CSV File without Headers ===");
    test_csv_without_headers()?;

    // Test 4: Mixed data types
    println!("\n=== Test 4: Mixed Data Types ===");
    test_mixed_data_types()?;

    // Test 5: Missing/corrupt data
    println!("\n=== Test 5: Missing/Corrupt Data ===");
    test_missing_corrupt_data()?;

    // Test 6: Large numeric dataset
    println!("\n=== Test 6: Large Numeric Dataset ===");
    test_large_numeric_dataset()?;

    println!("\n✅ All tests completed successfully!");
    Ok(())
}

fn test_csv_with_headers() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let csv_content = r#"Name,Age,City,Salary
John Doe,25,New York,50000
Jane Smith,30,Los Angeles,60000
Bob Johnson,35,Chicago,55000
Alice Brown,28,Boston,52000
Charlie Wilson,42,Seattle,70000"#;
    
    write(&temp_file, csv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ CSV with headers test passed");
    println!("   File: {}", metadata.file_name);
    println!("   Type: {}", metadata.file_type);
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    println!("   Has headers: {}", metadata.has_headers);
    
    // Verify column analysis
    for column in &metadata.columns {
        println!("   Column '{}': {} (nulls: {}/{})", 
            column.name, column.data_type, column.null_count, column.total_count);
        if let Some(min) = &column.min_value {
            println!("     Min: {}, Max: {}, Median: {}", 
                min, column.max_value.as_ref().unwrap_or(&"N/A".to_string()), 
                column.median_value.as_ref().unwrap_or(&"N/A".to_string()));
        }
    }
    
    Ok(())
}

fn test_tsv_with_headers() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let tsv_content = r#"Product	Category	Price	Stock
Laptop	Electronics	999.99	50
Mouse	Electronics	25.50	200
Desk	Furniture	299.99	15
Chair	Furniture	150.00	30"#;
    
    write(&temp_file, tsv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ TSV with headers test passed");
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    
    Ok(())
}

fn test_csv_without_headers() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let csv_content = r#"Apple,Red,0.50,100
Banana,Yellow,0.30,150
Orange,Orange,0.75,80
Grape,Purple,0.25,200"#;
    
    write(&temp_file, csv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ CSV without headers test passed");
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    println!("   Has headers: {}", metadata.has_headers);
    
    // Should have auto-generated column names
    for column in &metadata.columns {
        println!("   Column '{}': {}", column.name, column.data_type);
    }
    
    Ok(())
}

fn test_mixed_data_types() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let csv_content = r#"ID,Name,Score,Grade,Active
1,Alice,95.5,A,true
2,Bob,87.2,B,false
3,Charlie,92.0,A,true
4,Diana,78.9,C,true
5,Eve,invalid_score,F,false"#;
    
    write(&temp_file, csv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ Mixed data types test passed");
    println!("   Records: {}", metadata.total_records);
    
    for column in &metadata.columns {
        println!("   Column '{}': {} (nulls: {}/{})", 
            column.name, column.data_type, column.null_count, column.total_count);
        if column.data_type == "mixed" {
            println!("     Sample values: {:?}", column.sample_values);
        }
    }
    
    Ok(())
}

fn test_missing_corrupt_data() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let csv_content = r#"Name,Age,City,Salary
John,25,New York,50000
Jane,,Los Angeles,60000
Bob,35,,55000
Alice,28,Boston,
Charlie,42,Seattle,70000
,30,Chicago,45000
David,25,NaN,52000"#;
    
    write(&temp_file, csv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ Missing/corrupt data test passed");
    println!("   Records: {}", metadata.total_records);
    
    for column in &metadata.columns {
        println!("   Column '{}': {} (nulls: {}/{})", 
            column.name, column.data_type, column.null_count, column.total_count);
        if column.null_count > 0 {
            println!("     Null percentage: {:.1}%", 
                (column.null_count as f64 / column.total_count as f64) * 100.0);
        }
    }
    
    Ok(())
}

fn test_large_numeric_dataset() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let mut csv_content = String::from("ID,Value1,Value2,Value3\n");
    
    // Generate 100 rows of numeric data
    for i in 1..=100 {
        let value1 = (i * 10) as f64;
        let value2 = (i * 2.5) as f64;
        let value3 = (i * 0.1) as f64;
        csv_content.push_str(&format!("{},{:.2},{:.2},{:.2}\n", i, value1, value2, value3));
    }
    
    write(&temp_file, csv_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ Large numeric dataset test passed");
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    
    for column in &metadata.columns {
        if column.data_type == "numeric" {
            println!("   Column '{}': numeric", column.name);
            println!("     Min: {}, Max: {}, Median: {}", 
                column.min_value.as_ref().unwrap_or(&"N/A".to_string()),
                column.max_value.as_ref().unwrap_or(&"N/A".to_string()),
                column.median_value.as_ref().unwrap_or(&"N/A".to_string()));
        }
    }
    
    Ok(())
} 