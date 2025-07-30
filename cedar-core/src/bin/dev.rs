use std::fs;
use std::path::Path;

use cedar::{
    agent,
    context::NotebookContext,
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

    // Create context for the session
    let mut context = NotebookContext::new();

    // 1. User's high-level goal
    let goal = "Find the top 3 product categories associated with churn";
    println!("\n🎯 Goal: {goal}");
    let plan_cells = agent::generate_plan_from_goal(goal, &mut context).await?;
    println!("\n📝 Plan:");
    for cell in &plan_cells {
        println!("- [{}] {}", format!("{:?}", cell.cell_type).to_uppercase(), cell.content.trim());
        notebook.add_cell(cell.clone());
    }

    // 2. Execute code cells
    for (i, cell) in plan_cells.iter().enumerate() {
        if cell.cell_type != cedar::cell::CellType::Code {
            continue;
        }

        println!("\n🔧 Step {}: Executing code:", i + 1);
        println!("{}", cell.content);

        match executor::run_python_code(&cell.content) {
            Ok(stdout) => {
                let (output_type, parsed) = output_parser::parse_output(&stdout, false);
                println!("\n📊 Output ({output_type:?}):\n{parsed}");
                
                let output_cell = cedar::cell::NotebookCell::new(
                    cedar::cell::CellType::Output,
                    cedar::cell::CellOrigin::User,
                    &parsed
                );
                notebook.add_cell(output_cell);
            }
            Err(stderr) => {
                println!("\n❌ Python error:\n{stderr}");

                if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                    println!("✅ Retrying after installing: {pkg}");
                    if let Ok(retry) = executor::run_python_code(&cell.content) {
                        let (output_type, parsed) = output_parser::parse_output(&retry, false);
                        println!("\n📊 Output after retry ({output_type:?}):\n{parsed}");
                        
                        let output_cell = cedar::cell::NotebookCell::new(
                            cedar::cell::CellType::Output,
                            cedar::cell::CellOrigin::User,
                            &parsed
                        );
                        notebook.add_cell(output_cell);
                    }
                } else {
                    println!("🚫 Failed to recover from Python error.");
                }
            }
        }
    }

    // 3. Save updated notebook
    let out_path = notebook_dir.join("dev_run.json");
    notebook.save_to_file(&out_path)?;
    println!("\n💾 Notebook saved to {}\n", out_path.display());

    Ok(())
}
