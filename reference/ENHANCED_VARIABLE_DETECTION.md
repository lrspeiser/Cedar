# Enhanced Variable Detection and Tracking

## 🎯 Overview

Cedar now includes comprehensive automatic variable detection and tracking capabilities. When Python scripts are executed, the system automatically:

1. **Detects all variable assignments** from the code
2. **Infers comprehensive metadata** including type, shape, purpose, and relationships
3. **Extracts units and tags** from context
4. **Tracks variable relationships** and dependencies
5. **Displays rich information** in the Variables tab

## 🚀 Key Features

### 1. **Comprehensive Variable Detection**

The system detects variables from various assignment patterns:
- `variable = value`
- `variable = function_call()`
- `variable = expression`
- Complex assignments and computations

### 2. **Intelligent Metadata Inference**

Each detected variable includes:
- **Name**: Variable name in the code
- **Type**: Python datatype (auto-inferred)
- **Shape/Size**: Dimensionality for arrays and DataFrames
- **Purpose**: Plain English description
- **Example Value**: Preview of data or repr()
- **Source**: How it was created
- **Units**: Measurement units (if applicable)
- **Tags**: Automatic categorization tags
- **Related Variables**: Dependencies and relationships
- **Visibility**: Public, hidden, or system

### 3. **Smart Type Inference**

Advanced type detection for:
- **Data Structures**: `pd.DataFrame`, `numpy.ndarray`, `list`, `dict`
- **Visualization Objects**: `matplotlib.figure.Figure`, `seaborn.axisgrid.FacetGrid`
- **Machine Learning**: `sklearn.base.BaseEstimator`
- **Primitive Types**: `int`, `float`, `str`, `bool`
- **Collections**: Lists, dictionaries, sets

### 4. **Context-Aware Purpose Inference**

Purpose is inferred from:
- **Variable names**: `data`, `result`, `plot`, `model`, `score`
- **Context**: Surrounding code and comments
- **Operations**: Loading, processing, visualization, training
- **Patterns**: Common data science workflows

### 5. **Automatic Tagging**

Variables are automatically tagged based on:
- **Type**: `data`, `visualization`, `machine_learning`, `numeric`
- **Library**: `pandas`, `numpy`, `matplotlib`, `seaborn`, `sklearn`
- **Category**: `collection`, `text`, `object`, `file`, `loading`

### 6. **Unit Detection**

Units are detected from context for:
- **Astronomical**: `parsecs`, `km/s`, `degrees`, `radians`
- **Temporal**: `years`, `days`, `hours`, `minutes`, `seconds`
- **Physical**: `meters`, `kilometers`, `grams`, `kilograms`

## 🔧 Technical Implementation

### Backend Functions

#### Enhanced Variable Extraction (`src-tauri/src/main.rs`)
```rust
async fn extract_variables_from_code(
    code: &str,
    output: &str,
    project_id: &str,
    state: &State<'_, AppState>,
) -> Result<(), String>
```

**Features:**
- Regex-based variable detection
- Context-aware metadata inference
- Relationship tracking
- Automatic project updates

#### Metadata Inference Functions
```rust
fn infer_variable_info_enhanced(...) -> (String, Option<String>, String, Option<String>, Vec<String>)
fn infer_variable_purpose(...) -> String
fn infer_variable_source(...) -> String
fn find_related_variables(...) -> Vec<String>
fn extract_units_from_context(...) -> Option<String>
fn generate_example_value(...) -> String
```

### Frontend Enhancements

#### Enhanced Variables Tab (`frontend/src/components/VariablesTab.tsx`)
- **Comprehensive table** with 9 columns
- **Auto-detection notification banner**
- **Rich metadata display**
- **Relationship visualization**
- **Tag management**

## 📊 Example Variable Tracking

### Input Code
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load data
star_data = pd.read_csv('gaia_dr3.csv')
stellar_velocities = star_data['velocity'].values  # km/s
distance_parsecs = star_data['distance'] * 1000  # Convert to parsecs

# Analysis
mean_velocity = np.mean(stellar_velocities)
velocity_std = np.std(stellar_velocities)

# Visualization
fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(stellar_velocities, bins=50, alpha=0.7)
ax.set_xlabel('Velocity (km/s)')
ax.set_ylabel('Count')
plot_result = ax
```

### Detected Variables

| Field | `star_data` | `stellar_velocities` | `mean_velocity` | `plot_result` |
|-------|-------------|---------------------|-----------------|---------------|
| **name** | `star_data` | `stellar_velocities` | `mean_velocity` | `plot_result` |
| **type** | `pd.DataFrame` | `numpy.ndarray` | `float` | `matplotlib.figure.Figure` |
| **shape** | `(132000, 12)` | `(132000,)` | `N/A` | `N/A` |
| **purpose** | "Data loaded from external source" | "Stellar velocity measurements" | "Statistical summary value" | "Visualization object" |
| **example_value** | "DataFrame with shape (132000, 12)" | "Array with shape (132000,)" | "245.67" | "Matplotlib figure object" |
| **source** | `file_loading` | `array_creation` | `computation` | `plot_creation` |
| **units** | `N/A` | `km/s` | `km/s` | `N/A` |
| **tags** | `["data", "dataframe", "pandas", "file", "loading"]` | `["data", "array", "numpy", "numeric"]` | `["numeric", "float", "statistical"]` | `["visualization", "plot", "matplotlib"]` |
| **related_to** | `[]` | `["star_data"]` | `["stellar_velocities"]` | `["stellar_velocities"]` |
| **visibility** | `public` | `public` | `public` | `public` |

## 🎨 UI Enhancements

### Comprehensive Table Display
The Variables tab now shows 9 columns:
1. **Variable**: Name and visibility status
2. **Type & Shape**: Data type and dimensionality
3. **Purpose**: Plain English description
4. **Example Value**: Preview of the data
5. **Source & Units**: Creation method and measurement units
6. **Tags**: Automatic categorization tags
7. **Related**: Variable relationships and dependencies
8. **Updated**: Timestamp of last update
9. **Actions**: Edit and delete operations

### Auto-detection Banner
When variables are detected:
```
📊 Automatic Variable Detection
5 variables detected from code execution with comprehensive metadata 
including type, shape, purpose, and relationships.
```

### Visual Indicators
- **Type badges**: Color-coded by data type
- **Source indicators**: Creation method
- **Unit badges**: Blue badges for measurement units
- **Relationship tags**: Gray badges for related variables
- **Tag categories**: Cedar-colored badges for automatic tags

## 🧪 Testing

### Test Script
Use the provided test script to see the feature in action:

```javascript
// Load the test script in the browser console
// Then run:
testVariableDetection()
```

This will:
1. Create a test project
2. Start research with variable-rich code
3. Monitor variable detection and metadata extraction
4. Show comprehensive analysis and statistics

### Expected Output
```
🧪 Testing Comprehensive Variable Detection and Tracking
📁 Creating test project...
✅ Project created: {id: "...", name: "Variable Detection Test"}
🚀 Starting research with variable-rich code...
✅ Research started: {status: "plan_generated"}
📊 Monitoring execution and variable detection...
📈 Session status: executing
📊 Variables detected: 8

📋 Variable details:
🔧 Variable: star_data
   Type: pd.DataFrame
   Shape: (132000, 12)
   Purpose: Data loaded from external source
   Source: file_loading
   Units: N/A
   Tags: [data, dataframe, pandas, file, loading]
   Related to: []
   Visibility: public
   Example value: DataFrame with shape (132000, 12)
   Updated: 2025-01-15T10:30:15Z
```

## 🔍 Variable Detection Patterns

### Data Loading Variables
| Pattern | Type | Tags | Purpose |
|---------|------|------|---------|
| `df = pd.read_csv(...)` | `pd.DataFrame` | `["data", "dataframe", "pandas", "file", "loading"]` | "Data loaded from external source" |
| `data = pd.read_excel(...)` | `pd.DataFrame` | `["data", "dataframe", "pandas", "file", "loading"]` | "Data loaded from external source" |

### Computation Variables
| Pattern | Type | Tags | Purpose |
|---------|------|------|---------|
| `mean = np.mean(...)` | `float` | `["numeric", "float", "statistical"]` | "Statistical summary value" |
| `result = calculation` | `object` | `["computation"]` | "Computation result or output" |

### Visualization Variables
| Pattern | Type | Tags | Purpose |
|---------|------|------|---------|
| `fig, ax = plt.subplots(...)` | `matplotlib.figure.Figure` | `["visualization", "plot", "matplotlib"]` | "Visualization object" |
| `plot = sns.histplot(...)` | `seaborn.axisgrid.FacetGrid` | `["visualization", "plot", "seaborn"]` | "Visualization object" |

### Machine Learning Variables
| Pattern | Type | Tags | Purpose |
|---------|------|------|---------|
| `model = sklearn.estimator(...)` | `sklearn.base.BaseEstimator` | `["machine_learning", "model", "sklearn"]` | "Machine learning model" |
| `predictions = model.predict(...)` | `numpy.ndarray` | `["data", "array", "numpy", "prediction"]` | "Prediction or forecast result" |

## 🎯 Benefits

### For Users
- **Complete visibility**: See all variables created during research
- **Rich metadata**: Understand what each variable contains and represents
- **Relationship tracking**: See how variables are connected
- **Automatic organization**: Variables are categorized and tagged automatically
- **Unit awareness**: Understand measurement units and context

### For Developers
- **Comprehensive tracking**: Full visibility into variable creation and usage
- **Metadata extraction**: Rich information about data types and purposes
- **Relationship mapping**: Understanding of variable dependencies
- **Context awareness**: Smart inference from code context
- **Extensible system**: Easy to add new detection patterns

### For Research Quality
- **Documentation**: Automatic documentation of all variables
- **Reproducibility**: Clear tracking of data transformations
- **Data lineage**: Understanding of how variables are created
- **Quality assurance**: Visibility into data types and shapes
- **Collaboration**: Shared understanding of variable purposes

## 🔮 Future Enhancements

- **Version tracking**: Track changes to variables over time
- **Dependency graphs**: Visual representation of variable relationships
- **Data validation**: Automatic validation of variable types and shapes
- **Export capabilities**: Generate variable documentation automatically
- **Advanced inference**: More sophisticated purpose and context detection
- **Custom patterns**: Allow users to define custom detection patterns
- **Integration**: Connect with external data catalogs and metadata systems 