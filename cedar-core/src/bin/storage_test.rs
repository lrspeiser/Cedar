use cedar::storage;

fn main() -> Result<(), String> {
    println!("📦 Cedar Storage Test CLI");

    // Simulate a real dataset scenario
    let dataset_name = "gaia outer disk";
    let query = "SELECT * FROM gaia WHERE distance BETWEEN 5 AND 20";
    let source = "ESA Gaia DR3";

    println!("🛠 Creating manifest for: {}", dataset_name);

    let manifest = storage::create_manifest(
        dataset_name,
        source,
        query,
        Some(124000),
        Some("Chunked in 1M rows; covers galactic plane"),
    );

    manifest.save()?;

    println!("✅ Manifest saved to: {}", manifest.path().display());

    // Load it back from disk
    if let Some(loaded) = storage::load_manifest(dataset_name) {
        println!(
            "🔍 Loaded manifest: [{}] rows={}, created_at={}",
            loaded.name,
            loaded.record_count.unwrap_or(0),
            loaded.created_unix
        );
    } else {
        println!("⚠️ Could not reload saved manifest.");
    }

    Ok(())
}
