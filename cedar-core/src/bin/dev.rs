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

    // 2. Execute code cells with session management
    let mut session_code = String::new();
    let mut previous_output = String::new();
    
    for (i, cell) in plan_cells.iter().enumerate() {
        if cell.cell_type != cedar::cell::CellType::Code {
            continue;
        }

        println!("\n🔧 Step {}: Executing code:", i + 1);
        println!("{}", cell.content);

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
                
                if !new_output.is_empty() {
                    let (output_type, parsed) = output_parser::parse_output(new_output, false);
                    println!("\n📊 Output ({output_type:?}):\n{parsed}");
                    
                    let output_cell = cedar::cell::NotebookCell::new(
                        cedar::cell::CellType::Output,
                        cedar::cell::CellOrigin::User,
                        &parsed
                    );
                    notebook.add_cell(output_cell);
                }
                
                // Update previous output for next iteration
                previous_output = stdout;
            }
            Err(stderr) => {
                println!("\n❌ Python error:\n{stderr}");

                if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                    println!("✅ Retrying after installing: {pkg}");
                    if let Ok(retry) = executor::run_python_code(&session_code) {
                        // Extract only the new output
                        let new_output = if retry.starts_with(&previous_output) {
                            retry[previous_output.len()..].trim()
                        } else {
                            &retry
                        };
                        
                        if !new_output.is_empty() {
                            let (output_type, parsed) = output_parser::parse_output(new_output, false);
                            println!("\n📊 Output after retry ({output_type:?}):\n{parsed}");
                            
                            let output_cell = cedar::cell::NotebookCell::new(
                                cedar::cell::CellType::Output,
                                cedar::cell::CellOrigin::User,
                                &parsed
                            );
                            notebook.add_cell(output_cell);
                        }
                        
                        // Update previous output
                        previous_output = retry;
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
