import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ErrorBoundary } from './App.tsx'
import './index.css'

// Set up comprehensive logging to files
const setupLogging = () => {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;

  const logToFile = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    // const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    // Simple localStorage logging to avoid file download issues
    try {
      const logs = JSON.parse(localStorage.getItem('cedar-logs') || '[]');
      logs.push({ timestamp, level, message });
      localStorage.setItem('cedar-logs', JSON.stringify(logs.slice(-1000))); // Keep last 1000 logs
    } catch (e) {
      // If localStorage fails, just continue without logging
    }
  };

  console.log = (...args) => {
    originalConsoleLog(...args);
    logToFile('LOG', ...args);
  };

  console.error = (...args) => {
    originalConsoleError(...args);
    logToFile('ERROR', ...args);
  };

  console.warn = (...args) => {
    originalConsoleWarn(...args);
    logToFile('WARN', ...args);
  };

  console.info = (...args) => {
    originalConsoleInfo(...args);
    logToFile('INFO', ...args);
  };

  console.debug = (...args) => {
    originalConsoleDebug(...args);
    logToFile('DEBUG', ...args);
  };

  // Log unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled Error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
  });

  // Log when the app starts
  console.log('🚀 Cedar Frontend Application Starting...');
  console.log('📅 Start Time:', new Date().toISOString());
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('📱 Screen Size:', `${window.screen.width}x${window.screen.height}`);
  console.log('🖥️ Window Size:', `${window.innerWidth}x${window.innerHeight}`);
};

// Initialize logging
setupLogging();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
) 