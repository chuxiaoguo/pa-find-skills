/**
 * 日志模块
 */

import type { PingancoderConfig } from './types.js';
import { getGlobalConfigManager } from './config.js';
import { DEFAULT_LOG_LEVEL } from './constants.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogOptions {
  level?: LogLevel;
  timestamp?: boolean;
  color?: boolean;
}

export class Logger {
  private level: LogLevel;
  private timestamp: boolean;
  private color: boolean;

  constructor(options: LogOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.timestamp = options.timestamp ?? true;
    this.color = options.color ?? true;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = this.timestamp ? this.getTimestamp() + ' ' : '';
    const levelStr = this.color ? this.colorizeLevel(level) : `[${level}]`;
    return `${timestamp}${levelStr} ${message}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private colorizeLevel(level: string): string {
    const colors: Record<string, string> = {
      DEBUG: '\x1b[36m', // cyan
      INFO: '\x1b[32m', // green
      WARN: '\x1b[33m', // yellow
      ERROR: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    return `${colors[level] || ''}[${level}]${reset}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

let globalLogger: Logger | null = null;

/**
 * 获取全局日志实例
 */
export function getGlobalLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * 设置全局日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
  const logger = getGlobalLogger();
  logger.setLevel(level);
}

/**
 * 从配置初始化日志
 */
export async function initLoggerFromConfig(): Promise<void> {
  const configManager = getGlobalConfigManager();
  const config = await configManager.load();

  let logLevel = LogLevel.INFO;

  if (config.logLevel) {
    switch (config.logLevel) {
      case 'debug':
        logLevel = LogLevel.DEBUG;
        break;
      case 'info':
        logLevel = LogLevel.INFO;
        break;
      case 'warn':
        logLevel = LogLevel.WARN;
        break;
      case 'error':
        logLevel = LogLevel.ERROR;
        break;
    }
  }

  setGlobalLogLevel(logLevel);
}
