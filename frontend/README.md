# Cedar Frontend

A modern React/TypeScript frontend for the Cedar AI Research Assistant.

## Features

- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Real-time Research**: Interactive research sessions with AI assistance
- **Cell-based Interface**: Different cell types for goals, plans, code, outputs, and references
- **Session Management**: Create, save, and manage multiple research sessions
- **Reference System**: Academic references with structured metadata
- **Validation Feedback**: AI-powered validation of research outputs
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool and dev server
- **clsx + tailwind-merge** - Conditional styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── App.tsx         # Main application component
│   ├── ResearchSession.tsx  # Research session interface
│   ├── Sidebar.tsx     # Session management sidebar
│   ├── CellComponent.tsx    # Individual cell rendering
│   └── ReferencePanel.tsx   # References sidebar
├── lib/
│   └── utils.ts        # Utility functions
├── api.ts              # API service for backend communication
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Cell Types

The application supports several cell types:

- **Intent**: Research goals and objectives
- **Plan**: AI-generated research steps
- **Code**: Python code for data analysis
- **Output**: Results from code execution
- **Reference**: Academic references and sources
- **Validation**: AI feedback on outputs

## Development

### Adding New Cell Types

1. Update the `Cell` interface in `App.tsx`
2. Add rendering logic in `CellComponent.tsx`
3. Update the `getCellIcon`, `getCellTitle`, and `getCellStyles` functions
4. Add any new styling in `index.css`

### Styling

The application uses Tailwind CSS with custom Cedar colors:

- `cedar-50` through `cedar-900` - Primary brand colors
- Custom component classes in `index.css`
- Responsive design utilities

### API Integration

The `api.ts` file contains the API service for communicating with the Rust backend. Currently uses mock data for development, but can be easily connected to real endpoints.

## Tauri Integration

This frontend is designed to work with Tauri for desktop applications. The build output (`dist/`) is configured to work with the Tauri bundler.

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add appropriate types for all functions and components
4. Test your changes in the development environment

## License

Same as the main Cedar project. 