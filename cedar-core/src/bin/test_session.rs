use cedar::{
    executor,
    output_parser,
};

#[tokio::main]
async fn main() -> Result<(), String> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    println!("🧪 Testing Session Management");
    println!("This should show each result only once, not duplicated.");

    let mut session_code = String::new();
    let mut previous_output = String::new();

    // Test cell 1: Define a variable
    let cell1 = "x = 42";
    println!("\n🔧 Cell 1: {}", cell1);
    
    session_code.push_str(cell1);
    session_code.push('\n');
    
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            if !new_output.is_empty() {
                let (output_type, formatted) = output_parser::parse_output(new_output, false);
                println!("📊 Output ({:?}): {}", output_type, formatted);
            }
            previous_output = stdout;
        }
        Err(e) => println!("❌ Error: {}", e),
    }

    // Test cell 2: Use the variable
    let cell2 = "print(x)";
    println!("\n🔧 Cell 2: {}", cell2);
    
    session_code.push_str(cell2);
    session_code.push('\n');
    
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            if !new_output.is_empty() {
                let (output_type, formatted) = output_parser::parse_output(new_output, false);
                println!("📊 Output ({:?}): {}", output_type, formatted);
            }
            previous_output = stdout;
        }
        Err(e) => println!("❌ Error: {}", e),
    }

    // Test cell 3: Another calculation
    let cell3 = "y = x * 2";
    println!("\n🔧 Cell 3: {}", cell3);
    
    session_code.push_str(cell3);
    session_code.push('\n');
    
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            if !new_output.is_empty() {
                let (output_type, formatted) = output_parser::parse_output(new_output, false);
                println!("📊 Output ({:?}): {}", output_type, formatted);
            }
            previous_output = stdout;
        }
        Err(e) => println!("❌ Error: {}", e),
    }

    // Test cell 4: Print the new variable
    let cell4 = "print(y)";
    println!("\n🔧 Cell 4: {}", cell4);
    
    session_code.push_str(cell4);
    session_code.push('\n');
    
    match executor::run_python_code(&session_code) {
        Ok(stdout) => {
            let new_output = if stdout.starts_with(&previous_output) {
                stdout[previous_output.len()..].trim()
            } else {
                &stdout
            };
            
            if !new_output.is_empty() {
                let (output_type, formatted) = output_parser::parse_output(new_output, false);
                println!("📊 Output ({:?}): {}", output_type, formatted);
            }
            previous_output = stdout;
        }
        Err(e) => println!("❌ Error: {}", e),
    }

    println!("\n✅ Session management test completed!");
    Ok(())
} 