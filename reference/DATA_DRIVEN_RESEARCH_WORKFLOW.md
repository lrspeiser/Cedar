# Data-Driven Research Workflow

## Overview

The research workflow has been completely redesigned to be data-driven and practical. Instead of building complex research plans, the system now focuses on:

1. **Data Assessment** - Evaluate existing data
2. **Data Collection** - Get additional data if needed  
3. **Analysis** - Run Python analysis on collected data

## New Workflow Steps

### 1. Data Assessment Phase
- **Cell Type**: `data_assessment`
- **Purpose**: Evaluate existing data files in the project
- **Action**: Lists all available data files and their metadata
- **Next Step**: If data exists → Analysis Plan, If no data → Data Collection

### 2. Data Collection Phase  
- **Cell Type**: `data_collection`
- **Purpose**: Determine what additional data is needed and provide it
- **Action**: Uses LLM to evaluate data requirements and generate/suggest data
- **Next Step**: Analysis Plan

### 3. Analysis Planning Phase
- **Cell Type**: `analysis_plan`
- **Purpose**: Plan the analysis approach based on available data
- **Action**: Creates a comprehensive analysis plan with data exploration, preprocessing, statistical analysis, and visualization steps
- **Next Step**: Analysis Execution

### 4. Analysis Execution Phase
- **Cell Type**: `analysis_execution`
- **Purpose**: Execute Python code to perform the analysis
- **Action**: Generates and runs Python code for data exploration, analysis, and visualization
- **Next Step**: Results and Write-up

## Key Changes

### Removed Components
- Complex research plan generation
- Multi-phase planning system
- Abstract generation and academic paper workflow

### New Components
- Data-driven decision making
- Direct data evaluation and collection
- Practical Python analysis execution
- Streamlined workflow from data to results

## Cell Types

### New Cell Types Added
- `data_assessment` - Evaluate existing data
- `data_collection` - Collect additional data
- `analysis_plan` - Plan analysis approach
- `analysis_execution` - Execute analysis code

### Updated Cell Types
- `abstract` - Now leads to data assessment instead of plan generation
- `result` - Now generates final write-up directly

## Implementation Details

### Data Assessment Function
```typescript
const generateDataAssessmentCell = async (): Promise<Cell>
```
- Lists existing data files in the project
- Shows file metadata (columns, descriptions)
- Determines next step based on data availability

### Data Collection Function
```typescript
const generateDataCollectionCell = async (dataNeeded: string): Promise<Cell>
```
- Uses LLM to evaluate data requirements
- Suggests data sources and generation methods
- Provides Python code for data generation if applicable

### Analysis Planning Function
```typescript
const generateAnalysisPlanCell = async (): Promise<Cell>
```
- Creates comprehensive analysis plan
- Lists available data files for analysis
- Outlines analysis approach (exploration, preprocessing, statistics, visualization)

### Analysis Execution Function
```typescript
const generateAnalysisExecutionCell = async (): Promise<Cell>
```
- Generates Python code for analysis
- Loads all available data files
- Performs data exploration, analysis, and visualization
- Creates comprehensive analysis script

## Benefits

1. **Practical Focus**: Directly addresses data needs rather than theoretical planning
2. **Data-Driven**: Makes decisions based on actual available data
3. **Streamlined**: Eliminates complex planning phases
4. **Actionable**: Each step produces concrete results
5. **Flexible**: Adapts to available data and research goals

## Usage Example

1. User submits research goal
2. System generates research initialization (references, background)
3. System creates data assessment cell
4. If data exists → Analysis plan → Analysis execution → Results
5. If no data → Data collection → Analysis plan → Analysis execution → Results

## Testing

The new workflow can be tested by:
1. Creating a new research project
2. Submitting a research goal
3. Following the Next Step buttons through the new workflow
4. Verifying that data assessment, collection, and analysis work correctly

## Future Enhancements

1. **LLM Integration**: Connect data collection to actual LLM for data generation
2. **Data Validation**: Add data quality checks and validation
3. **Advanced Analysis**: Implement more sophisticated analysis templates
4. **Data Sources**: Integrate with external data APIs and sources 