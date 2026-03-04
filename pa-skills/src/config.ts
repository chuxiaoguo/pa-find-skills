/**
 * Pingancoder 配置管理模块
 * 管理项目级和全局级配置
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { PingancoderConfig } from './types.js';
import {
  CONFIG_DEFAULT_PATH,
  DEFAULT_API_BASE_URL,
  DEFAULT_DOWNLOAD_TIMEOUT,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_FILE,
  DEFAULT_UPDATE_INTERVAL,
  DEFAULT_INSTALL_MODE,
} from './constants.js';

/**
 * 配置管理器类
 */
export class ConfigManager {
  private projectConfigPath: string;
  private globalConfigPath: string;
  private config: PingancoderConfig | null = null;

  constructor(cwd: string = process.cwd()) {
    this.projectConfigPath = join(cwd, '.pingancoder', 'config.json');
    this.globalConfigPath = CONFIG_DEFAULT_PATH;
  }

  /**
   * 加载配置（按优先级：环境变量 > 项目配置 > 全局配置 > 默认配置）
   */
  async load(): Promise<PingancoderConfig> {
    if (this.config) {
      return this.config;
    }

    const defaultConfig = this.getDefaultConfig();
    let globalConfig = {};
    let projectConfig = {};

    // 加载全局配置
    if (existsSync(this.globalConfigPath)) {
      try {
        const content = await readFile(this.globalConfigPath, 'utf-8');
        globalConfig = JSON.parse(content);
      } catch (error) {
        console.warn(`无法读取全局配置文件: ${error}`);
      }
    }

    // 加载项目配置
    if (existsSync(this.projectConfigPath)) {
      try {
        const content = await readFile(this.projectConfigPath, 'utf-8');
        projectConfig = JSON.parse(content);
      } catch (error) {
        console.warn(`无法读取项目配置文件: ${error}`);
      }
    }

    // 合并配置
    this.config = {
      ...defaultConfig,
      ...globalConfig,
      ...projectConfig,
      // 环境变量优先级最高
      baseUrl: process.env.PINGANCODER_API_URL || this.getValue('baseUrl', defaultConfig, globalConfig, projectConfig),
      downloadBaseUrl: process.env.PINGANCODER_DOWNLOAD_URL || this.getValue('downloadBaseUrl', defaultConfig, globalConfig, projectConfig),
      timeout: parseInt(process.env.PINGANCODER_TIMEOUT || '') || this.getValue('timeout', defaultConfig, globalConfig, projectConfig),
    };

    return this.config;
  }

  /**
   * 保存配置到全局配置文件
   */
  async saveGlobal(config: Partial<PingancoderConfig>): Promise<void> {
    const currentConfig = await this.load();
    const newConfig = { ...currentConfig, ...config };

    try {
      const dir = join(this.globalConfigPath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(this.globalConfigPath, JSON.stringify(newConfig, null, 2), 'utf-8');
      this.config = newConfig;
    } catch (error) {
      throw new Error(`保存配置失败: ${error}`);
    }
  }

  /**
   * 保存配置到项目配置文件
   */
  async saveProject(config: Partial<PingancoderConfig>): Promise<void> {
    const currentConfig = await this.load();
    const newConfig = { ...currentConfig, ...config };

    try {
      const dir = join(this.projectConfigPath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(this.projectConfigPath, JSON.stringify(newConfig, null, 2), 'utf-8');
      this.config = newConfig;
    } catch (error) {
      throw new Error(`保存项目配置失败: ${error}`);
    }
  }

  /**
   * 获取配置项
   */
  async get<K extends keyof PingancoderConfig>(key: K): Promise<PingancoderConfig[K]> {
    const config = await this.load();
    return config[key];
  }

  /**
   * 设置配置项
   */
  async set<K extends keyof PingancoderConfig>(key: K, value: PingancoderConfig[K]): Promise<void> {
    const config = await this.load();
    config[key] = value;
    await this.saveGlobal(config);
  }

  /**
   * 重置配置
   */
  async reset(): Promise<void> {
    this.config = this.getDefaultConfig();
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): PingancoderConfig {
    return {
      baseUrl: DEFAULT_API_BASE_URL,
      downloadBaseUrl: undefined,
      timeout: DEFAULT_DOWNLOAD_TIMEOUT,
      tokenPath: join(homedir(), '.pingancoder', 'auth.json'),
    };
  }

  /**
   * 按优先级获取配置值
   */
  private getValue(key: keyof PingancoderConfig, ...configs: Partial<PingancoderConfig>[]): any {
    for (const config of configs) {
      if (key in config && config[key] !== undefined) {
        return config[key];
      }
    }
    return undefined;
  }

  /**
   * 获取 API 基础 URL
   */
  async getApiBaseUrl(): Promise<string> {
    const config = await this.load();
    return config.baseUrl;
  }

  /**
   * 获取下载基础 URL
   */
  async getDownloadBaseUrl(): Promise<string> {
    const config = await this.load();
    return config.downloadBaseUrl || config.baseUrl;
  }

  /**
   * 获取请求超时时间
   */
  async getTimeout(): Promise<number> {
    const config = await this.load();
    return config.timeout || DEFAULT_DOWNLOAD_TIMEOUT;
  }
}

/**
 * 全局配置管理器实例
 */
let globalConfigManager: ConfigManager | null = null;

/**
 * 获取全局配置管理器
 */
export function getGlobalConfigManager(): ConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new ConfigManager();
  }
  return globalConfigManager;
}

/**
 * 重置全局配置管理器
 */
export function resetGlobalConfigManager(): void {
  globalConfigManager = null;
}

/**
 * 快捷函数：获取配置
 */
export async function getConfig(): Promise<PingancoderConfig> {
  return getGlobalConfigManager().load();
}

/**
 * 快捷函数：获取配置项
 */
export async function getConfigValue<K extends keyof PingancoderConfig>(
  key: K
): Promise<PingancoderConfig[K]> {
  return getGlobalConfigManager().get(key);
}

/**
 * 快捷函数：设置配置项
 */
export async function setConfigValue<K extends keyof PingancoderConfig>(
  key: K,
  value: PingancoderConfig[K]
): Promise<void> {
  return getGlobalConfigManager().set(key, value);
}
