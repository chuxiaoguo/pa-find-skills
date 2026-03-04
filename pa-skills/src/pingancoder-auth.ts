/**
 * Pingancoder 认证模块
 * 处理内网 API 的认证和会话管理
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { AuthSession, PingancoderConfig } from './types.js';
import { AUTH_DEFAULT_PATH, TOKEN_EXPIRY_BUFFER, DEFAULT_TOKEN_EXPIRY } from './constants.js';

/**
 * 认证管理器类
 */
export class AuthManager {
  private config: PingancoderConfig;
  private session: AuthSession | null = null;

  constructor(config?: Partial<PingancoderConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.PINGANCODER_API_URL || 'http://internal-server/api',
      downloadBaseUrl: config?.downloadBaseUrl,
      username: config?.username,
      password: config?.password,
      tokenPath: config?.tokenPath || AUTH_DEFAULT_PATH,
      timeout: config?.timeout || 10000,
    };
  }

  /**
   * 从文件加载会话
   */
  async loadSession(): Promise<AuthSession | null> {
    try {
      if (!existsSync(this.config.tokenPath)) {
        return null;
      }

      const content = await readFile(this.config.tokenPath, 'utf-8');
      const session = JSON.parse(content) as AuthSession;

      // 验证会话是否有效
      if (!this.isSessionValid(session)) {
        await this.clearSession();
        return null;
      }

      this.session = session;
      return session;
    } catch {
      return null;
    }
  }

  /**
   * 保存会话到文件
   */
  async saveSession(session: AuthSession): Promise<void> {
    try {
      const dir = join(this.config.tokenPath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(this.config.tokenPath, JSON.stringify(session, null, 2), 'utf-8');
      this.session = session;
    } catch (error) {
      throw new Error(`保存认证信息失败: ${error}`);
    }
  }

  /**
   * 清除会话
   */
  async clearSession(): Promise<void> {
    this.session = null;
    // Note: 不删除文件，只清空内存中的会话
    // 文件会在下次登录时被覆盖
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid(session?: AuthSession): boolean {
    const currentSession = session || this.session;
    if (!currentSession) {
      return false;
    }

    const now = Date.now();
    return currentSession.expiresAt > now + TOKEN_EXPIRY_BUFFER;
  }

  /**
   * 获取当前 Token
   */
  async getToken(): Promise<string> {
    // 先从内存获取
    if (this.session && this.isSessionValid()) {
      return this.session.token;
    }

    // 从文件加载
    const session = await this.loadSession();
    if (session && this.isSessionValid(session)) {
      return session.token;
    }

    throw new Error('未登录或认证已过期，请先使用 `pa-skills auth login` 登录');
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<AuthSession> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('用户名或密码错误');
        }
        throw new Error(`登录失败: ${response.statusText}`);
      }

      const data = await response.json();

      const session: AuthSession = {
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn || DEFAULT_TOKEN_EXPIRY),
        username: data.username || username,
      };

      await this.saveSession(session);
      return session;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('登录超时，请检查网络连接');
        }
        if (error.message.includes('fetch')) {
          throw new Error('无法连接到认证服务器，请检查网络或配置');
        }
        throw error;
      }
      throw new Error('登录失败');
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      const token = await this.getToken();

      await fetch(`${this.config.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });
    } catch {
      // 即使登出请求失败，也清除本地会话
    } finally {
      await this.clearSession();
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<AuthSession> {
    try {
      const currentToken = await this.getToken();

      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 10000),
      });

      if (!response.ok) {
        throw new Error('刷新 Token 失败');
      }

      const data = await response.json();

      const session: AuthSession = {
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn || DEFAULT_TOKEN_EXPIRY),
        username: data.username || this.session?.username || '',
      };

      await this.saveSession(session);
      return session;
    } catch {
      // 如果刷新失败，尝试使用用户名密码重新登录
      if (this.config.username && this.config.password) {
        return this.login(this.config.username, this.config.password);
      }
      throw new Error('刷新 Token 失败，请重新登录');
    }
  }

  /**
   * 获取带认证的请求头
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 获取认证状态
   */
  async getStatus(): Promise<{
    authenticated: boolean;
    username?: string;
    expiresAt?: number;
  }> {
    try {
      const session = await this.loadSession();
      if (!session) {
        return { authenticated: false };
      }

      return {
        authenticated: this.isSessionValid(session),
        username: session.username,
        expiresAt: session.expiresAt,
      };
    } catch {
      return { authenticated: false };
    }
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<PingancoderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): PingancoderConfig {
    return { ...this.config };
  }
}

/**
 * 创建默认的认证管理器实例
 */
export function createAuthManager(config?: Partial<PingancoderConfig>): AuthManager {
  return new AuthManager(config);
}

/**
 * 全局共享的认证管理器实例
 */
let globalAuthManager: AuthManager | null = null;

/**
 * 获取全局认证管理器
 */
export function getGlobalAuthManager(): AuthManager {
  if (!globalAuthManager) {
    globalAuthManager = new AuthManager();
  }
  return globalAuthManager;
}

/**
 * 重置全局认证管理器
 */
export function resetGlobalAuthManager(): void {
  globalAuthManager = null;
}
