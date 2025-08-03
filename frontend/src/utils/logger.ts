// Simplified logger that saves to localStorage and console

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
  stack?: string;
}

class FrontendLogger {
  private logs: LogEntry[] = [];
  // private logFile: string = 'frontend-errors.log';
  private maxLogs: number = 1000;

  constructor() {
    this.setupGlobalErrorHandling();
    this.setupUnhandledRejectionHandling();
  }

  private setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.error('GlobalError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        stack: event.error?.stack
      });
    });
  }

  private setupUnhandledRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UnhandledRejection', event.reason?.toString() || 'Unknown rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private addLog(level: LogEntry['level'], component: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      stack: data?.stack || new Error().stack
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for immediate visibility
    console[level](`[${component}] ${message}`, data);

    // Save to file periodically
    this.saveLogsToFile();
  }

  info(component: string, message: string, data?: any) {
    this.addLog('info', component, message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.addLog('warn', component, message, data);
  }

  error(component: string, message: string, data?: any) {
    this.addLog('error', component, message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.addLog('debug', component, message, data);
  }

  private async saveLogsToFile() {
    try {
      const logContent = this.logs.map(entry => 
        `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${entry.data ? ` | Data: ${JSON.stringify(entry.data, null, 2)}` : ''}${entry.stack ? ` | Stack: ${entry.stack}` : ''}`
      ).join('\n');

      // Save to localStorage
      localStorage.setItem('cedar-frontend-logs', logContent);
      
      // Also save to a more accessible location for debugging
      localStorage.setItem('cedar-debug-logs', logContent);
      
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    return [...this.logs];
  }

  async clearLogs() {
    this.logs = [];
    await this.saveLogsToFile();
  }

  async exportLogs(): Promise<string> {
    const logContent = this.logs.map(entry => 
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${entry.data ? ` | Data: ${JSON.stringify(entry.data, null, 2)}` : ''}${entry.stack ? ` | Stack: ${entry.stack}` : ''}`
    ).join('\n');
    
    return logContent;
  }
}

// Create a global logger instance
export const logger = new FrontendLogger();

// Export the logger class for testing
export { FrontendLogger };

// Add logger to window for debugging
declare global {
  interface Window {
    logger: FrontendLogger;
  }
}

window.logger = logger; 