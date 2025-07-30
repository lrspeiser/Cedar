use std::io::{self, Write};
use std::path::Path;

use cedar::{
    agent,
    cell::{CellOrigin, CellType, NotebookCell},
    context::NotebookContext,
    deps,
    executor,
    notebook::Notebook,
    output_parser,
};

use cedar::code_preprocessor;

#[tokio::main]
async fn main() -> Result<(), String> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    println!("🧠 Cedar Research Assistant");

    // Ask the user what they want to study
    print!("\n🧑 What do you want to research?\n> ");
    io::stdout().flush().unwrap();

    let mut goal = String::new();
    io::stdin().read_line(&mut goal).unwrap();
    let goal = goal.trim();

    if goal.is_empty() {
        return Err("No research goal provided.".into());
    }

    // Start notebook
    let mut notebook = Notebook::new(goal);

    // Add intent cell
    let intent_cell = NotebookCell::new(CellType::Intent, CellOrigin::User, goal);
    notebook.add_cell(intent_cell);

    // Create context for the session
    let mut context = NotebookContext::new();

    // Generate plan using LLM (returns structured Vec<NotebookCell>)
    let plan_cells = agent::generate_plan_from_goal(goal, &mut context).await?;
    println!("\n📝 PLAN:");
    for cell in &plan_cells {
        println!(
            "- [{}] {}",
            format!("{:?}", cell.cell_type).to_uppercase(),
            cell.content.trim()
        );
        notebook.add_cell(cell.clone());
    }

    // 🔁 Future: persistent Python session (e.g. PyO3, WASM, or Jupyter)
    // For now, maintain a session by accumulating code and tracking output differences
    let mut session_code = String::new();
    let mut previous_output = String::new();

    // Execute all code cells in order
    for (i, cell) in plan_cells.iter().enumerate() {
        if cell.cell_type != CellType::Code {
            continue;
        }

        println!("\n🔧 Step {}: Executing code:", i + 1);
        println!("{}", cell.content);

        // Preprocess cell to ensure final expression is visible
        let processed = code_preprocessor::preprocess(&cell.content);
        
        // Add this cell's code to the session
        session_code.push_str(&processed);
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
                    let (output_type, formatted) = output_parser::parse_output(new_output, false);
                    println!("\n📊 Output ({:?}):\n{}", output_type, formatted);

                    let output_cell =
                        NotebookCell::new(CellType::Output, CellOrigin::User, &formatted);
                    notebook.add_cell(output_cell);
                }
                
                // Update previous output for next iteration
                previous_output = stdout;
                
                // Update context from executed code
                context.update_from_code(&cell.content);
            }
            Err(stderr) => {
                println!("\n❌ Error:\n{}", stderr);
                if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                    println!("✅ Retrying after installing: {pkg}");

                    if let Ok(retry_stdout) = executor::run_python_code(&session_code) {
                        // Extract only the new output
                        let new_output = if retry_stdout.starts_with(&previous_output) {
                            retry_stdout[previous_output.len()..].trim()
                        } else {
                            &retry_stdout
                        };
                        
                        if !new_output.is_empty() {
                            let (output_type, formatted) =
                                output_parser::parse_output(new_output, false);
                            println!("\n📊 Output after retry ({:?}):\n{}", output_type, formatted);

                            let output_cell =
                                NotebookCell::new(CellType::Output, CellOrigin::User, &formatted);
                            notebook.add_cell(output_cell);
                        }
                        
                        // Update previous output
                        previous_output = retry_stdout;
                        
                        // Update context from executed code
                        context.update_from_code(&cell.content);
                    }
                }
            }
        }
    }

    // Save notebook
    let filename = format!("notebooks/{}.json", slugify(goal));
    notebook.save_to_file(Path::new(&filename))?;
    println!("\n💾 Notebook saved to: {}\n", filename);

    Ok(())
}

fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect()
}
