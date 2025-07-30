use cedar::{
    cell::{CellOrigin, CellType, NotebookCell, ReferenceData},
    publication,
};

#[tokio::main]
async fn main() -> Result<(), String> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    println!("🧪 Testing Publication System");

    // Create a simple test session
    let goal = "Calculate the mean of numbers 1, 2, 3, 4, 5";
    let session_id = "test_session_123";
    
    // Create some test cells
    let mut cells = Vec::new();
    
    // Add a reference
    let ref_data = ReferenceData {
        title: "Test Reference".to_string(),
        authors: Some(vec!["Test Author".to_string()]),
        journal: Some("Test Journal".to_string()),
        year: Some(2023),
        url: Some("https://example.com".to_string()),
        doi: None,
        r#abstract: Some("A test reference for demonstration".to_string()),
        relevance: Some("Relevant to the test research".to_string()),
    };
    cells.push(NotebookCell::new_reference(CellOrigin::Ai, &ref_data));
    
    // Add a plan cell
    cells.push(NotebookCell::new(CellType::Plan, CellOrigin::Ai, "Define the list of numbers"));
    
    // Add a code cell
    cells.push(NotebookCell::new(CellType::Code, CellOrigin::Ai, "numbers = [1, 2, 3, 4, 5]"));
    
    // Add an output cell
    cells.push(NotebookCell::new(CellType::Output, CellOrigin::User, "[1, 2, 3, 4, 5]"));
    
    // Add another plan cell
    cells.push(NotebookCell::new(CellType::Plan, CellOrigin::Ai, "Calculate the mean"));
    
    // Add another code cell
    cells.push(NotebookCell::new(CellType::Code, CellOrigin::Ai, "mean = sum(numbers) / len(numbers)"));
    
    // Add another output cell
    cells.push(NotebookCell::new(CellType::Output, CellOrigin::User, "3.0"));
    
    println!("📝 Generating academic paper...");
    
    match publication::generate_paper_from_session(goal, session_id, &cells).await {
        Ok(paper) => {
            println!("✅ Paper generated successfully!");
            println!("📊 Paper stats:");
            println!("  • Title: {}", paper.title);
            println!("  • Word count: {}", paper.metadata.word_count);
            println!("  • References: {}", paper.references.len());
            
            // Save as JSON
            let json_filename = "test_paper.json";
            if let Err(e) = paper.save(json_filename) {
                println!("⚠️  Failed to save JSON: {}", e);
            } else {
                println!("💾 JSON saved to: papers/{}", json_filename);
            }
            
            // Save as Markdown
            let md_filename = "test_paper.md";
            let papers_dir = std::path::Path::new("papers");
            if !papers_dir.exists() {
                std::fs::create_dir_all(papers_dir).unwrap_or_default();
            }
            let md_path = papers_dir.join(md_filename);
            if let Err(e) = std::fs::write(&md_path, paper.to_markdown()) {
                println!("⚠️  Failed to save Markdown: {}", e);
            } else {
                println!("💾 Markdown saved to: papers/{}", md_filename);
            }
            
            println!("\n📄 Paper Preview:");
            println!("{}", paper.to_markdown());
            
            println!("\n🎉 Publication test completed successfully!");
        }
        Err(e) => {
            println!("❌ Failed to generate paper: {}", e);
        }
    }

    Ok(())
} 