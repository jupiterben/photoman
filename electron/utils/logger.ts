import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ==================== Log Levels ====================
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ==================== Logger Configuration ====================
interface LoggerConfig {
  level: LogLevel;
  logToFile: boolean;
  logToConsole: boolean;
  logFilePath?: string;
}

class Logger {
  private config: LoggerConfig;
  private logStream?: fs.WriteStream;

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      logToFile: true,
      logToConsole: true,
    };
  }

  /**
   * 初始化日志系统
   */
  public initialize() {
    if (this.config.logToFile) {
      try {
        const userDataPath = app.getPath('userData');
        const logsDir = path.join(userDataPath, 'logs');

        // 创建logs目录
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        // 生成日志文件名（包含日期）
        const today = new Date().toISOString().split('T')[0];
        const logFileName = `photoman-${today}.log`;
        this.config.logFilePath = path.join(logsDir, logFileName);

        // 创建写入流
        this.logStream = fs.createWriteStream(this.config.logFilePath, { flags: 'a' });

        this.info('[Logger] Initialized successfully', { logFilePath: this.config.logFilePath });
      } catch (error) {
        console.error('[Logger] Failed to initialize file logging:', error);
        this.config.logToFile = false;
      }
    }
  }

  /**
   * 关闭日志系统
   */
  public close() {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = undefined;
    }
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: LogLevel) {
    this.config.level = level;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  /**
   * 写入日志
   */
  private log(level: LogLevel, levelName: string, message: string, data?: any) {
    if (level < this.config.level) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, data);

    // 输出到控制台
    if (this.config.logToConsole) {
      const consoleMethod = level >= LogLevel.ERROR ? 'error' : level >= LogLevel.WARN ? 'warn' : 'log';
      console[consoleMethod](formattedMessage);
    }

    // 写入文件
    if (this.config.logToFile && this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  /**
   * Debug级别日志
   */
  public debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  /**
   * Info级别日志
   */
  public info(message: string, data?: any) {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  /**
   * Warning级别日志
   */
  public warn(message: string, data?: any) {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  /**
   * Error级别日志
   */
  public error(message: string, error?: any) {
    const errorData = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;

    this.log(LogLevel.ERROR, 'ERROR', message, errorData);
  }
}

// ==================== Singleton Logger Instance ====================
export const logger = new Logger();

// ==================== Convenience Functions ====================
export function logDebug(message: string, data?: any) {
  logger.debug(message, data);
}

export function logInfo(message: string, data?: any) {
  logger.info(message, data);
}

export function logWarn(message: string, data?: any) {
  logger.warn(message, data);
}

export function logError(message: string, error?: any) {
  logger.error(message, error);
}


