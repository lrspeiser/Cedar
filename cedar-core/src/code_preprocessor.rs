/// Preprocess Python code:
/// - If last line is a bare expression: wrap it with print(...)
/// - If last line is an assignment: append print(var)
pub fn preprocess(code: &str) -> String {
    let mut lines: Vec<String> = code.lines().map(|l| l.to_string()).collect();

    if let Some(last_line) = lines.last().cloned() {
        let stripped = last_line.trim();

        let is_expression = !stripped.starts_with("print")
            && !stripped.starts_with("def ")
            && !stripped.starts_with("import")
            && !stripped.contains('=');

        if is_expression {
            lines.pop();
            lines.push(format!("print({})", stripped));
        } else if let Some(var_name) = detect_assignment_variable(stripped) {
            lines.push(format!("print({})", var_name));
        }
    }

    lines.join("\n")
}

/// Detect simple assignment like: `x = ...`
fn detect_assignment_variable(line: &str) -> Option<&str> {
    let parts: Vec<&str> = line.split('=').map(|s| s.trim()).collect();
    if parts.len() == 2 && parts[0].chars().all(|c| c.is_alphanumeric() || c == '_') {
        Some(parts[0])
    } else {
        None
    }
}
