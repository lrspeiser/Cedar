use std::fs::write;
use std::process::Command;
use tempfile::NamedTempFile;
use cedar::file_analyzer::FileAnalyzer;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🧪 Testing File Analyzer - All File Types\n");

    // Test 1: CSV file
    println!("=== Test 1: CSV File ===");
    test_csv_file()?;

    // Test 2: TSV file
    println!("\n=== Test 2: TSV File ===");
    test_tsv_file()?;

    // Test 3: Excel file (if Python is available)
    println!("\n=== Test 3: Excel File ===");
    test_excel_file()?;

    // Test 4: JSON file
    println!("\n=== Test 4: JSON File ===");
    test_json_file()?;

    // Test 5: Unknown delimiter file
    println!("\n=== Test 5: Unknown Delimiter File ===");
    test_unknown_delimiter_file()?;

    println!("\n✅ All file type tests completed!");
    Ok(())
}

fn test_csv_file() -> Result<(), Box<dyn std::error::Error>> {
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
    
    println!("✅ CSV file test passed");
    println!("   File: {}", metadata.file_name);
    println!("   Type: {}", metadata.file_type);
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    println!("   Delimiter: {:?}", metadata.delimiter);
    
    // Print first 5 rows
    println!("   First 5 rows:");
    for (i, row) in metadata.first_5_rows.iter().enumerate() {
        println!("     Row {}: {:?}", i + 1, row);
    }
    
    // Print column metadata
    for column in &metadata.columns {
        println!("   Column '{}':", column.name);
        println!("     Type: {}", column.data_type);
        println!("     Nulls: {}/{}", column.null_count, column.total_count);
        if let Some(min) = &column.min_value {
            println!("     Min: {}, Max: {}, Median: {}", 
                min, column.max_value.as_ref().unwrap_or(&"N/A".to_string()), 
                column.median_value.as_ref().unwrap_or(&"N/A".to_string()));
        }
        println!("     Sample values: {:?}", column.sample_values);
    }
    
    Ok(())
}

fn test_tsv_file() -> Result<(), Box<dyn std::error::Error>> {
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
    
    println!("✅ TSV file test passed");
    println!("   File: {}", metadata.file_name);
    println!("   Type: {}", metadata.file_type);
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    println!("   Delimiter: {:?}", metadata.delimiter);
    
    Ok(())
}

fn test_excel_file() -> Result<(), Box<dyn std::error::Error>> {
    // First, create a test Excel file using Python
    let python_script = r#"
import pandas as pd
import sys

# Create test data
data = {
    'Name': ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
    'Age': [25, 30, 35, 28, 42],
    'City': ['New York', 'Los Angeles', 'Chicago', 'Boston', 'Seattle'],
    'Salary': [50000, 60000, 55000, 52000, 70000],
    'Department': ['Engineering', 'Marketing', 'Sales', 'HR', 'Engineering']
}

# Create DataFrame and save as Excel
df = pd.DataFrame(data)
df.to_excel('test_excel.xlsx', index=False)
print("Excel file created successfully")
"#;

    let output = Command::new("python3")
        .arg("-c")
        .arg(python_script)
        .output();

    match output {
        Ok(_) => {
            // Test the Excel file
            let result = FileAnalyzer::analyze_file("test_excel.xlsx")?;
            
            if result.success {
                let metadata = result.metadata.unwrap();
                println!("✅ Excel file test passed");
                println!("   File: {}", metadata.file_name);
                println!("   Type: {}", metadata.file_type);
                println!("   Records: {}", metadata.total_records);
                println!("   Columns: {}", metadata.column_count);
                
                // Print column metadata
                for column in &metadata.columns {
                    println!("   Column '{}': {} (nulls: {}/{})", 
                        column.name, column.data_type, column.null_count, column.total_count);
                }
            } else {
                println!("❌ Excel file test failed: {:?}", result.error);
            }
        }
        Err(_) => {
            println!("⚠️  Python not available, skipping Excel test");
        }
    }
    
    Ok(())
}

fn test_json_file() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let json_content = r#"[
{"name": "John Doe", "age": 25, "city": "New York", "salary": 50000},
{"name": "Jane Smith", "age": 30, "city": "Los Angeles", "salary": 60000},
{"name": "Bob Johnson", "age": 35, "city": "Chicago", "salary": 55000},
{"name": "Alice Brown", "age": 28, "city": "Boston", "salary": 52000},
{"name": "Charlie Wilson", "age": 42, "city": "Seattle", "salary": 70000}
]"#;
    
    write(&temp_file, json_content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ JSON file test passed");
    println!("   File: {}", metadata.file_name);
    println!("   Type: {}", metadata.file_type);
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    
    Ok(())
}

fn test_unknown_delimiter_file() -> Result<(), Box<dyn std::error::Error>> {
    let temp_file = NamedTempFile::new()?;
    let content = r#"Name;Age;City;Salary
John Doe;25;New York;50000
Jane Smith;30;Los Angeles;60000
Bob Johnson;35;Chicago;55000"#;
    
    write(&temp_file, content)?;
    
    let result = FileAnalyzer::analyze_file(temp_file.path().to_str().unwrap())?;
    
    assert!(result.success);
    let metadata = result.metadata.unwrap();
    
    println!("✅ Unknown delimiter file test passed");
    println!("   File: {}", metadata.file_name);
    println!("   Type: {}", metadata.file_type);
    println!("   Records: {}", metadata.total_records);
    println!("   Columns: {}", metadata.column_count);
    println!("   Detected delimiter: {:?}", metadata.delimiter);
    
    Ok(())
} 