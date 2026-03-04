/**
 * 提供者注册表
 * 管理所有技能提供者的注册和查找
 */

import type { Provider } from '../types.js';

/**
 * 已注册的提供者
 */
const registeredProviders: Map<string, Provider> = new Map();

/**
 * 注册提供者
 */
export function registerProvider(provider: Provider): void {
  if (registeredProviders.has(provider.id)) {
    throw new Error(`提供者已存在: ${provider.id}`);
  }
  registeredProviders.set(provider.id, provider);
}

/**
 * 取消注册提供者
 */
export function unregisterProvider(providerId: string): void {
  registeredProviders.delete(providerId);
}

/**
 * 获取提供者
 */
export function getProvider(providerId: string): Provider | undefined {
  return registeredProviders.get(providerId);
}

/**
 * 获取所有提供者
 */
export function getAllProviders(): Provider[] {
  return Array.from(registeredProviders.values());
}

/**
 * 根据源查找匹配的提供者
 */
export function findProvider(source: string): Provider | undefined {
  for (const provider of registeredProviders.values()) {
    if (provider.match(source)) {
      return provider;
    }
  }
  return undefined;
}

/**
 * 清空所有提供者
 */
export function clearProviders(): void {
  registeredProviders.clear();
}

/**
 * 检查提供者是否已注册
 */
export function hasProvider(providerId: string): boolean {
  return registeredProviders.has(providerId);
}
