🌲 Cedar
Cedar is a Rust-native, AI-driven notebook platform designed for goal-oriented data workflows.

Users describe what they want in plain English. Cedar handles:

Planning how to accomplish the task

Generating + executing code

Observing the output

Iterating automatically until the desired outcome is achieved

🔧 Key Features
🧠 LLM-powered agent loop (Plan → Code → Execute → Observe → Revise)

🐍 Auto-installs Python dependencies

📊 Structured outputs (JSON, Markdown, Tables) for reliable AI interpretation

🖥️ Cross-platform UI powered by Tauri + React (macOS-first)

✍️ Notebook file format based on dynamic cell JSON

📁 Project Structure
bash
Copy
Edit
cedar/
├── src/
│   ├── main.rs               # Tauri app entry point
│   ├── agent.rs              # Goal-driven planner and feedback loop (LLM integration)
│   ├── executor.rs           # Runs Python code via subprocess and captures output
│   ├── output_parser.rs      # Parses stdout/stderr into structured formats
│   ├── llm.rs                # OpenAI/Claude API wrapper and prompt logic
│   ├── deps.rs               # Detects import errors, installs missing packages
│   └── cell.rs               # Core cell struct with types: intent, plan, code, output, feedback
│
├── frontend/                 # React or Svelte app (Tauri webview)
│   ├── src/
│   │   ├── App.tsx           # Main notebook UI
│   │   ├── Cell.tsx          # Component for rendering each cell
│   │   ├── Sidebar.tsx       # Logs, tools, chat-like feedback
│   │   └── api.ts            # Interface to call backend Rust APIs
│
├── notebooks/
│   └── sample.json           # Example agentic notebook (list of typed cells)
│
├── prompts/
│   ├── plan.txt              # Prompt template: user goal → plan steps
│   ├── code.txt              # Prompt template: plan step → Python code
│   └── revise.txt            # Prompt template: feedback → cell update
│
├── tauri.conf.json           # Tauri configuration
├── Cargo.toml                # Rust dependencies
└── README.md                 # This file
🧠 Notebook Cell Types
Each cell in Cedar is a typed object in a JSON file:

json
Copy
Edit
{
  "type": "code",             // "intent" | "plan" | "code" | "output" | "feedback"
  "id": "abc123",
  "content": "df.groupby('region').sum()",
  "origin": "ai",             // or "user"
  "execution_result": {...},
  "metadata": {...}
}
🧪 How Cedar Works
🟦 User types a goal:
“Show me the top 5 products causing churn”

🧠 Agent breaks it into a plan:

Load customer data

Filter by churn

Aggregate product usage

Rank by correlation

🧾 Python code is generated per step

📊 Code is executed — output is parsed into structured formats (tables, summaries)

🔁 Agent reflects on the output → decides next step

✍️ User can approve, retry, modify, or change the goal

📦 Setup (Planned)
Full install docs and build scripts coming soon!

bash
Copy
Edit
brew install tauri
cargo tauri dev
🔮 Roadmap
 Basic notebook execution loop

 Support for OpenAI and Claude backends

 Visual cell editor and logs

 Chat feedback refinement

 Versioned notebook file format

 Python environment sandboxing

 Reactive outputs and live charts

🤝 Contributing
We're building Cedar as a clean-sheet rethinking of what a notebook should be in the LLM era.
Pull requests, ideas, and feedback welcome. 🌿

📜 License
MIT License.