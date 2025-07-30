# Cedar: AI-Powered Research Assistant

Cedar is an intelligent research assistant that combines the power of large language models with interactive code execution to help researchers explore data, run experiments, and generate insights. Built with Rust and React, it provides a modern desktop application experience with robust AI capabilities.

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
- **IPC**: Secure communication between frontend and backend

## 🧠 Core Features

### Intelligent Research Planning
- **Goal Analysis**: AI analyzes your research goal and creates a structured plan
- **Step Generation**: Automatically generates executable code steps
- **Adaptive Planning**: Plans evolve based on execution results

### Interactive Code Execution
- **Python Integration**: Seamless Python code execution with real-time output
- **Auto-dependency Management**: Automatically installs missing Python packages
- **Session Management**: Maintains context across code executions

### AI-Powered Validation
- **Output Analysis**: AI validates code execution results
- **Confidence Scoring**: Provides confidence levels for results
- **Issue Detection**: Identifies potential problems and suggests improvements
- **User Guidance**: Recommends next steps based on current progress

### Academic References
- **Smart Citations**: AI suggests relevant academic references
- **Structured Data**: References include titles, authors, journals, DOIs
- **Relevance Scoring**: Each reference includes relevance explanation

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
│   │   └── ...
│   └── src/bin/          # Command-line tools
├── frontend/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api.ts        # Tauri API integration
│   │   └── ...
│   └── ...
├── src-tauri/           # Tauri desktop application
│   ├── src/main.rs      # Backend entry point
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

### Testing Core Components
```bash
# Test the research engine
cargo run -p cedar-core --bin research

# Test publication system
cargo run -p cedar-core --bin test_publication

# Test storage system
cargo run -p cedar-core --bin storage_test
```

## 🎯 Example Workflow

1. **Start a Research Session**
   - Launch Cedar
   - Click "Start New Research Session"
   - Enter your research goal

2. **AI Planning**
   - Cedar analyzes your goal
   - Generates a structured research plan
   - Suggests relevant academic references

3. **Interactive Execution**
   - Execute generated code steps
   - View real-time output
   - AI validates results and suggests improvements

4. **Iterative Refinement**
   - Modify code based on AI feedback
   - Add new analysis steps
   - Explore different approaches

5. **Publication**
   - Generate complete academic paper
   - Export in multiple formats
   - Include all references and methodology

## 🛠️ Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (set via application interface)

### Python Dependencies
Cedar automatically manages Python dependencies. Common packages are pre-installed:
- pandas, numpy, matplotlib, seaborn
- scikit-learn, scipy
- jupyter, ipython

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🗺️ Roadmap

- [ ] Enhanced visualization capabilities
- [ ] Support for multiple LLM providers
- [ ] Collaborative research sessions
- [ ] Advanced data import/export
- [ ] Plugin system for custom analysis
- [ ] Cloud synchronization (optional)
- [ ] Mobile companion app

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the code comments and this README
- **Security**: Report security issues privately

---

**Cedar** - Empowering research with AI intelligence.


