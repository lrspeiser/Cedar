# Cedar Visualization System

## Overview

Cedar's visualization system provides standardized, interactive chart creation using **Vega-Lite** and **Plotly** as the core technologies. This system enables the LLM planner to generate consistent, high-quality visualizations that are automatically saved to the Images tab and rendered beautifully in the app.

## 🎯 **Core Choice: Vega-Lite + Plotly**

### **Primary Choice: Vega-Lite**
- **Use for**: Most charts, graphs, and data visualizations
- **Advantages**: Declarative, interactive, web-native, consistent styling
- **Best for**: Bar charts, line charts, scatter plots, heatmaps, histograms, box plots
- **Format**: JSON specification that can be rendered directly in the browser

### **Secondary Choice: Plotly**
- **Use for**: Complex interactive visualizations, 3D plots, advanced analytics
- **Advantages**: Highly interactive, extensive chart types, scientific plotting
- **Best for**: 3D scatter plots, surface plots, subplots, complex dashboards
- **Format**: JSON with data and layout objects

## 🏗️ **Architecture**

### **Frontend Components**
- **ImagesTab.tsx**: Enhanced with Vega-Lite and Plotly rendering
- **Dynamic Imports**: Lazy loading of visualization libraries
- **Interactive Preview**: Real-time chart rendering in the UI
- **Full View Modal**: Expanded visualization viewing

### **Backend Storage**
- **Visualization Struct**: Complete metadata and content storage
- **File-based Storage**: JSON specifications saved to disk
- **Project Integration**: Visualizations linked to research projects
- **Session Tracking**: Optional session association

### **API Integration**
- **Tauri Commands**: Backend visualization management
- **Frontend API Service**: TypeScript interface for visualization operations
- **Standardized Format**: Consistent data structures across the system

## 📊 **Visualization Standards**

### **Vega-Lite Specifications**
Always create complete, valid Vega-Lite JSON specifications:

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Clear description of the visualization",
  "data": {
    "values": [
      // Your data here
    ]
  },
  "mark": "bar|line|point|area|circle|square|text|tick|rect|rule|geoshape",
  "encoding": {
    "x": {"field": "field_name", "type": "nominal|quantitative|temporal|ordinal"},
    "y": {"field": "field_name", "type": "nominal|quantitative|temporal|ordinal"},
    "color": {"field": "field_name", "type": "nominal|quantitative|temporal|ordinal"},
    "size": {"field": "field_name", "type": "quantitative"},
    "tooltip": [{"field": "field_name", "type": "quantitative"}]
  },
  "title": "Descriptive title",
  "width": 400,
  "height": 300
}
```

### **Plotly Specifications**
For complex visualizations, use Plotly format:

```json
{
  "data": [
    {
      "x": ["x_values"],
      "y": ["y_values"],
      "type": "bar|scatter|line|histogram|box|violin|heatmap",
      "mode": "markers|lines|markers+lines",
      "name": "Series name"
    }
  ],
  "layout": {
    "title": "Chart title",
    "xaxis": {"title": "X-axis label"},
    "yaxis": {"title": "Y-axis label"},
    "width": 600,
    "height": 400
  }
}
```

## 🔧 **Implementation Details**

### **Frontend Dependencies**
```json
{
  "vega-embed": "^6.21.0",
  "plotly.js-dist": "^2.27.1"
}
```

### **Backend Storage Structure**
```
data_root/
├── visualizations/
│   └── {project_id}/
│       ├── {visualization_name}.json
│       └── {visualization_name}.metadata.json
```

### **Visualization Metadata**
```rust
pub struct Visualization {
    pub id: String,
    pub name: String,
    pub visualization_type: String, // "vega-lite", "plotly", "matplotlib", "manual"
    pub description: String,
    pub filename: String,
    pub content: String,
    pub code: Option<String>,
    pub timestamp: u64,
    pub spec: Option<serde_json::Value>, // Vega-Lite specification
    pub data: Option<serde_json::Value>, // Plotly data
    pub layout: Option<serde_json::Value>, // Plotly layout
    pub project_id: String,
    pub session_id: Option<String>,
}
```

## 🚀 **Usage Examples**

### **Creating a Vega-Lite Visualization**
```typescript
// Frontend
const vegaSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Customer churn analysis",
  "data": {
    "values": [
      {"segment": "Premium", "churn_rate": 0.15},
      {"segment": "Standard", "churn_rate": 0.25},
      {"segment": "Basic", "churn_rate": 0.35}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "segment", "type": "nominal"},
    "y": {"field": "churn_rate", "type": "quantitative"}
  },
  "title": "Churn Rate by Customer Segment"
};

await apiService.createVisualization({
  projectId: "project-123",
  name: "churn_analysis",
  visualizationType: "vega-lite",
  description: "Customer churn analysis by segment",
  content: JSON.stringify(vegaSpec, null, 2)
});
```

### **Generating a Plotly Visualization**
```typescript
// Frontend
await apiService.generateVisualization({
  projectId: "project-123",
  data: [
    {"x": 1, "y": 10, "category": "A"},
    {"x": 2, "y": 20, "category": "B"},
    {"x": 3, "y": 15, "category": "C"}
  ],
  chartType: "scatter",
  xField: "x",
  yField: "y",
  title: "Data Distribution",
  visualizationType: "plotly"
});
```

### **Python Code for Vega-Lite Generation**
```python
import pandas as pd
import json

# Load and prepare data
df = pd.read_csv('data.csv')

# Create Vega-Lite specification
vega_spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Analysis of key metrics",
    "data": {"values": df.to_dict('records')},
    "mark": "bar",
    "encoding": {
        "x": {"field": "category", "type": "nominal"},
        "y": {"field": "value", "type": "quantitative"}
    }
}

# Save visualization
with open('visualization.json', 'w') as f:
    json.dump(vega_spec, f, indent=2)

print("Vega-Lite visualization created: visualization.json")
```

### **Python Code for Plotly Generation**
```python
import pandas as pd
import plotly.graph_objects as go
import json

# Load and prepare data
df = pd.read_csv('data.csv')

# Create Plotly figure
fig = go.Figure(data=[
    go.Bar(x=df['category'], y=df['value'])
])

fig.update_layout(
    title="Analysis Results",
    xaxis_title="Category",
    yaxis_title="Value"
)

# Save as JSON
plotly_spec = {
    "data": fig.data,
    "layout": fig.layout
}

with open('plotly_visualization.json', 'w') as f:
    json.dump(plotly_spec, f, indent=2, default=str)

print("Plotly visualization created: plotly_visualization.json")
```

## 🎨 **Visualization Best Practices**

### **Chart Type Selection**
- **Bar charts**: Categorical comparisons, counts, percentages
- **Line charts**: Time series, trends, continuous relationships
- **Scatter plots**: Correlation analysis, outlier detection
- **Histograms**: Distribution analysis, data shape
- **Box plots**: Distribution comparison, outlier identification
- **Heatmaps**: Correlation matrices, 2D data patterns

### **Design Principles**
- Use consistent color schemes
- Include clear titles and axis labels
- Add tooltips for interactivity
- Ensure accessibility (color contrast, labels)
- Keep visualizations focused and uncluttered

### **Data Considerations**
- Handle missing data appropriately
- Use appropriate scales (log vs linear)
- Consider data transformations
- Include confidence intervals when relevant

## 🔄 **Integration with Research Workflow**

### **LLM Planning Integration**
The LLM planner is encouraged to use Vega-Lite and Plotly through the planning prompt:

1. **Research Plan Generation**: Include visualization steps
2. **Code Execution**: Generate Python code that creates JSON specifications
3. **Automatic Saving**: Visualizations are saved to the Images tab
4. **Interactive Rendering**: Charts are displayed in the app

### **Research Plan Structure**
```
Research Plan: Customer Churn Analysis

Step 1: Data Loading and Cleaning
- Load customer data from CSV
- Handle missing values
- Create churn flag variable

Step 2: Exploratory Data Analysis
- Generate summary statistics
- Create Vega-Lite bar chart of churn rates by segment
- Create Vega-Lite histogram of customer tenure
- Create Plotly correlation heatmap of numerical variables

Step 3: Statistical Analysis
- Perform logistic regression
- Create Vega-Lite scatter plot of predicted vs actual
- Generate Plotly ROC curve

Step 4: Results Dashboard
- Create comprehensive Vega-Lite dashboard with all key metrics
- Include interactive filters and drill-down capabilities
```

## 📋 **API Reference**

### **Frontend API Methods**
```typescript
// Create a new visualization
apiService.createVisualization(request: {
  projectId: string;
  name: string;
  visualizationType: string;
  description: string;
  content: string;
  code?: string;
  sessionId?: string;
})

// List all visualizations for a project
apiService.listVisualizations(request: {
  projectId: string;
})

// Delete a visualization
apiService.deleteVisualization(request: {
  projectId: string;
  visualizationId: string;
})

// Generate a visualization from data
apiService.generateVisualization(request: {
  projectId: string;
  data: any[];
  chartType: string;
  xField: string;
  yField: string;
  title: string;
  visualizationType: string;
})
```

### **Backend Tauri Commands**
```rust
// Create a new visualization
create_visualization(request: CreateVisualizationRequest)

// List all visualizations for a project
list_visualizations(request: ListVisualizationsRequest)

// Delete a visualization
delete_visualization(request: DeleteVisualizationRequest)

// Generate a visualization from data
generate_visualization(request: GenerateVisualizationRequest)
```

## 🧪 **Testing**

### **Unit Tests**
```rust
#[test]
fn test_vega_lite_spec_generation() {
    let data = vec![
        serde_json::json!({"category": "A", "value": 10}),
        serde_json::json!({"category": "B", "value": 20})
    ];
    
    let spec = generate_vega_lite_spec(&data, "bar", "category", "value", "Test Chart")
        .expect("Failed to generate spec");
    
    assert!(spec.get("mark").is_some());
    assert!(spec.get("encoding").is_some());
}

#[test]
fn test_plotly_spec_generation() {
    let data = vec![
        serde_json::json!({"x": 1, "y": 10}),
        serde_json::json!({"x": 2, "y": 20})
    ];
    
    let spec = generate_plotly_spec(&data, "scatter", "x", "y", "Test Chart")
        .expect("Failed to generate spec");
    
    assert!(spec.get("data").is_some());
    assert!(spec.get("layout").is_some());
}
```

### **Integration Tests**
```javascript
// Test visualization creation
const result = await apiService.createVisualization({
  projectId: "test-project",
  name: "test_chart",
  visualizationType: "vega-lite",
  description: "Test visualization",
  content: JSON.stringify(testSpec)
});

expect(result.success).toBe(true);
expect(result.visualization_id).toBeDefined();
```

## 🔧 **Configuration**

### **File Naming Convention**
- Use descriptive names: `customer_churn_analysis.json`
- Include chart type: `revenue_trends_line_chart.json`
- Add version if needed: `correlation_matrix_v2.json`

### **Metadata Requirements**
Each visualization should include:
- Descriptive title
- Clear description of what it shows
- Data source information
- Creation timestamp
- Chart type and technology used

## 🚀 **Future Enhancements**

### **Planned Features**
- **Dashboard Creation**: Multi-chart dashboards
- **Template Library**: Pre-built chart templates
- **Export Options**: PNG, SVG, PDF export
- **Advanced Interactions**: Cross-chart filtering
- **Real-time Updates**: Live data visualization
- **Custom Themes**: Branded visualization styles

### **Performance Optimizations**
- **Lazy Loading**: Load visualizations on demand
- **Caching**: Cache rendered charts
- **Compression**: Optimize JSON specifications
- **Batch Operations**: Bulk visualization operations

## 📚 **Resources**

### **Documentation**
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/)
- [Plotly.js Documentation](https://plotly.com/javascript/)
- [Cedar Planning Prompt](prompts/plan.txt)

### **Examples**
- [Vega-Lite Examples](https://vega.github.io/vega-lite/examples/)
- [Plotly Examples](https://plotly.com/javascript/plotlyjs-examples/)

### **Best Practices**
- [Data Visualization Best Practices](https://www.storytellingwithdata.com/)
- [Interactive Visualization Design](https://www.interaction-design.org/literature/topics/data-visualization)

---

**Note**: This visualization system is designed to work seamlessly with Cedar's research workflow, providing standardized, interactive charts that enhance data analysis and presentation capabilities. 