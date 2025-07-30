# 🌲 Cedar: Building an AI-Native Notebook from Scratch

*How we built a Rust-powered, AI-driven research assistant that thinks like a data scientist and writes like an academic*

---

## 🎯 The Vision

Traditional notebooks are great for exploration, but they're not built for the AI era. What if your notebook could:

- **Understand your research goals** in plain English
- **Plan the entire workflow** automatically  
- **Generate and execute code** step by step
- **Validate results intelligently** and suggest improvements
- **Generate academic references** automatically
- **Publish complete papers** from research sessions
- **Learn from outputs** and iterate intelligently
- **Maintain context** across multiple sessions

That's Cedar. It's not just another Jupyter alternative—it's a complete reimagining of what a research notebook should be when AI is your co-pilot.

---

## 🏗️ Architecture Decisions

### **Why Rust?**
Performance, safety, and cross-platform compatibility. Rust gives us:
- **Memory safety** without garbage collection
- **Concurrent execution** for LLM calls and code execution
- **Cross-platform binaries** that work anywhere
- **Rich ecosystem** for data processing and web APIs

### **Session Management: The Key Innovation**
Unlike traditional notebooks that execute cells in isolation, Cedar maintains **persistent Python sessions**:

```rust
// Session management in research.rs
let mut session_code = String::new();
let mut previous_output = String::new();

for cell in plan_cells.iter().enumerate() {
    if cell.cell_type != CellType::Code {
        continue;
    }
    
    // Add this cell's code to the session
    session_code.push_str(&cell.content);
    session_code.push('\n');
    
    // Execute the full session to maintain state
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            // Extract only the new output by comparing with previous output
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            // Display only new results
            if !new_output.is_empty() {
                let (output_type, formatted) = output_parser::parse_output(new_output, false);
                println!("\n📊 Output ({:?}):\n{}", output_type, formatted);
            }
            
            previous_output = stdout;
        }
        Err(stderr) => {
            // Handle errors with auto-package installation
            if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                println!("✅ Retrying after installing: {pkg}");
                // Retry execution...
            }
        }
    }
}
```

This ensures **no duplicate output** and **proper state persistence** across cells.

### **LLM Integration: Structured Over Chat**
Instead of free-form chat, Cedar uses **structured JSON responses**:

```rust
// Structured plan generation in agent.rs
#[derive(Debug, Deserialize)]
pub struct PlanBundle {
    total_steps: usize,
    steps: Vec<PlanStep>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct PlanStep {
    pub label: String,
    pub description: String,
    pub code: Option<String>,
}

// LLM prompt for structured output
let prompt = format!(
    r#"Return a JSON object with:
- `total_steps`: number of plan steps
- `steps`: list of steps (each with a label, description, optional code)

Each step must include:
- `label`: one of "python", "data", "plot", "discussion"
- `description`: what the step does
- optional `code`: Python code only for executable steps

Do not explain your output. Return valid JSON only."#
);
```

This ensures **reliable parsing** and **consistent structure**.

---

## 🔧 Technical Implementation

### **1. Goal Understanding**
Cedar parses research goals and generates structured plans:

```rust
// Goal parsing and plan generation
pub async fn generate_plan_from_goal(
    goal: &str,
    context: &mut NotebookContext,
) -> Result<Vec<NotebookCell>, String> {
    // Generate structured plan using LLM
    let raw_json = llm::ask_llm(&prompt).await?;
    let parsed: PlanBundle = serde_json::from_str(&raw_json)?;
    
    // Generate academic references
    let references = generate_references_for_goal(goal, &parsed.steps).await?;
    cells.extend(references);
    
    // Convert plan steps to notebook cells
    for step in parsed.steps {
        let desc_cell = NotebookCell::new(CellType::Plan, CellOrigin::Ai, &step.description);
        cells.push(desc_cell);
        
        if let Some(code) = step.code {
            let code_cell = NotebookCell::new(CellType::Code, CellOrigin::Ai, &code);
            cells.push(code_cell);
        }
    }
    
    Ok(cells)
}
```

### **2. Intelligent Validation System**
After each step, Cedar validates results and suggests improvements:

```rust
// Step validation in agent.rs
pub async fn validate_step_output(
    step_description: &str,
    step_code: &str,
    step_output: &str,
    original_goal: &str,
    all_steps: &[PlanStep],
    current_step_index: usize,
) -> Result<StepValidation, String> {
    let prompt = format!(
        r#"Analyze this step's output and determine:

1. Does the output make sense for this step?
2. Does it align with the research goal?
3. Are there any obvious issues (errors, unexpected results, missing data)?
4. What should be the next logical step?

Return ONLY a JSON object with:
{{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "issues": ["list of specific issues found"],
  "suggestions": ["list of improvement suggestions"],
  "next_step_recommendation": "what should happen next",
  "user_action_needed": "continue|revise|restart|ask_user"
}}"#
    );
    
    let raw_json = llm::ask_llm(&prompt).await?;
    let validation: StepValidation = serde_json::from_str(&raw_json)?;
    Ok(validation)
}
```

### **3. Academic Reference Generation**
Cedar automatically generates relevant academic references:

```rust
// Reference generation in agent.rs
async fn generate_references_for_goal(
    goal: &str,
    steps: &[PlanStep],
) -> Result<Vec<NotebookCell>, String> {
    let prompt = format!(
        r#"Given this research goal and plan steps, suggest 3-5 relevant academic references.

Return ONLY a JSON array of reference objects. Each reference should include:
- `title`: Full title of the paper/book/website
- `authors`: Array of author names (if available)
- `journal`: Journal name or publication venue (if applicable)
- `year`: Publication year (if known)
- `url`: URL to the source (if available)
- `doi`: DOI identifier (if available)
- `abstract`: Brief description or abstract (if available)
- `relevance`: Why this reference is relevant to the research goal

Focus on high-quality, peer-reviewed sources when possible."#
    );
    
    let raw_json = llm::ask_llm(&prompt).await?;
    let references: Vec<ReferenceData> = serde_json::from_str(&raw_json)?;
    
    let mut cells = vec![];
    for reference in references {
        let reference_cell = NotebookCell::new_reference(CellOrigin::Ai, &reference);
        cells.push(reference_cell);
    }
    
    Ok(cells)
}
```

### **4. Publication Pipeline**
After successful research, Cedar can generate complete academic papers:

```rust
// Publication system in publication.rs
pub async fn generate_paper_from_session(
    original_goal: &str,
    session_id: &str,
    cells: &[NotebookCell],
) -> Result<AcademicPaper, String> {
    let mut paper = AcademicPaper::new(original_goal, session_id, cells);
    
    // Extract references from cells
    for cell in cells {
        if cell.cell_type == CellType::Reference {
            if let Ok(ref_data) = serde_json::from_str::<ReferenceData>(&cell.content) {
                paper.references.push(ref_data);
            }
        }
    }
    
    // Extract the research process and results
    let (process_summary, results_summary) = extract_session_summary(cells);
    
    // Generate paper sections using LLM
    paper.title = generate_title(original_goal).await?;
    paper.abstract_text = generate_abstract(original_goal, &results_summary).await?;
    paper.keywords = generate_keywords(original_goal).await?;
    paper.introduction = generate_introduction(original_goal).await?;
    paper.methodology = generate_methodology(&process_summary).await?;
    paper.results = generate_results(&results_summary).await?;
    paper.discussion = generate_discussion(original_goal, &results_summary).await?;
    paper.conclusion = generate_conclusion(original_goal, &results_summary).await?;
    
    Ok(paper)
}
```

---

## 🚀 Getting Started

### **Prerequisites**
- Rust 1.70+ and Cargo
- Python 3.8+ with pip
- OpenAI API key

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/cedar.git
cd cedar

# Create environment file
echo "OPENAI_API_KEY=sk-your-real-secret-key" > .env

# Build the project
cargo build -p cedar-core
```

### **Running Cedar**

#### **Interactive Research Assistant**
```bash
cargo run -p cedar-core --bin research
```
This starts an interactive session where you can:
- Enter your research goal in plain English
- Watch Cedar generate a plan with references
- See code execution with intelligent validation
- Choose to publish results as an academic paper

#### **Development Environment**
```bash
cargo run -p cedar-core --bin dev
```
Runs a predefined research workflow for testing and development.

#### **Test Individual Components**
```bash
# Test session management
cargo run -p cedar-core --bin test_session

# Test publication system
cargo run -p cedar-core --bin test_publication

# Test storage functionality
cargo run -p cedar-core --bin storage_test
```

---

## 📊 Example Workflow

### **1. Define Research Goal**
```
🧑 What do you want to research?
> Find the top 3 product categories associated with churn
```

### **2. Automatic Plan Generation**
```
📚 RELEVANT REFERENCES:
--- Reference 1 ---
📖 Title: Customer Churn Prediction Using Machine Learning
👥 Authors: Smith, J., Johnson, A.
📰 Journal: Journal of Marketing Analytics
📅 Year: 2022
🎯 Relevance: Directly addresses churn analysis methodology

📝 PLAN:
- [PLAN] Load the dataset
- [CODE] df = pd.read_csv('churn_data.csv')
- [PLAN] Clean up the data by removing null/missing values
- [CODE] df = df.dropna()
- [PLAN] Create a subset of data containing only churned customers
- [CODE] churned_customers_df = df[df['churn'] == 1]
```

### **3. Intelligent Execution with Validation**
```
🔧 Step 1: Executing code:
df = pd.read_csv('churn_data.csv')

📊 Output (Json):
[1, 2, 3, 4, 5]

🔍 Validating step output...

🔍 VALIDATION RESULTS:
Valid: ✅ Yes
Confidence: 100.0%

🎯 Next step: Proceed to calculate the mean of the list.
Action needed: continue
✅ Continuing to next step...
```

### **4. Publication Opportunity**
```
📄 PUBLICATION OPPORTUNITY
Your research session has been completed successfully!
Would you like to generate an academic paper from this research?
This will create a complete paper including:
  • Abstract and keywords
  • Introduction and methodology
  • Results and discussion
  • Conclusion and references
  • Both JSON and Markdown formats

🤔 Generate academic paper? (y/n): y

📝 Generating academic paper...
✅ Paper generated successfully!
📊 Paper stats:
  • Title: Customer Churn Analysis: Identifying High-Risk Product Categories
  • Word count: 2,847
  • References: 4
💾 JSON saved to: papers/customer_churn_analysis.json
💾 Markdown saved to: papers/customer_churn_analysis.md
```

---

## 🏛️ Project Structure

```
cedar/
├── cedar-core/                 # Main Rust application
│   ├── src/
│   │   ├── agent.rs           # LLM interaction and plan generation
│   │   ├── cell.rs            # Notebook cell types and structures
│   │   ├── context.rs         # Session context and state management
│   │   ├── deps.rs            # Python package auto-installation
│   │   ├── executor.rs        # Python code execution
│   │   ├── llm.rs             # OpenAI API integration
│   │   ├── notebook.rs        # Notebook data structures
│   │   ├── output_parser.rs   # Output formatting and parsing
│   │   ├── publication.rs     # Academic paper generation
│   │   ├── storage.rs         # Dataset and manifest management
│   │   └── bin/               # Executable binaries
│   │       ├── research.rs    # Interactive research assistant
│   │       ├── dev.rs         # Development environment
│   │       ├── test_session.rs # Session management testing
│   │       └── test_publication.rs # Publication system testing
│   └── Cargo.toml             # Rust dependencies
├── frontend/                  # Future web interface
├── notebooks/                 # Saved research sessions
├── papers/                    # Generated academic papers
├── prompts/                   # LLM prompt templates
└── README.md                  # This file
```

---

## 🔬 Key Features

### **🧠 Intelligent Planning**
- **Goal understanding** in natural language
- **Multi-step plan generation** with code suggestions
- **Context-aware planning** based on available data

### **🔍 Smart Validation**
- **Real-time result validation** after each step
- **Intelligent error detection** and suggestions
- **User-controlled feedback loops** (no infinite loops)
- **Confidence scoring** for each validation

### **📚 Academic Integration**
- **Automatic reference generation** from research goals
- **Structured reference data** with metadata
- **Academic paper generation** with full sections
- **Multiple output formats** (JSON, Markdown)

### **⚡ Robust Execution**
- **Persistent Python sessions** with state management
- **Auto-package installation** for missing dependencies
- **Error recovery** with intelligent retry logic
- **Output deduplication** for clean results

### **📄 Publication Pipeline**
- **Complete academic papers** from research sessions
- **Structured sections** (Abstract, Introduction, Methodology, etc.)
- **Reference integration** from research session
- **Professional formatting** for submission

---

## 🛠️ Development

### **Adding New Cell Types**
```rust
// In cell.rs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CellType {
    Intent,
    Plan,
    Code,
    Output,
    Feedback,
    Reference,  // New cell type
}
```

### **Extending Validation Logic**
```rust
// In agent.rs
pub async fn validate_step_output(
    step_description: &str,
    step_code: &str,
    step_output: &str,
    original_goal: &str,
    all_steps: &[PlanStep],
    current_step_index: usize,
) -> Result<StepValidation, String> {
    // Add custom validation logic here
}
```

### **Custom Publication Formats**
```rust
// In publication.rs
impl AcademicPaper {
    pub fn to_latex(&self) -> String {
        // Generate LaTeX format
    }
    
    pub fn to_html(&self) -> String {
        // Generate HTML format
    }
}
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and add tests
4. **Run the test suite** (`cargo test -p cedar-core`)
5. **Submit a pull request**

### **Development Guidelines**
- Follow Rust conventions and use `cargo fmt`
- Add tests for new functionality
- Update documentation for API changes
- Ensure all binaries compile successfully

---

## 📈 Roadmap

### **Phase 1: Core Features** ✅
- [x] Basic notebook functionality
- [x] LLM integration for plan generation
- [x] Python code execution
- [x] Session management
- [x] Reference generation
- [x] Validation system
- [x] Publication pipeline

### **Phase 2: Enhanced Intelligence** 🚧
- [ ] Multi-modal input (images, charts)
- [ ] Advanced error recovery
- [ ] Collaborative research sessions
- [ ] Version control integration
- [ ] Custom prompt templates

### **Phase 3: Platform Features** 📋
- [ ] Web interface
- [ ] Cloud deployment
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Integration with academic databases

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT models that power Cedar's intelligence
- **Rust community** for the excellent ecosystem and tooling
- **Python community** for the rich data science libraries
- **Academic community** for inspiring the publication features

---

*Cedar: Where research meets intelligence, and intelligence meets publication.* 🌲✨


