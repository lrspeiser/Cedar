use std::io::{self, Write};
use std::path::Path;

use cedar::{
    agent,
    cell::{CellOrigin, CellType, NotebookCell},
    deps,
    executor,
    notebook::Notebook,
    output_parser,
    storage,
};

#[tokio::main]
async fn main() -> Result<(), String> {
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

    // Generate plan using LLM (aware of existing datasets)
    let plan_cell = agent::generate_plan_from_goal(goal).await?;
    println!("\n📝 PLAN:\n{}", plan_cell.content);
    notebook.add_cell(plan_cell.clone());

    // Parse plan into steps
    let steps: Vec<&str> = plan_cell
        .content
        .lines()
        .filter_map(|line| line.split_once('.').map(|(_, s)| s.trim()))
        .collect();

    // For each step, generate + run code
    for (i, step) in steps.iter().enumerate() {
        println!("\n🔧 Step {}: {}", i + 1, step);

        // Generate code for this step
        let code_cell = agent::generate_code_for_step(step).await?;
        println!("\n💻 Code:\n{}", code_cell.content);
        notebook.add_cell(code_cell.clone());

        // Execute it
        match executor::run_python_code(&code_cell.content) {
            Ok(stdout) => {
                let (output_type, formatted) = output_parser::parse_output(&stdout, false);
                println!("\n📊 Output ({:?}):\n{}", output_type, formatted);

                let output_cell = NotebookCell::new(CellType::Output, CellOrigin::User, &formatted);
                notebook.add_cell(output_cell);
            }
            Err(stderr) => {
                println!("\n❌ Error:\n{}", stderr);
                if let Ok(Some(pkg)) = deps::auto_install_if_missing(&stderr) {
                    println!("✅ Retrying after installing: {pkg}");
                    if let Ok(retry_stdout) = executor::run_python_code(&code_cell.content) {
                        let (output_type, formatted) = output_parser::parse_output(&retry_stdout, false);
                        println!("\n📊 Output after retry ({:?}):\n{}", output_type, formatted);

                        let output_cell = NotebookCell::new(CellType::Output, CellOrigin::User, &formatted);
                        notebook.add_cell(output_cell);
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
