/**
 * 初始化模块
 * 确保所有提供者都已注册
 */

import { registerDefaultProviders } from './providers/index.js';
import { initLoggerFromConfig } from './logger.js';

let initialized = false;

/**
 * 初始化应用
 */
export async function initApp(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    // 注册默认提供者
    registerDefaultProviders();

    // 初始化日志
    await initLoggerFromConfig();

    initialized = true;
  } catch (error) {
    console.error('初始化应用时出错:', error);
    throw error;
  }
}

/**
 * 检查是否已初始化
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * 重置初始化状态（主要用于测试）
 */
export function resetInitialization(): void {
  initialized = false;
}
