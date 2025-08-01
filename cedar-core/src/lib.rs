pub mod agent;
pub mod cell;
pub mod context;
pub mod deps;
pub mod executor;
pub mod llm;
pub mod notebook;
pub mod output_parser;
pub mod code_preprocessor;
pub mod storage;
pub mod publication;

// Re-export key types for easier access
pub use storage::{
    DataFileInfo, ColumnInfo, DataAnalysisRequest, DataAnalysisResponse, 
    ColumnAnalysis, DuckDBTableInfo, DatasetManifest, Visualization,
    list_data_files, save_uploaded_file, generate_data_analysis_script,
    create_duckdb_table, get_table_info_query, get_sample_data_query,
    list_project_visualizations, save_visualization, delete_visualization,
    generate_vega_lite_spec, generate_plotly_spec, validate_vega_lite_spec, validate_plotly_spec
};
