# Automatic Library Detection and Installation

## 🎯 Overview

Cedar now includes intelligent automatic library detection and installation capabilities. When Python scripts are created and executed, the system automatically:

1. **Detects imported libraries** from the code
2. **Maps them to pip package names** 
3. **Adds them to the Libraries tab** with "auto_detected" source
4. **Automatically installs** the required libraries
5. **Tracks installation status** and provides feedback

## 🚀 Key Features

### 1. **Intelligent Import Detection**

The system uses regex patterns to detect various Python import styles:
- `import pandas`
- `from pandas import DataFrame`
- `import pandas as pd`
- `from pandas import *`

### 2. **Smart Library Mapping**

Common Python libraries are mapped to their pip package names:
- `pandas` → `pandas`
- `numpy` → `numpy`
- `matplotlib` → `matplotlib`
- `seaborn` → `seaborn`
- `sklearn` → `scikit-learn`
- `tensorflow` → `tensorflow`
- `torch` → `torch`
- And many more...

### 3. **Built-in Library Filtering**

Built-in Python libraries are automatically filtered out (no installation needed):
- `json`, `csv`, `datetime`, `os`, `sys`, `re`, `math`, `random`, etc.

### 4. **Automatic Installation**

Detected libraries are automatically installed using pip:
- Installation happens in the background
- Status is tracked (pending → installing → installed/failed)
- Error messages are captured and displayed

### 5. **Enhanced UI Feedback**

The Libraries tab now shows:
- **Auto-detection notification banner**
- **Enhanced stats** (auto-detected vs manual)
- **Source indicators** (purple for auto-detected)
- **Installation progress** and status

## 🔧 Technical Implementation

### Backend Functions

#### Library Detection (`src-tauri/src/main.rs`)
```rust
fn detect_and_add_libraries_from_code(
    code: &str, 
    project_id: &str, 
    state: &State<'_, AppState>
) -> Result<(), String>
```

**Features:**
- Regex-based import detection
- Library name mapping
- Built-in library filtering
- Automatic project updates

#### Auto-Installation (`src-tauri/src/main.rs`)
```rust
async fn auto_install_pending_libraries(
    project_id: &str, 
    state: &State<'_, AppState>
) -> Result<(), String>
```

**Features:**
- Background pip installation
- Status tracking
- Error handling
- Project persistence

### Frontend Enhancements

#### Enhanced Libraries Tab (`frontend/src/components/LibrariesTab.tsx`)
- **Auto-detection notification banner**
- **Enhanced statistics** (6-column grid)
- **Source-based filtering**
- **Real-time status updates**

## 📊 Example Workflow

### 1. **Code Creation**
When the LLM generates Python code like:
```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
```

### 2. **Automatic Detection**
The system detects:
- `pandas` → `pandas`
- `numpy` → `numpy`
- `matplotlib` → `matplotlib`
- `seaborn` → `seaborn`
- `sklearn` → `scikit-learn`

### 3. **Library Addition**
Libraries are added to the project with:
- **Source**: `"auto_detected"`
- **Status**: `"pending"`
- **Required by**: `["Code cell: pandas", "Code cell: numpy", ...]`

### 4. **Automatic Installation**
The system automatically runs:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn
```

### 5. **Status Updates**
Libraries are updated with:
- **Status**: `"installed"` or `"failed"`
- **Installed at**: Timestamp
- **Error message**: If installation failed

## 🎨 UI Enhancements

### Enhanced Statistics
The Libraries tab now shows 6 statistics:
- **Total**: All libraries
- **Pending**: Waiting for installation
- **Installed**: Successfully installed
- **Failed**: Installation failed
- **Auto-detected**: Automatically detected
- **Manual**: Manually added

### Auto-detection Banner
When auto-detected libraries are present:
```
📦 Auto-detected Libraries
3 libraries detected from your code and automatically added to the project. 
Some are being installed automatically.
```

### Visual Indicators
- **Purple badges**: Auto-detected libraries
- **Blue badges**: Manual libraries
- **Green badges**: Successfully installed
- **Red badges**: Installation failed
- **Yellow badges**: Pending installation

## 🧪 Testing

### Test Script
Use the provided test script to see the feature in action:

```javascript
// Load the test script in the browser console
// Then run:
testLibraryDetection()
```

This will:
1. Create a test project
2. Start research with library-heavy code
3. Monitor library detection and installation
4. Show detailed progress and results

### Expected Output
```
🧪 Testing Automatic Library Detection and Installation
📁 Creating test project...
✅ Project created: {id: "...", name: "Library Detection Test"}
🚀 Starting research with library-heavy code...
✅ Research started: {status: "plan_generated"}
📊 Monitoring execution and library detection...
📈 Session status: executing
📦 Libraries detected: 5
📋 Library details:
  - pandas (auto_detected): installed
  - numpy (auto_detected): installed
  - matplotlib (auto_detected): installed
  - seaborn (auto_detected): installed
  - scikit-learn (auto_detected): installed
```

## 🔍 Library Mapping

### Common Data Science Libraries
| Import Name | Pip Package | Description |
|-------------|-------------|-------------|
| `pandas` | `pandas` | Data manipulation and analysis |
| `numpy` | `numpy` | Numerical computing |
| `matplotlib` | `matplotlib` | Plotting and visualization |
| `seaborn` | `seaborn` | Statistical data visualization |
| `plotly` | `plotly` | Interactive plotting |
| `scipy` | `scipy` | Scientific computing |
| `sklearn` | `scikit-learn` | Machine learning |

### Web Scraping Libraries
| Import Name | Pip Package | Description |
|-------------|-------------|-------------|
| `requests` | `requests` | HTTP library |
| `beautifulsoup4` | `beautifulsoup4` | HTML/XML parsing |
| `bs4` | `beautifulsoup4` | BeautifulSoup alias |
| `selenium` | `selenium` | Web automation |

### Data Processing Libraries
| Import Name | Pip Package | Description |
|-------------|-------------|-------------|
| `openpyxl` | `openpyxl` | Excel file handling |
| `xlrd` | `xlrd` | Excel file reading |

### Deep Learning Libraries
| Import Name | Pip Package | Description |
|-------------|-------------|-------------|
| `tensorflow` | `tensorflow` | Deep learning framework |
| `torch` | `torch` | PyTorch framework |

### Built-in Libraries (No Installation)
These are automatically filtered out:
- `json`, `csv`, `datetime`, `os`, `sys`, `re`, `math`, `random`, `statistics`, `collections`, `itertools`, `functools`, `logging`, `sqlite3`

## 🎯 Benefits

### For Users
- **Zero configuration**: Libraries are detected and installed automatically
- **No manual setup**: No need to manually add libraries to requirements.txt
- **Immediate availability**: Libraries are ready to use after detection
- **Error visibility**: Clear feedback on installation success/failure

### For Developers
- **Reduced friction**: Users can focus on research, not setup
- **Consistent environment**: All required libraries are automatically managed
- **Error handling**: Robust error detection and reporting
- **Extensible**: Easy to add new library mappings

### For Research Quality
- **Dependency tracking**: Clear visibility into what libraries are used
- **Reproducibility**: All dependencies are documented and installed
- **Environment consistency**: Same libraries across all research sessions
- **Version management**: Support for specific library versions

## 🔮 Future Enhancements

- **Version detection**: Automatically detect required versions from code
- **Conflict resolution**: Handle library version conflicts
- **Virtual environments**: Support for project-specific environments
- **Dependency graphs**: Visualize library dependencies
- **Export capabilities**: Generate requirements.txt automatically
- **Advanced mapping**: Support for more complex import patterns
- **Custom mappings**: Allow users to define custom library mappings 