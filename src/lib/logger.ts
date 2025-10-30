type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
  requestId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info"

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.logLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, userId, requestId } = entry
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (userId) logMessage += ` | User: ${userId}`
    if (requestId) logMessage += ` | Request: ${requestId}`
    if (context) logMessage += ` | Context: ${JSON.stringify(context)}`
    
    return logMessage
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    const formattedLog = this.formatLog(entry)

    // In development, use console methods for better formatting
    if (this.isDevelopment) {
      switch (level) {
        case "debug":
          console.debug(formattedLog)
          break
        case "info":
          console.info(formattedLog)
          break
        case "warn":
          console.warn(formattedLog)
          break
        case "error":
          console.error(formattedLog)
          break
      }
    } else {
      // In production, use structured logging
      console.log(JSON.stringify(entry))
    }

    // In a real application, you might want to:
    // - Send logs to external service (e.g., Datadog, LogRocket)
    // - Store critical logs in database
    // - Send error alerts to monitoring service
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    }
    this.log("error", message, errorContext)
  }

  // Specialized logging methods
  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      userId,
      duration,
    })
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error(`API ${method} ${path} failed`, error, {
      method,
      path,
      userId,
    })
  }

  transaction(action: string, transactionId: string, userId?: string, context?: Record<string, any>) {
    this.info(`Transaction ${action}`, {
      action,
      transactionId,
      userId,
      ...context,
    })
  }

  security(event: string, userId?: string, context?: Record<string, any>) {
    this.warn(`Security event: ${event}`, {
      event,
      userId,
      ...context,
    })
  }

  performance(operation: string, duration: number, context?: Record<string, any>) {
    const level = duration > 1000 ? "warn" : "info"
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...context,
    })
  }
}

export const logger = new Logger()

// Request logging middleware helper
export function createRequestLogger(userId?: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(message, { ...context, userId }),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(message, { ...context, userId }),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(message, { ...context, userId }),
    error: (message: string, error?: Error | unknown, context?: Record<string, any>) => 
      logger.error(message, error, { ...context, userId }),
  }
}