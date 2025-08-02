# Excel File Upload and Parsing Implementation

## Overview

This document describes the implementation of Excel file upload and parsing functionality in Cedar. The system now properly handles `.xlsx` and `.xls` files, extracts their content, and provides intelligent analysis for conversion to parquet format.

## Problem Solved

Previously, when users uploaded Excel files, the system would show:
- **Estimated Rows:** 0
- **Estimated Columns:** 0
- **Data Structure:** No field information available

This was because the `readExcelFile` function was just a placeholder that didn't actually parse Excel files.

**Additional Issue Fixed**: The LLM was incorrectly interpreting multi-column Excel data as a single column with comma-separated values. This was resolved by improving the sample data format to be more explicit about column structure.

## Solution Implemented

### 1. Dependencies Added

```bash
npm install xlsx @types/xlsx --legacy-peer-deps
```

- **xlsx**: SheetJS library for Excel file parsing
- **@types/xlsx**: TypeScript type definitions

### 2. Enhanced Excel File Parser

The `readExcelFile` function in `frontend/src/components/DataTab.tsx` now:

```typescript
const readExcelFile = async (file: File) => {
  try {
    // Import xlsx library dynamically
    const XLSX = await import('xlsx');
    
    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Extract headers and data
    const headers = jsonData[0]?.map((cell: any) => 
      cell ? String(cell).trim() : `Column_${jsonData[0].indexOf(cell) + 1}`
    ) || [];
    
    // Extract data rows (skip header row)
    const dataRows = jsonData.slice(1).filter(row => 
      row && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
    );
    
    // Get first 10 rows for analysis
    const first10Rows = dataRows.slice(0, 10);
    
    return {
      sampleData: formattedSampleData,
      structure: `Excel file with ${headers.length} columns: ${headers.join(', ')}`,
      headers,
      rows: first10Rows,
      totalRows: dataRows.length,
      sheetName: firstSheetName,
      allSheets: workbook.SheetNames
    };
  } catch (error) {
    // Error handling with detailed information
  }
};
```

### 3. Enhanced Analysis Goal

The LLM analysis now receives comprehensive information about the Excel file with improved sample data format:

**Improved Sample Data Format:**
```
Columns: State | Estimated Number of Streets
Types: VARCHAR | VARCHAR
---
State: Alabama | Estimated Number of Streets: 120000
State: Alaska | Estimated Number of Streets: 30000
State: Arizona | Estimated Number of Streets: 100000
```

This format makes it clear to the LLM that:
- There are multiple columns (not a single column with comma-separated values)
- Each column has a specific name and data type
- The data is structured as "ColumnName: Value" for clarity

```typescript
const analysisGoal = `The user uploaded this data file. You need to evaluate the sample data to determine how best to write the code to format it properly for storage in parquet. Analyze this file data and return ONLY valid JSON with metadata and storage code:

File: ${fileUpload.name}
File Type: ${fileExtension}
File Size: ${formatFileSize(fileUpload.size)}

Data Structure:
${fileData.structure}

Parsed Headers: ${fileData.headers.join(', ')}
Number of Columns: ${fileData.headers.length}
Number of Sample Rows: ${fileData.rows.length}

Sample Data (first 10 rows, pipe-separated with column names):
${fileData.sampleData}

IMPORTANT: Each row contains ${fileData.headers.length} separate columns. The data is formatted as "ColumnName: Value" for clarity.
${(fileData as any).totalRows ? `Total Rows in File: ${(fileData as any).totalRows}` : ''}
${(fileData as any).sheetName ? `Active Sheet: ${(fileData as any).sheetName}` : ''}
${(fileData as any).allSheets && (fileData as any).allSheets.length > 1 ? `Available Sheets: ${(fileData as any).allSheets.join(', ')}` : ''}
```

### 4. Improved Conversion Code

The Python conversion code now handles Excel files more robustly:

```python
def convert_file_to_parquet(file_path, output_path):
    """
    Convert various file formats to parquet with proper error handling
    """
    try:
        file_extension = file_path.lower().split('.')[-1]
        
        if file_extension in ['xlsx', 'xls']:
            # For Excel files, try to read all sheets and use the first one with data
            excel_file = pd.ExcelFile(file_path)
            print(f"Available sheets: {excel_file.sheet_names}")
            
            # Try to find the first sheet with data
            df = None
            for sheet_name in excel_file.sheet_names:
                try:
                    sheet_df = pd.read_excel(file_path, sheet_name=sheet_name)
                    if not sheet_df.empty and len(sheet_df.columns) > 0:
                        df = sheet_df
                        print(f"Using sheet: {sheet_name}")
                        break
                except Exception as e:
                    print(f"Error reading sheet {sheet_name}: {e}")
                    continue
            
            if df is None:
                raise ValueError("No valid data found in any sheet")
        
        # Clean column names and remove empty rows/columns
        df.columns = [str(col).strip().replace(' ', '_').replace('-', '_') for col in df.columns]
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        # Convert to parquet with compression
        df.to_parquet(output_path, index=False, compression='snappy')
        
        return df
        
    except Exception as e:
        print(f"❌ Error converting file: {e}")
        sys.exit(1)
```

### 5. Enhanced UI Display

The analysis results now show:

- **File Metadata**: Including sheet information for Excel files
- **Data Preview**: First 10 rows of parsed data
- **Excel-specific Information**: Active sheet, available sheets, sample rows analyzed
- **Field Analysis**: Detailed column information with sample values

## Features

### ✅ Excel File Support
- **File Types**: `.xlsx` and `.xls` files
- **Multiple Sheets**: Detects and lists all available sheets
- **Sheet Selection**: Automatically selects the first sheet with data
- **Error Handling**: Graceful handling of corrupted or empty files

### ✅ Data Extraction
- **Headers**: Extracts column names from the first row
- **Sample Data**: Provides first 10 rows for LLM analysis
- **Total Count**: Reports actual row count in the file
- **Data Cleaning**: Removes empty rows and columns

### ✅ LLM Integration
- **Rich Context**: Sends comprehensive file information to LLM
- **Structured Analysis**: LLM receives parsed headers, sample data, and metadata
- **Intelligent Conversion**: LLM generates appropriate conversion code based on actual data structure

### ✅ Conversion Pipeline
- **Robust Python Code**: Handles various Excel file formats and structures
- **Error Recovery**: Tries multiple sheets if the first one is empty
- **Data Validation**: Cleans column names and removes empty data
- **Compression**: Uses snappy compression for efficient parquet storage

## Example Output

When a user uploads `streets.xlsx` with street data, the system now shows:

```
### 📋 File Metadata
- **Original Filename:** streets.xlsx
- **File Size:** 9.5 KB
- **Data Format:** xlsx
- **Estimated Rows:** 10
- **Estimated Columns:** 5
- **Active Sheet:** Streets
- **Sample Rows Analyzed:** 10

### 📊 Data Preview
**First 10 rows of parsed data:**

Street Name     City    State   Zip Code        Type
Main St         New York        NY      10001   Residential
Oak Ave         Los Angeles     CA      90210   Commercial
Pine Rd         Chicago IL      60601   Residential
...

### 🔍 Field Analysis
**Street_Name** (VARCHAR)
- Description: Column 1 from the uploaded file
- Sample Values: Main St, Oak Ave, Pine Rd
- Nullable: Yes
- Unique: No
```

## Benefits

1. **Accurate Analysis**: LLM receives actual data structure instead of placeholder information
2. **Better Conversion**: Python code is tailored to the specific Excel file structure
3. **User Experience**: Users see meaningful information about their uploaded files
4. **Error Prevention**: Robust error handling prevents crashes on malformed files
5. **Scalability**: Handles files with multiple sheets and various data formats

## Testing

The implementation has been tested with:
- ✅ Simple Excel files with single sheets
- ✅ Files with multiple sheets
- ✅ Files with various data types (text, numbers, dates)
- ✅ Error handling for corrupted files
- ✅ TypeScript compilation without errors

## Future Enhancements

Potential improvements for the future:
- **Sheet Selection UI**: Allow users to choose which sheet to analyze
- **Data Type Detection**: Automatically detect column data types
- **Preview Charts**: Show data visualizations for uploaded files
- **Batch Processing**: Handle multiple Excel files simultaneously
- **Advanced Validation**: Check for data quality issues during upload 