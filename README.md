# Cedar: AI-Powered Research Assistant

Cedar is an intelligent research assistant that combines the power of large language models with interactive code execution to help researchers explore data, run experiments, and generate insights. Built with Rust and React, it provides a modern desktop application experience with robust AI capabilities.

## 🆕 Latest Features

### 📊 **Data Management System**
- **File Upload & Analysis**: Upload CSV, JSON, TSV, and other data files
- **DuckDB Integration**: PostgreSQL-style SQL interface for data querying
- **LLM-Powered Analysis**: AI automatically analyzes data structure and generates insights
- **Data Visualization**: Built-in data exploration and visualization tools
- **Metadata Management**: Comprehensive file metadata and column information

### 🧠 **Enhanced Research Capabilities**
- **Intelligent Step Generation**: AI creates adaptive research plans based on goals
- **Session Persistence**: Research sessions are automatically saved and can be resumed
- **Variable Detection**: Automatic detection and categorization of code variables
- **Library Management**: Smart detection and installation of Python dependencies
- **Academic References**: AI-suggested relevant academic papers and citations

### 📝 **Publication Pipeline**
- **Automatic Write-up Generation**: Complete academic papers from research sessions
- **Structured Output**: Abstract, methodology, results, discussion, and conclusions
- **Reference Integration**: Automatic citation and bibliography generation
- **Multiple Export Formats**: JSON and Markdown export options

### 🎨 **User Experience**
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **macOS Integration**: Proper menu bar icons and native macOS features
- **Real-time Feedback**: Live code execution with immediate results
- **Project Management**: Organize research into projects with goals and metadata

## 🔐 Security & API Keys

**Important**: Cedar is designed with security in mind. Your OpenAI API key is handled securely:

### How API Keys Work
- **No hardcoded keys**: The application never includes API keys in the source code
- **User-provided keys**: Each user provides their own OpenAI API key through the application interface
- **Local storage**: API keys are stored in memory during the application session
- **No server transmission**: Your API key never leaves your local machine
- **Secure input**: The API key input is masked and handled securely

### Getting Your API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Enter it in Cedar's setup screen when you first launch the application

### Security Features
- API keys are stored only in memory (not on disk)
- Keys are automatically cleared when the application closes
- No logging or transmission of API keys
- Secure password field input
- Environment variable isolation

## 🚀 Quick Start

### Prerequisites
- Rust (latest stable)
- Node.js (v18 or later)
- Python 3.8+ with pip
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cedar.git
   cd cedar
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Build and run the application**
   ```bash
   cargo tauri dev
   ```

4. **Set up your API key**
   - When the application launches, you'll see a setup screen
   - Enter your OpenAI API key
   - Click "Set API Key" to continue

## 🏗️ Architecture

Cedar follows a modern desktop application architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Tauri Backend  │◄──►│  Cedar Core     │
│   (TypeScript)   │    │   (Rust)        │    │   (Rust)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Modern UI     │    │   IPC Bridge    │    │   AI Research   │
│   Components    │    │   Commands      │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend**: React with TypeScript, Tailwind CSS, and Lucide icons
- **Backend**: Tauri with Rust for secure desktop integration
- **Core Engine**: Rust-based AI research engine with OpenAI integration
- **Data Management**: DuckDB for efficient data storage and querying
- **IPC**: Secure communication between frontend and backend

## 🧠 Core Features

### Intelligent Research Planning
- **Goal Analysis**: AI analyzes your research goal and creates a structured plan
- **Step Generation**: Automatically generates executable code steps
- **Adaptive Planning**: Plans evolve based on execution results
- **Session Persistence**: Research sessions are automatically saved and can be resumed

### Interactive Code Execution
- **Python Integration**: Seamless Python code execution with real-time output
- **Auto-dependency Management**: Automatically installs missing Python packages
- **Session Management**: Maintains context across code executions
- **Variable Detection**: Automatically detects and categorizes code variables

### Data Management & Analysis
- **File Upload**: Support for CSV, JSON, TSV, Parquet, and Excel files
- **SQL Interface**: PostgreSQL-style queries using DuckDB
- **AI-Powered Analysis**: Automatic data structure analysis and insights
- **Metadata Management**: Comprehensive file and column information
- **Data Visualization**: Built-in plotting and exploration tools

### AI-Powered Validation
- **Output Analysis**: AI validates code execution results
- **Confidence Scoring**: Provides confidence levels for results
- **Issue Detection**: Identifies potential problems and suggests improvements
- **User Guidance**: Recommends next steps based on current progress

### Academic References
- **Smart Citations**: AI suggests relevant academic references
- **Structured Data**: References include titles, authors, journals, DOIs
- **Relevance Scoring**: Each reference includes relevance explanation
- **Automatic Integration**: References are automatically included in publications

### Publication Pipeline
- **Academic Paper Generation**: Creates complete academic papers from research sessions
- **Structured Sections**: Abstract, introduction, methodology, results, discussion, conclusion
- **Reference Integration**: Automatically includes all relevant references
- **Export Options**: JSON and Markdown formats

## 📁 Project Structure

```
Cedar/
├── cedar-core/           # Core Rust research engine
│   ├── src/
│   │   ├── agent.rs      # AI agent and planning
│   │   ├── cell.rs       # Notebook cell types
│   │   ├── context.rs    # Session context management
│   │   ├── executor.rs   # Python code execution
│   │   ├── llm.rs        # OpenAI API integration
│   │   ├── publication.rs # Academic paper generation
│   │   ├── storage.rs    # Data management and storage
│   │   └── ...
│   └── src/bin/          # Command-line tools
├── frontend/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── DataTab.tsx      # Data management interface
│   │   │   ├── ResearchSession.tsx # Research workflow
│   │   │   ├── WriteUpTab.tsx   # Publication interface
│   │   │   └── ...
│   │   ├── api.ts        # Tauri API integration
│   │   └── ...
│   └── ...
├── src-tauri/           # Tauri desktop application
│   ├── src/main.rs      # Backend entry point
│   ├── icons/           # Application icons (including 20x20 menu bar icons)
│   └── ...
├── reference/           # Documentation and reference materials
│   ├── DATA_MANAGEMENT_SYSTEM.md
│   ├── RESEARCH_PLAN_SYSTEM.md
│   ├── TESTING.md
│   └── ...
└── ...
```

## 🔧 Development

### Running in Development Mode
```bash
# Terminal 1: Frontend development server
cd frontend
npm run dev

# Terminal 2: Tauri development
cargo tauri dev
```

### Building for Production
```bash
# Build the application
cargo tauri build

# The built application will be in src-tauri/target/release/
```

### Testing
```bash
# Run all tests
cargo test

# Test specific components
cargo test --lib
cargo test --bin cedar-app

# Test data management functionality
cargo test test_data_management
```

### Testing Core Components
```bash
# Test the research engine
cargo run -p cedar-core --bin research

# Test publication system
cargo run -p cedar-core --bin test_publication

# Test storage system
cargo run -p cedar-core --bin storage_test

# Test data management
node test-data-management.js
```

## 🎯 Example Workflow

### 1. **Start a Research Session**
   - Launch Cedar
   - Click "Start New Research Session"
   - Enter your research goal (e.g., "Analyze customer churn patterns")

### 2. **Upload and Analyze Data**
   - Go to the Data tab
   - Upload your CSV/JSON data files
   - AI automatically analyzes data structure and provides insights
   - Use SQL queries to explore your data

### 3. **AI Planning**
   - Cedar analyzes your goal and data
   - Generates a structured research plan
   - Suggests relevant academic references
   - Creates executable code steps

### 4. **Interactive Execution**
   - Execute generated code steps
   - View real-time output and visualizations
   - AI validates results and suggests improvements
   - Variables are automatically detected and categorized

### 5. **Iterative Refinement**
   - Modify code based on AI feedback
   - Add new analysis steps
   - Explore different approaches
   - Session is automatically saved

### 6. **Publication**
   - Generate complete academic paper
   - Export in multiple formats (JSON, Markdown)
   - Include all references and methodology
   - Professional academic structure

## 🛠️ Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (set via application interface)

### Python Dependencies
Cedar automatically manages Python dependencies. Common packages are pre-installed:
- **Data Analysis**: pandas, numpy, matplotlib, seaborn
- **Machine Learning**: scikit-learn, scipy
- **Development**: jupyter, ipython
- **Additional packages**: Automatically installed as needed

### Data Storage
- **Local Storage**: All data is stored locally on your machine
- **DuckDB**: Efficient SQL database for data management
- **File System**: Organized project and session storage
- **No Cloud Dependencies**: Your data stays private

## 📚 Documentation

Comprehensive documentation is available in the `reference/` directory:

- **[Data Management System](reference/DATA_MANAGEMENT_SYSTEM.md)**: Complete guide to data upload, analysis, and querying
- **[Research Plan System](reference/RESEARCH_PLAN_SYSTEM.md)**: How AI generates and adapts research plans
- **[Testing Guide](reference/TESTING.md)**: Comprehensive testing procedures and examples
- **[Setup Instructions](reference/SETUP.md)**: Detailed setup and configuration guide
- **[API Key Security](reference/API_KEY_SOLUTION.md)**: Security implementation details
- **[Session Persistence](reference/SESSION_PERSISTENCE_IMPLEMENTATION.md)**: How sessions are saved and restored
- **[Variable Detection](reference/ENHANCED_VARIABLE_DETECTION.md)**: Automatic variable categorization
- **[Publication System](reference/AUTOMATIC_WRITE_UP_GENERATION.md)**: Academic paper generation
- **[Library Management](reference/AUTOMATIC_LIBRARY_DETECTION.md)**: Python dependency management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Development Guidelines
- Follow Rust and TypeScript best practices
- Add comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PRs

## 📄 License

MIT License - see LICENSE file for details.

## 🗺️ Roadmap

### Completed ✅
- [x] Core AI research engine
- [x] Data management system with DuckDB
- [x] Session persistence and management
- [x] Automatic variable detection
- [x] Academic reference integration
- [x] Publication pipeline
- [x] macOS menu bar integration
- [x] Comprehensive testing suite

### In Progress 🔄
- [ ] Enhanced visualization capabilities
- [ ] Support for multiple LLM providers
- [ ] Advanced data import/export formats

### Planned 📋
- [ ] Collaborative research sessions
- [ ] Plugin system for custom analysis
- [ ] Cloud synchronization (optional)
- [ ] Mobile companion app
- [ ] Advanced statistical analysis tools
- [ ] Integration with academic databases

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the `reference/` directory for detailed guides
- **Security**: Report security issues privately
- **Testing**: Use the comprehensive test suite in `reference/TESTING.md`

## 🏆 Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| AI Research Planning | ✅ Complete | Intelligent goal analysis and step generation |
| Data Management | ✅ Complete | File upload, DuckDB integration, SQL queries |
| Session Persistence | ✅ Complete | Automatic saving and resuming of research sessions |
| Variable Detection | ✅ Complete | Automatic detection and categorization |
| Academic References | ✅ Complete | AI-suggested relevant papers and citations |
| Publication Pipeline | ✅ Complete | Automatic academic paper generation |
| macOS Integration | ✅ Complete | Native menu bar icons and features |
| Testing Suite | ✅ Complete | Comprehensive unit and integration tests |

---

**Cedar** - Empowering research with AI intelligence.

*Built with ❤️ using Rust, React, and OpenAI*


