use crate::cell::{NotebookCell, CellType, ReferenceData};
use crate::llm;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Academic paper structure generated from a research session
#[derive(Debug, Serialize, Deserialize)]
pub struct AcademicPaper {
    pub title: String,
    pub abstract_text: String,
    pub keywords: Vec<String>,
    pub introduction: String,
    pub methodology: String,
    pub results: String,
    pub discussion: String,
    pub conclusion: String,
    pub references: Vec<ReferenceData>,
    pub metadata: PaperMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaperMetadata {
    pub original_goal: String,
    pub session_id: String,
    pub created_at: String,
    pub word_count: usize,
    pub research_duration: Option<String>,
}

impl AcademicPaper {
    /// Create a new academic paper from a research session
    pub fn new(
        original_goal: &str,
        session_id: &str,
        cells: &[NotebookCell],
    ) -> Self {
        Self {
            title: String::new(),
            abstract_text: String::new(),
            keywords: Vec::new(),
            introduction: String::new(),
            methodology: String::new(),
            results: String::new(),
            discussion: String::new(),
            conclusion: String::new(),
            references: Vec::new(),
            metadata: PaperMetadata {
                original_goal: original_goal.to_string(),
                session_id: session_id.to_string(),
                created_at: chrono::Utc::now().to_rfc3339(),
                word_count: 0,
                research_duration: None,
            },
        }
    }

    /// Save the paper to disk
    pub fn save(&self, filename: &str) -> Result<(), String> {
        let papers_dir = Path::new("papers");
        if !papers_dir.exists() {
            fs::create_dir_all(papers_dir)
                .map_err(|e| format!("Failed to create papers directory: {}", e))?;
        }

        let filepath = papers_dir.join(filename);
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize paper: {}", e))?;
        
        fs::write(&filepath, content)
            .map_err(|e| format!("Failed to save paper: {}", e))?;
        
        Ok(())
    }

    /// Generate a markdown version of the paper
    pub fn to_markdown(&self) -> String {
        let mut md = String::new();
        
        // Title
        md.push_str(&format!("# {}\n\n", self.title));
        
        // Abstract
        md.push_str("## Abstract\n\n");
        md.push_str(&self.abstract_text);
        md.push_str("\n\n");
        
        // Keywords
        if !self.keywords.is_empty() {
            md.push_str("**Keywords:** ");
            md.push_str(&self.keywords.join(", "));
            md.push_str("\n\n");
        }
        
        // Introduction
        md.push_str("## Introduction\n\n");
        md.push_str(&self.introduction);
        md.push_str("\n\n");
        
        // Methodology
        md.push_str("## Methodology\n\n");
        md.push_str(&self.methodology);
        md.push_str("\n\n");
        
        // Results
        md.push_str("## Results\n\n");
        md.push_str(&self.results);
        md.push_str("\n\n");
        
        // Discussion
        md.push_str("## Discussion\n\n");
        md.push_str(&self.discussion);
        md.push_str("\n\n");
        
        // Conclusion
        md.push_str("## Conclusion\n\n");
        md.push_str(&self.conclusion);
        md.push_str("\n\n");
        
        // References
        if !self.references.is_empty() {
            md.push_str("## References\n\n");
            for (i, ref_data) in self.references.iter().enumerate() {
                md.push_str(&format!("{}. **{}**", i + 1, ref_data.title));
                if let Some(authors) = &ref_data.authors {
                    md.push_str(&format!(" by {}", authors.join(", ")));
                }
                if let Some(journal) = &ref_data.journal {
                    md.push_str(&format!(", *{}*", journal));
                }
                if let Some(year) = ref_data.year {
                    md.push_str(&format!(", {}", year));
                }
                if let Some(url) = &ref_data.url {
                    md.push_str(&format!(". [Link]({})", url));
                }
                md.push_str("\n");
            }
        }
        
        md
    }
}

/// Generate an academic paper from a research session
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
    
    // Update word count
    paper.metadata.word_count = count_words(&paper.to_markdown());
    
    Ok(paper)
}

/// Extract a summary of the research process and results from cells
fn extract_session_summary(cells: &[NotebookCell]) -> (String, String) {
    let mut process_steps = Vec::new();
    let mut results = Vec::new();
    
    for cell in cells {
        match cell.cell_type {
            CellType::Plan => {
                process_steps.push(format!("- {}", cell.content.trim()));
            }
            CellType::Code => {
                process_steps.push(format!("- Executed: {}", cell.content.trim()));
            }
            CellType::Output => {
                results.push(format!("- Result: {}", cell.content.trim()));
            }
            _ => {}
        }
    }
    
    (process_steps.join("\n"), results.join("\n"))
}

/// Generate a title for the paper
async fn generate_title(goal: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Generate a concise, academic title for a research paper based on this goal:

"{goal}"

Return ONLY the title, no quotes or formatting."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate an abstract for the paper
async fn generate_abstract(goal: &str, results: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write a concise academic abstract (150-250 words) for a research paper.

Research Goal: "{goal}"

Key Results:
{results}

The abstract should include:
- Background/context
- Research objective
- Methodology summary
- Key findings
- Implications

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate keywords for the paper
async fn generate_keywords(goal: &str) -> Result<Vec<String>, String> {
    let prompt = format!(
        r#"Generate 5-8 relevant keywords for an academic paper about:

"{goal}"

Return ONLY a JSON array of strings, no explanations."#
    );
    
    let keywords_json = llm::ask_llm(&prompt).await?;
    serde_json::from_str(&keywords_json)
        .map_err(|e| format!("Failed to parse keywords: {}", e))
}

/// Generate the introduction section
async fn generate_introduction(goal: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write an academic introduction section (300-500 words) for a research paper.

Research Goal: "{goal}"

The introduction should include:
- Background and context
- Problem statement
- Research objectives
- Significance of the study
- Brief overview of methodology

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate the methodology section
async fn generate_methodology(process: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write an academic methodology section (200-400 words) based on this research process:

{process}

The methodology should describe:
- Research approach
- Data collection/analysis methods
- Tools and techniques used
- Step-by-step procedure

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate the results section
async fn generate_results(results: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write an academic results section (200-400 words) based on these findings:

{results}

The results section should:
- Present findings clearly and objectively
- Include relevant data and statistics
- Use appropriate tables/figures descriptions
- Highlight key patterns and trends

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate the discussion section
async fn generate_discussion(goal: &str, results: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write an academic discussion section (300-500 words) for this research.

Research Goal: "{goal}"

Results:
{results}

The discussion should:
- Interpret the findings
- Compare with existing literature
- Discuss implications
- Address limitations
- Suggest future research directions

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Generate the conclusion section
async fn generate_conclusion(goal: &str, results: &str) -> Result<String, String> {
    let prompt = format!(
        r#"Write an academic conclusion section (150-300 words) for this research.

Research Goal: "{goal}"

Key Results:
{results}

The conclusion should:
- Summarize main findings
- Restate research significance
- Provide final thoughts
- Suggest practical implications

Write in formal academic style."#
    );
    
    llm::ask_llm(&prompt).await
}

/// Count words in a text
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
} 