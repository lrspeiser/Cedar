// src/output_parser.rs

/// OutputType describes what kind of Python result we're seeing
#[derive(Debug)]
pub enum OutputType {
    PlainText,
    TableMarkdown,
    Json,
    Error,
}

/// Parse raw stdout/stderr from Python into something more structured
pub fn parse_output(output: &str, is_error: bool) -> (OutputType, String) {
    let cleaned = output.trim();

    if is_error {
        return (OutputType::Error, format!("❌ Python Error:\n{}", cleaned));
    }

    if looks_like_table(cleaned) {
        (OutputType::TableMarkdown, format!("```\n{}\n```", cleaned))
    } else if looks_like_json(cleaned) {
        (OutputType::Json, cleaned.to_string())
    } else {
        (OutputType::PlainText, cleaned.to_string())
    }
}

/// Simple heuristic: looks like a tabular DataFrame or columnar CLI output
fn looks_like_table(s: &str) -> bool {
    let lines: Vec<&str> = s.lines().collect();
    lines.len() > 2 && lines.iter().all(|l| l.contains("  "))
}

/// Simple heuristic: checks for JSON-like output
fn looks_like_json(s: &str) -> bool {
    s.starts_with('{') || s.starts_with('[')
}
