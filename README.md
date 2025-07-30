# 🌲 Cedar: Building an AI-Native Notebook from Scratch

*How we built a Rust-powered, AI-driven research assistant that thinks like a data scientist*

---

## 🎯 The Vision

Traditional notebooks are great for exploration, but they're not built for the AI era. What if your notebook could:

- **Understand your research goals** in plain English
- **Plan the entire workflow** automatically  
- **Generate and execute code** step by step
- **Learn from outputs** and iterate intelligently
- **Maintain context** across multiple sessions

That's Cedar. It's not just another Jupyter alternative—it's a complete reimagining of what a research notebook should be when AI is your co-pilot.

---

## 🏗️ Architecture Decisions

### Why Rust?

We chose Rust for the backend for several reasons:

1. **Performance**: Python code execution needs to be fast and reliable
2. **Memory Safety**: No segfaults when dealing with external processes
3. **Cross-platform**: Native binaries for macOS, Linux, Windows
4. **Ecosystem**: Excellent async runtime with `tokio` and robust HTTP clients

```rust
// Example: Our async Python executor
pub async fn run_python_code(code: &str) -> Result<String, String> {
    let output = Command::new("python3")
        .arg("-c")
        .arg(code)
        .output()
        .await
        .map_err(|e| format!("Failed to run Python: {}", e))?;
    
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
```

### Session Management: The Key Innovation

One of our biggest challenges was maintaining Python session state across multiple code cells. Here's how we solved it:

```rust
// We accumulate code and track output differences
let mut session_code = String::new();
let mut previous_output = String::new();

for cell in plan_cells {
    session_code.push_str(&cell.content);
    session_code.push('\n');
    
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            // Only show new output, not duplicates
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            if !new_output.is_empty() {
                println!("📊 New output: {}", new_output);
            }
            previous_output = stdout;
        }
        Err(e) => handle_error(e),
    }
}
```

This approach ensures that:
- ✅ Variables persist between cells
- ✅ No duplicate output from previous executions
- ✅ Clean, incremental results display
- ✅ Proper error handling and recovery

### LLM Integration: Structured Planning

Instead of free-form chat, we use structured JSON responses for reliable parsing:

```rust
#[derive(Debug, Deserialize)]
struct PlanBundle {
    total_steps: usize,
    steps: Vec<PlanStep>,
}

#[derive(Debug, Deserialize)]
struct PlanStep {
    label: String,
    description: String,
    code: Option<String>,
}
```

This allows us to:
- **Parse plans reliably** without regex hacks
- **Generate executable code** directly from the LLM
- **Track progress** through structured steps
- **Handle errors gracefully** with type safety

---

## 🧠 How It Works: A Deep Dive

### 1. Goal Understanding

When you say *"Find the top 3 product categories associated with churn"*, Cedar:

1. **Analyzes the goal** using context from previous sessions
2. **Checks available datasets** in your workspace
3. **Generates a structured plan** with specific steps

```rust
pub async fn generate_plan_from_goal(
    goal: &str,
    context: &mut NotebookContext,
) -> Result<Vec<NotebookCell>, String> {
    let known = storage::list_known_datasets();
    let context_vars = context.variables.iter()
        .map(|(k, v)| format!("{} = {}", k, v))
        .collect::<Vec<_>>()
        .join(", ");

    let prompt = format!(
        r#"Given the research goal: "{goal}"
        
        Known variables: {context_vars}
        
        Return a JSON object with:
        - `total_steps`: number of plan steps  
        - `steps`: list of steps (each with label, description, optional code)
        
        Each step must include:
        - `label`: one of "python", "data", "plot", "discussion"
        - `description`: what the step does
        - optional `code`: Python code only for executable steps"#
    );

    let raw_json = llm::ask_llm(&prompt).await?;
    let parsed: PlanBundle = serde_json::from_str(&raw_json)?;
    
    // Convert to notebook cells
    Ok(parsed.steps.into_iter().map(|step| {
        NotebookCell::new(CellType::Plan, CellOrigin::Ai, &step.description)
    }).collect())
}
```

### 2. Intelligent Code Generation

Cedar generates clean, executable Python code without markdown formatting:

```rust
pub async fn generate_code_for_step(step_description: &str) -> Result<NotebookCell, String> {
    let prompt = format!(
        "Write a clean Python code snippet to complete this task:\n\n\"{}\"\n\nIMPORTANT: Return ONLY the Python code without any markdown formatting, backticks, or explanations. Just the raw Python code that can be executed directly.",
        step_description
    );

    let code_text = llm::ask_llm(&prompt).await?;
    Ok(NotebookCell::new(CellType::Code, CellOrigin::Ai, &code_text))
}
```

### 3. Smart Dependency Management

When Python code fails due to missing packages, Cedar automatically installs them:

```rust
pub fn auto_install_if_missing(error_msg: &str) -> Result<Option<String>, String> {
    // Common import error patterns
    let patterns = [
        (r"No module named '(\w+)'", "$1"),
        (r"ModuleNotFoundError: No module named '(\w+)'", "$1"),
    ];

    for (pattern, replacement) in patterns {
        if let Some(captures) = Regex::new(pattern).unwrap().captures(error_msg) {
            let package = captures[1].to_string();
            install_package(&package)?;
            return Ok(Some(package));
        }
    }
    Ok(None)
}

fn install_package(pkg: &str) -> Result<(), String> {
    let output = Command::new("python3")
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("--break-system-packages") // Handle externally managed environments
        .arg(pkg)
        .output()
        .map_err(|e| format!("Failed to run pip: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(format!("Failed to install {}: {}", pkg, 
            String::from_utf8_lossy(&output.stderr)))
    }
}
```

### 4. Context-Aware Execution

Cedar maintains a glossary of scientific terms and tracks variables across sessions:

```rust
#[derive(Debug, Clone)]
pub struct NotebookContext {
    pub variables: HashMap<String, String>,
    pub glossary: HashMap<String, String>,
}

impl NotebookContext {
    pub fn update_from_code(&mut self, code: &str) {
        // Extract variable assignments
        for line in code.lines() {
            let line = line.trim();
            if let Some(pos) = line.find('=') {
                let var_name = line[..pos].trim();
                if var_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
                    let value = line[pos + 1..].trim();
                    if !value.is_empty() {
                        self.set_variable(var_name, value);
                    }
                }
            }
        }
    }
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Rust** (latest stable)
- **Python 3.8+** with pip
- **OpenAI API key** (for LLM integration)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/cedar.git
cd cedar
```

2. **Set up environment variables:**
```bash
# Create .env file
echo "OPENAI_API_KEY=sk-your-real-secret-key" > .env
```

3. **Build and run:**
```bash
# Development mode
cargo run -p cedar-core --bin dev

# Interactive research assistant
cargo run -p cedar-core --bin research

# Test storage functionality
cargo run -p cedar-core --bin storage_test
```

### Project Structure

```
cedar/
├── cedar-core/                 # Rust backend
│   ├── src/
│   │   ├── agent.rs           # LLM-powered planning
│   │   ├── executor.rs        # Python code execution
│   │   ├── llm.rs             # OpenAI API integration
│   │   ├── deps.rs            # Package management
│   │   ├── context.rs         # Session state management
│   │   ├── storage.rs         # Dataset manifests
│   │   └── bin/               # Executable binaries
│   │       ├── dev.rs         # Development runner
│   │       ├── research.rs    # Interactive assistant
│   │       └── storage_test.rs # Storage testing
│   └── Cargo.toml
├── frontend/                   # React frontend (future)
├── notebooks/                  # Saved notebook files
├── prompts/                    # LLM prompt templates
├── .env                        # Environment variables
└── .gitignore                  # Git exclusions
```

### Your First Research Session

1. **Start the research assistant:**
```bash
cargo run -p cedar-core --bin research
```

2. **Describe your goal:**
```
🧑 What do you want to research?
> Find the top 3 product categories associated with churn
```

3. **Watch Cedar work:**
```
🧠 Cedar Research Assistant

📝 PLAN:
- [PLAN] Load customer dataset and examine structure
- [CODE] import pandas as pd; df = pd.read_csv('customers.csv')
- [PLAN] Identify churn indicators and filter data
- [CODE] churned = df[df['churn'] == 1]
- [PLAN] Analyze product usage patterns for churned customers
- [CODE] product_usage = churned.groupby('product_category').size().sort_values(ascending=False)

🔧 Step 1: Executing code:
import pandas as pd; df = pd.read_csv('customers.csv')

📊 Output (Text): 
Successfully loaded 10,000 customer records

🔧 Step 2: Executing code:
churned = df[df['churn'] == 1]

📊 Output (Text):
Filtered to 1,200 churned customers

🔧 Step 3: Executing code:
product_usage = churned.groupby('product_category').size().sort_values(ascending=False)

📊 Output (Table):
| Product Category | Churned Customers |
|------------------|-------------------|
| Electronics      | 450               |
| Clothing         | 320               |
| Home & Garden    | 280               |
| Books            | 150               |
```

---

## 🔧 Advanced Features

### Custom Dataset Integration

Cedar can work with your existing datasets through manifest files:

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetManifest {
    pub name: String,
    pub source: String,
    pub query: String,
    pub record_count: Option<u64>,
    pub description: Option<String>,
    pub created_unix: u64,
}
```

### Code Preprocessing

Cedar automatically wraps standalone expressions with `print()` for visibility:

```rust
pub fn preprocess(code: &str) -> String {
    let mut lines: Vec<String> = code.lines().map(|s| s.to_string()).collect();
    if let Some(last_line) = lines.last().cloned() {
        let stripped = last_line.trim();
        
        // Skip if already a print, assignment, def, or import
        let is_expression = !stripped.starts_with("print")
            && !stripped.starts_with("def ")
            && !stripped.starts_with("import")
            && !stripped.contains('=');

        if is_expression {
            lines.pop();
            lines.push(format!("print({})", stripped));
        }
    }
    
    lines.join("\n")
}
```

### Output Parsing

Cedar intelligently parses Python output into structured formats:

```rust
pub fn parse_output(output: &str, is_error: bool) -> (OutputType, String) {
    if is_error {
        return (OutputType::Error, output.to_string());
    }
    
    // Try to parse as JSON
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(output) {
        return (OutputType::Json, serde_json::to_string_pretty(&json).unwrap());
    }
    
    // Try to parse as table
    if output.contains('|') && output.lines().count() > 2 {
        return (OutputType::Table, output.to_string());
    }
    
    // Default to text
    (OutputType::Text, output.to_string())
}
```

---

## 🎯 Why These Design Choices?

### 1. **Session Persistence Over Chat**

Unlike ChatGPT, Cedar maintains full Python session state. This means:
- Variables persist between cells
- Large datasets don't need to be reloaded
- Complex workflows can span multiple interactions

### 2. **Structured Over Free-form**

We use JSON responses instead of natural language because:
- **Reliability**: No parsing ambiguities
- **Type Safety**: Rust can validate the structure
- **Consistency**: Predictable output format
- **Extensibility**: Easy to add new fields

### 3. **Rust Backend Over Pure Python**

While Python is great for data science, Rust provides:
- **Performance**: Faster startup and execution
- **Safety**: Memory-safe process management
- **Distribution**: Single binary deployment
- **Concurrency**: Async execution with tokio

### 4. **Incremental Over Batch**

Cedar executes code incrementally rather than in one batch because:
- **Feedback**: Users can see progress and intervene
- **Debugging**: Easier to identify where things go wrong
- **Iteration**: Can modify approach based on intermediate results
- **Memory**: Doesn't load everything into memory at once

---

## 🔮 What's Next?

### Short Term
- [ ] **Web UI**: React frontend with real-time cell updates
- [ ] **Chart Integration**: Automatic visualization of data outputs
- [ ] **Export Options**: PDF reports, Jupyter notebooks, markdown
- [ ] **Plugin System**: Custom data connectors and processors

### Medium Term
- [ ] **Collaborative Editing**: Real-time multi-user notebooks
- [ ] **Version Control**: Git integration for notebook history
- [ ] **Cloud Deployment**: Hosted Cedar instances
- [ ] **Advanced LLMs**: Claude, local models, custom fine-tuned models

### Long Term
- [ ] **Multi-language Support**: R, Julia, SQL execution
- [ ] **Distributed Computing**: Spark, Dask integration
- [ ] **ML Pipeline Integration**: AutoML, model training workflows
- [ ] **Enterprise Features**: RBAC, audit logs, compliance

---

## 🤝 Contributing

Cedar is built in the open, and we welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Run the test suite**: `cargo test`
5. **Submit a pull request**

### Development Setup

```bash
# Install dependencies
cargo build

# Run tests
cargo test

# Run linter
cargo clippy

# Format code
cargo fmt
```

### Areas We'd Love Help With

- **Frontend Development**: React/TypeScript UI components
- **LLM Integration**: Support for additional models and providers
- **Data Connectors**: Database adapters, API integrations
- **Documentation**: Tutorials, examples, API docs
- **Testing**: Unit tests, integration tests, performance benchmarks

---

## 📚 Learn More

- **Architecture Deep Dive**: [docs/architecture.md](docs/architecture.md)
- **API Reference**: [docs/api.md](docs/api.md)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with ❤️ by the Cedar team. Questions? Open an issue or join our [Discord](https://discord.gg/cedar).*


