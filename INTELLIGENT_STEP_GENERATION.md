# Intelligent Step Generation

## 🎯 Overview

Cedar now includes intelligent step generation that automatically analyzes project context from all tabs and adds missing resources during research execution. The system:

1. **Gathers comprehensive project information** from all tabs (Variables, Libraries, Data, References, etc.)
2. **Analyzes each execution step** to identify missing resources
3. **Automatically generates and executes** additional steps to provide missing resources
4. **Updates all tabs** with newly created resources
5. **Provides real-time feedback** on intelligent step generation

## 🚀 Key Features

### 1. **Comprehensive Context Gathering**

The system collects information from all project tabs:
- **Variables Tab**: Available data variables and their metadata
- **Libraries Tab**: Installed and available Python libraries
- **Data Tab**: Available data files and sources
- **References Tab**: Research references and documentation
- **Questions Tab**: Answered research questions and context
- **Write-up Tab**: Current research documentation

### 2. **Intelligent Resource Analysis**

For each execution step, the system analyzes:
- **Missing Libraries**: Required imports not in the Libraries tab
- **Missing Data**: Data files needed but not available
- **Missing Variables**: Required variables not yet created
- **Missing Dependencies**: Related resources needed for execution

### 3. **Automatic Step Generation**

Based on missing resources, the system generates:
- **Data Creation Steps**: Sample data generation when no data files exist
- **Library Import Steps**: Library setup and import statements
- **Variable Initialization Steps**: Data loading and variable creation
- **Dependency Resolution Steps**: Related resource preparation

### 4. **Seamless Integration**

Intelligent steps are:
- **Executed automatically** before the main step
- **Visually distinguished** in the UI with special styling
- **Tracked separately** from regular execution steps
- **Integrated with all tabs** for comprehensive resource management

## 🔧 Technical Implementation

### Backend Functions

#### Project Context Gathering (`src-tauri/src/main.rs`)
```rust
struct ProjectContext {
    variables: Vec<VariableInfo>,
    libraries: Vec<Library>,
    data_files: Vec<String>,
    images: Vec<String>,
    references: Vec<Reference>,
    questions: Vec<Question>,
    write_up: String,
    project_goal: String,
}

async fn gather_project_context(project_id: &str, state: &State<'_, AppState>) -> Result<ProjectContext, String>
```

**Features:**
- Comprehensive project state collection
- Real-time tab information gathering
- Context-aware resource analysis

#### Intelligent Step Generation
```rust
async fn generate_intelligent_steps(
    current_step: &cedar::cell::NotebookCell,
    project_context: &ProjectContext,
    execution_results: &[serde_json::Value],
    step_index: usize,
) -> Result<Vec<String>, String>
```

**Analysis Capabilities:**
- **Library Detection**: Identifies missing pandas, numpy, matplotlib, seaborn, sklearn
- **Data File Detection**: Recognizes when data loading is needed
- **Variable Analysis**: Identifies missing data variables
- **Context Awareness**: Uses project goal and previous results

### Frontend Enhancements

#### Enhanced Execution Display (`frontend/src/components/ResearchSession.tsx`)
- **Visual distinction** for intelligent steps (purple styling)
- **Auto-added badges** to identify generated steps
- **Real-time updates** showing step generation progress
- **Comprehensive logging** of intelligent step execution

## 📊 Example Workflow

### Scenario: Research with Missing Resources

#### Initial State
- **Project Goal**: "Analyze customer data with pandas and create visualizations"
- **Variables Tab**: Empty
- **Libraries Tab**: Empty
- **Data Tab**: No data files

#### Execution Process

1. **Step 1 Analysis**: System detects missing pandas library
   ```
   🔧 Intelligent Step 1.1: Resource preparation
   # Install and import required library: pandas
   import pandas
   print('pandas library imported successfully')
   ```

2. **Step 1.2 Analysis**: System detects missing data files
   ```
   🔧 Intelligent Step 1.2: Resource preparation
   # Add sample data for analysis
   import pandas as pd
   import numpy as np
   
   # Create synthetic data for demonstration
   data = pd.DataFrame({
       'id': range(1000),
       'value': np.random.normal(100, 15, 1000),
       'category': np.random.choice(['A', 'B', 'C'], 1000),
       'timestamp': pd.date_range('2024-01-01', periods=1000, freq='H')
   })
   
   print(f'Created sample dataset with {len(data)} rows and {len(data.columns)} columns')
   data.head()
   ```

3. **Original Step 1**: Now executes with all resources available
   ```
   📋 Regular Step 1: Original analysis code
   # Analyze the data
   summary = data.describe()
   print(summary)
   ```

### Visual Feedback

#### Execution Results Display
```
🔧 Step 1.1: Resource preparation
   Status: ✅ Completed
   Type: 🔧 Auto-added
   Execution time: 245ms
   Output: pandas library imported successfully

🔧 Step 1.2: Resource preparation  
   Status: ✅ Completed
   Type: 🔧 Auto-added
   Execution time: 1234ms
   Output: Created sample dataset with 1000 rows and 4 columns

📋 Step 1: Original analysis code
   Status: ✅ Completed
   Execution time: 567ms
   Output: [DataFrame summary statistics]
```

## 🎨 UI Enhancements

### Intelligent Step Indicators
- **Purple styling** for auto-generated steps
- **🔧 Auto-added badges** to distinguish from regular steps
- **Special borders** to highlight intelligent additions
- **Real-time progress** showing step generation

### Enhanced Execution Results
- **Step categorization** (Regular vs Intelligent)
- **Resource tracking** showing what was automatically added
- **Execution timing** for both types of steps
- **Comprehensive logging** of intelligent decisions

## 🔍 Resource Detection Patterns

### Library Detection
| Pattern | Detection | Generated Step |
|---------|-----------|----------------|
| `import pandas` | Missing pandas library | Add pandas to libraries + import |
| `import numpy` | Missing numpy library | Add numpy to libraries + import |
| `import matplotlib` | Missing matplotlib | Add matplotlib to libraries + import |
| `import seaborn` | Missing seaborn | Add seaborn to libraries + import |
| `import sklearn` | Missing scikit-learn | Add scikit-learn to libraries + import |

### Data File Detection
| Pattern | Detection | Generated Step |
|---------|-----------|----------------|
| `read_csv()` | No data files available | Create sample data with pandas |
| `read_excel()` | No data files available | Create sample data with pandas |
| `pd.DataFrame()` | No variables available | Create initial data structure |

### Variable Detection
| Pattern | Detection | Generated Step |
|---------|-----------|----------------|
| `data.` | No data variables | Create sample dataset |
| `df.` | No DataFrame variables | Create sample DataFrame |
| `array.` | No array variables | Create sample numpy array |

## 🧪 Testing

### Test Script
Use the provided test script to see the feature in action:

```javascript
// Load the test script in the browser console
// Then run:
testIntelligentSteps()
```

This will:
1. Create a project with minimal resources
2. Start research requiring missing libraries and data
3. Monitor intelligent step generation
4. Show comprehensive analysis of auto-added resources

### Expected Output
```
🧪 Testing Intelligent Step Generation Based on Tab Information
📁 Creating test project with minimal resources...
✅ Project created: {id: "...", name: "Intelligent Steps Test"}
🚀 Starting research that will trigger intelligent step generation...
✅ Research started: {status: "plan_generated"}
📊 Monitoring execution and intelligent step generation...
📈 Session status: executing
📊 Execution results: 5 steps completed

🔧 Intelligent steps generated: 3
🔧 Intelligent Step 1.1:
   Description: Resource preparation: # Install and import required library: pandas
   Status: success
   Type: Auto-added resource preparation
   Execution time: 245ms
   Output preview: pandas library imported successfully

🔧 Intelligent Step 1.2:
   Description: Resource preparation: # Add sample data for analysis
   Status: success
   Type: Auto-added resource preparation
   Execution time: 1234ms
   Output preview: Created sample dataset with 1000 rows and 4 columns

📋 Regular steps executed: 2
📋 Regular Step 1:
   Description: Original analysis code
   Status: success
   Execution time: 567ms

📊 Variables detected: 3
   data: pd.DataFrame - Data loaded from external source
   summary: object - Computation result or output
   plot: matplotlib.figure.Figure - Visualization object

📚 Libraries detected: 4
   pandas: installed (auto_detected)
   numpy: installed (auto_detected)
   matplotlib: installed (auto_detected)
   seaborn: installed (auto_detected)
```

## 🎯 Benefits

### For Users
- **Seamless execution**: No manual intervention required
- **Automatic resource management**: Missing dependencies handled automatically
- **Comprehensive context awareness**: System understands project state
- **Real-time feedback**: Clear visibility into intelligent decisions
- **Enhanced productivity**: Focus on research, not setup

### For Developers
- **Intelligent automation**: Smart resource detection and creation
- **Context-aware execution**: Full project state consideration
- **Extensible system**: Easy to add new detection patterns
- **Comprehensive logging**: Full visibility into intelligent decisions
- **Error prevention**: Automatic dependency resolution

### For Research Quality
- **Reproducibility**: Automatic resource creation ensures consistency
- **Completeness**: No missing dependencies or resources
- **Documentation**: Automatic tracking of all created resources
- **Collaboration**: Shared understanding of project requirements
- **Quality assurance**: Comprehensive resource validation

## 🔮 Future Enhancements

- **Advanced pattern recognition**: More sophisticated resource detection
- **Custom step templates**: User-defined intelligent step patterns
- **Resource optimization**: Smart resource reuse and caching
- **Dependency graphs**: Visual representation of resource relationships
- **Machine learning**: Learn from user patterns and preferences
- **External integration**: Connect with external data sources and APIs
- **Performance optimization**: Parallel execution of independent steps
- **Advanced error recovery**: Intelligent error handling and recovery

## 📈 Performance Metrics

### Intelligent Step Generation Statistics
- **Detection accuracy**: Percentage of correctly identified missing resources
- **Step generation efficiency**: Time to generate and execute intelligent steps
- **Resource utilization**: Percentage of auto-generated resources actually used
- **User satisfaction**: Reduction in manual intervention required

### Example Metrics
```
📈 Step Generation Summary:
  Total steps executed: 8
  Regular steps: 5
  Intelligent steps (auto-added): 3
  Intelligent step ratio: 37.5%

🔧 Resources Automatically Added:
  ✅ Sample data created for analysis
  ✅ 4 libraries auto-detected and added
  ✅ 6 variables created during execution
```

The intelligent step generation system ensures that research execution is seamless, comprehensive, and automatically handles all missing resources, allowing users to focus on their research goals rather than setup and configuration. 