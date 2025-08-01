// Test script for LLM output categorization system
const { invoke } = require('@tauri-apps/api/tauri');

async function testCategorizationSystem() {
  console.log('🧪 Testing LLM output categorization system...');
  
  try {
    // Step 1: Create a test project
    console.log('1️⃣ Creating test project...');
    const project = await invoke('create_project', {
      request: {
        name: 'Categorization Test',
        goal: 'Test LLM output categorization and routing to correct tabs'
      }
    });
    
    console.log('✅ Project created:', {
      id: project.id,
      name: project.name
    });

    // Step 2: Start research to create a session
    console.log('2️⃣ Starting research to create session...');
    const sessionId = `session_${project.id}`;
    
    const researchResult = await invoke('start_research', {
      request: {
        project_id: project.id,
        session_id: sessionId,
        goal: project.goal,
        answers: {
          q1: 'A) focus on statistical analysis',
          q2: 'A) analyze historical data',
          q3: 'A) interactive charts and graphs'
        }
      }
    });
    
    console.log('✅ Research started:', {
      hasCells: !!researchResult.cells,
      cellCount: researchResult.cells?.length || 0
    });

    // Step 3: Test categorized data generation
    console.log('3️⃣ Testing categorized data generation...');
    const dataCode = `# CATEGORY: data
# DESCRIPTION: Sample customer dataset for analysis
# FILENAME: customer_data.csv
import pandas as pd
import numpy as np

# Generate sample data
np.random.seed(42)
n_customers = 100
data = {
    'customer_id': range(1, n_customers + 1),
    'age': np.random.randint(18, 80, n_customers),
    'income': np.random.uniform(20000, 150000, n_customers),
    'satisfaction': np.random.uniform(1, 10, n_customers)
}

df = pd.DataFrame(data)
df.to_csv('customer_data.csv', index=False)
print("Customer dataset created with 100 records")
print("Dataset shape:", df.shape)
print("Columns:", list(df.columns))`;

    const dataResult = await invoke('execute_code', {
      request: {
        code: dataCode,
        session_id: sessionId
      }
    });
    
    console.log('✅ Data generation executed:', {
      success: dataResult.success,
      hasOutput: !!dataResult.output
    });

    // Step 4: Test categorized visualization generation
    console.log('4️⃣ Testing categorized visualization generation...');
    const vizCode = `# CATEGORY: visualization
# DESCRIPTION: Bar chart showing age distribution
# FILENAME: age_distribution.json
import pandas as pd
import json

# Load the data we just created
df = pd.read_csv('customer_data.csv')

# Create age groups
df['age_group'] = pd.cut(df['age'], bins=[0, 25, 35, 45, 55, 65, 100], 
                        labels=['18-25', '26-35', '36-45', '46-55', '56-65', '65+'])

age_counts = df['age_group'].value_counts().reset_index()
age_counts.columns = ['age_group', 'count']

# Create Vega-Lite specification
vega_spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Age distribution of customers",
    "data": {"values": age_counts.to_dict('records')},
    "mark": "bar",
    "encoding": {
        "x": {"field": "age_group", "type": "nominal", "title": "Age Group"},
        "y": {"field": "count", "type": "quantitative", "title": "Number of Customers"}
    },
    "title": "Customer Age Distribution"
}

# Save visualization
with open('age_distribution.json', 'w') as f:
    json.dump(vega_spec, f, indent=2)

print("Vega-Lite visualization created: age_distribution.json")
print("Age distribution:", age_counts.to_dict('records'))`;

    const vizResult = await invoke('execute_code', {
      request: {
        code: vizCode,
        session_id: sessionId
      }
    });
    
    console.log('✅ Visualization generation executed:', {
      success: vizResult.success,
      hasOutput: !!vizResult.output
    });

    // Step 5: Test categorized analysis generation
    console.log('5️⃣ Testing categorized analysis generation...');
    const analysisCode = `# CATEGORY: analysis
# DESCRIPTION: Statistical analysis of customer data
# FILENAME: customer_analysis.txt
import pandas as pd
import numpy as np

# Load data
df = pd.read_csv('customer_data.csv')

# Basic statistics
stats = df.describe()

# Correlation analysis
correlation = df[['age', 'income', 'satisfaction']].corr()

# Income analysis
high_income = df[df['income'] > 100000]
low_income = df[df['income'] <= 50000]

analysis_results = f"""
CUSTOMER DATA ANALYSIS
=====================

Dataset Overview:
- Total customers: {len(df)}
- Age range: {df['age'].min()} - {df['age'].max()}
- Income range: ${df['income'].min():.0f} - ${df['income'].max():.0f}

Key Statistics:
{stats}

Correlation Matrix:
{correlation}

Income Analysis:
- High income customers (>$100k): {len(high_income)} ({len(high_income)/len(df)*100:.1f}%)
- Low income customers (≤$50k): {len(low_income)} ({len(low_income)/len(df)*100:.1f}%)

Key Findings:
1. Average customer age: {df['age'].mean():.1f} years
2. Average income: ${df['income'].mean():.0f}
3. Average satisfaction: {df['satisfaction'].mean():.1f}/10
4. Income and satisfaction correlation: {correlation.loc['income', 'satisfaction']:.3f}
"""

with open('customer_analysis.txt', 'w') as f:
    f.write(analysis_results)

print("Analysis results saved to customer_analysis.txt")
print("Analysis completed successfully")`;

    const analysisResult = await invoke('execute_code', {
      request: {
        code: analysisCode,
        session_id: sessionId
      }
    });
    
    console.log('✅ Analysis generation executed:', {
      success: analysisResult.success,
      hasOutput: !!analysisResult.output
    });

    // Step 6: Check what was added to the project
    console.log('6️⃣ Checking project contents...');
    const updatedProject = await invoke('get_project', {
      project_id: project.id
    });
    
    console.log('✅ Project contents after categorization:', {
      dataFiles: updatedProject.data_files?.length || 0,
      images: updatedProject.images?.length || 0,
      references: updatedProject.references?.length || 0,
      variables: updatedProject.variables?.length || 0
    });

    // Step 7: List data files to verify data was added
    console.log('7️⃣ Listing data files...');
    const dataFiles = await invoke('list_data_files', {
      request: {
        project_id: project.id
      }
    });
    
    console.log('✅ Data files found:', {
      count: dataFiles.files?.length || 0,
      files: dataFiles.files?.map(f => f.filename) || []
    });

    // Step 8: List visualizations to verify they were added
    console.log('8️⃣ Listing visualizations...');
    const visualizations = await invoke('list_visualizations', {
      request: {
        project_id: project.id
      }
    });
    
    console.log('✅ Visualizations found:', {
      count: visualizations.visualizations?.length || 0,
      visualizations: visualizations.visualizations?.map(v => v.name) || []
    });

    // Step 9: Test legacy categorization (without headers)
    console.log('9️⃣ Testing legacy categorization...');
    const legacyCode = `import pandas as pd
import matplotlib.pyplot as plt

# Create some data
data = {'category': ['A', 'B', 'C'], 'value': [10, 20, 15]}
df = pd.DataFrame(data)

# Save data
df.to_csv('legacy_data.csv', index=False)

# Create plot
plt.figure(figsize=(8, 6))
plt.bar(df['category'], df['value'])
plt.title('Legacy Test Chart')
plt.savefig('legacy_chart.png')
plt.close()

print("Legacy data saved to legacy_data.csv")
print("Legacy chart saved to legacy_chart.png")`;

    const legacyResult = await invoke('execute_code', {
      request: {
        code: legacyCode,
        session_id: sessionId
      }
    });
    
    console.log('✅ Legacy categorization executed:', {
      success: legacyResult.success,
      hasOutput: !!legacyResult.output
    });

    // Step 10: Final verification
    console.log('🔟 Final verification...');
    const finalProject = await invoke('get_project', {
      project_id: project.id
    });
    
    const finalDataFiles = await invoke('list_data_files', {
      request: {
        project_id: project.id
      }
    });
    
    console.log('✅ Final project state:', {
      dataFiles: finalDataFiles.files?.length || 0,
      images: finalProject.images?.length || 0,
      totalFiles: (finalDataFiles.files?.length || 0) + (finalProject.images?.length || 0)
    });

    console.log('🎉 Categorization system test completed successfully!');
    
    // Cleanup: Delete the test project
    console.log('🧹 Cleaning up test project...');
    await invoke('delete_project', {
      project_id: project.id
    });
    console.log('✅ Test project deleted');

  } catch (error) {
    console.error('❌ Categorization system test failed:', error);
    throw error;
  }
}

// Run the test
testCategorizationSystem(); 