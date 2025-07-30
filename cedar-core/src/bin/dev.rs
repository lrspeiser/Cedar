use std::fs;
use std::path::Path;

use cedar::{
    agent,
    cell::{CellOrigin, CellType, NotebookCell},
    deps,
    executor,
    notebook::Notebook,
    output_parser,
};

#[tokio::main]
async fn main() -> Result<(), String> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    println!("🧠 Cedar CLI Dev Runner");

    // Ensure notebooks/ folder exists
    let notebook_dir = Path::new("notebooks");
    if !notebook_dir.exists() {
        fs::create_dir_all(notebook_dir).map_err(|e| format!("Failed to create notebook dir: {}", e))?;
    }

    // Load sample notebook or start fresh
    let notebook_path = notebook_dir.join("sample.json");
    let mut notebook = match Notebook::load_from_file(&notebook_path) {
        Ok(nb) => {
            println!("📖 Loaded existing notebook from sample.json");
            nb
        }
        Err(_) => {
            println!("🆕 Starting new notebook...");
            Notebook::new("Scratchpad")
        }
    };

    // 1. User's high-level goal
    let goal = "Find the top 3 product categories associated with churn";
    println!("\n🎯 Goal: {goal}");
    let plan_cell = agent::generate_plan_from_goal(goal).await?;
    println!("\n📝 Plan:\n{}", plan_cell.content);
    notebook.add_cell(plan_cell.clone());

    // 2. Get first plan step
    let step_lines: Vec<&str> = plan_cell
        .content
        .lines()
        .filter_map(|line| line.split_once('.').map(|(_, s)| s.trim()))
        .collect();

    let first_step = step_lines.get(0).unwrap_or(&"Load data");
    println!("\n🔧 Step 1: {first_step}");

    let code_cell = agent::generate_code_for_step(first_step).await?;
    println!("\n💻 Code:\n{}", code_cell.content);
    notebook.add_cell(code_cell.clone());

    // 3. Execute the code
    match executor::run_python_code(&code_cell.content) {
        Ok(stdout) => {
            let (output_type, parsed) = output_parser::parse_output(&stdout, false);
            println!("\n📊 Output ({output_type:?}):\n{parsed}");
        }
        Err(stderr) => {
            println!("\n❌ Initial Python error:\n{stderr}");

            if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                println!("✅ Retrying after installing: {pkg}");
                let retry = executor::run_python_code(&code_cell.content)?;
                let (output_type, parsed) = output_parser::parse_output(&retry, false);
                println!("\n📊 Output after retry ({output_type:?}):\n{parsed}");
            } else {
                println!("🚫 Failed to recover from Python error.");
            }
        }
    }

    // 4. Save updated notebook
    let out_path = notebook_dir.join("dev_run.json");
    notebook.save_to_file(&out_path)?;
    println!("\n💾 Notebook saved to {}\n", out_path.display());

    Ok(())
}
