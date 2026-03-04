/**
 * 提供者入口
 * 导出所有提供者相关模块
 */

export {
  registerProvider,
  unregisterProvider,
  getProvider,
  getAllProviders,
  findProvider,
  clearProviders,
  hasProvider,
} from './registry.js';

export { createPingancoderProvider } from './pingancoder-provider.js';
export { createLocalPathProvider } from './local-path-provider.js';
export { createLocalZipProvider } from './local-zip-provider.js';

import { registerProvider } from './registry.js';
import { createPingancoderProvider } from './pingancoder-provider.js';
import { createLocalPathProvider } from './local-path-provider.js';
import { createLocalZipProvider } from './local-zip-provider.js';

let providersRegistered = false;

/**
 * 注册所有默认提供者
 * 使用标志确保只注册一次
 */
export function registerDefaultProviders(): void {
  if (providersRegistered) {
    return;
  }

  try {
    registerProvider(createPingancoderProvider());
    registerProvider(createLocalPathProvider());
    registerProvider(createLocalZipProvider());
    providersRegistered = true;
  } catch (error) {
    // 如果提供者已注册，忽略错误
    if (error instanceof Error && !error.message.includes('已存在')) {
      console.warn('注册默认提供者时出错:', error.message);
    }
  }
}

// 自动注册默认提供者
registerDefaultProviders();
