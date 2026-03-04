/**
 * Pingancoder API 提供者
 * 从内网 API 获取技能
 */

import type { Provider, RemoteSkill, ParsedSource, PingancoderSkill } from '../types.js';
import { getGlobalAuthManager, createAuthManager } from '../pingancoder-auth.js';
import { getGlobalConfigManager } from '../config.js';
import { ERROR_MESSAGES } from '../constants.js';

/**
 * Pingancoder API 提供者类
 */
class PingancoderProvider implements Provider {
  id = 'pingancoder-api';
  displayName = 'Pingancoder API';
  private authManager = getGlobalAuthManager();
  private configManager = getGlobalConfigManager();

  /**
   * 匹配源是否属于此提供者
   */
  match(source: string): boolean {
    return (
      source.startsWith('pingancoder://') ||
      /^[a-z0-9-]+$/.test(source) // 简单的技能标识符格式
    );
  }

  /**
   * 从 API 获取技能
   */
  async fetchSkill(parsedSource: ParsedSource): Promise<RemoteSkill | null> {
    try {
      const identifier = parsedSource.identifier || parsedSource.url.replace('pingancoder://', '');
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();

      const token = await this.authManager.getToken();

      // 获取技能详情
      const response = await fetch(`${baseUrl}/skills/${encodeURIComponent(identifier)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.SKILL_NOT_FOUND);
        }
        if (response.status === 401) {
          // Token 过期，尝试刷新
          await this.authManager.refreshToken();
          return this.fetchSkill(parsedSource);
        }
        throw new Error(`获取技能失败: ${response.statusText}`);
      }

      const skill = (await response.json()) as PingancoderSkill;

      // 获取技能内容（SKILL.md）
      let content = '';
      try {
        const contentResponse = await fetch(skill.downloadUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (contentResponse.ok) {
          content = await contentResponse.text();
        }
      } catch {
        // 如果无法获取内容，使用默认格式
        content = `---
name: ${skill.name}
description: ${skill.description}
version: ${skill.version}
${skill.category ? `category: ${skill.category}` : ''}
${skill.author ? `author: ${skill.author}` : ''}
---

# ${skill.name}

${skill.description}
`;
      }

      return {
        name: skill.name,
        description: skill.description,
        content,
        installName: skill.id,
        sourceUrl: skill.downloadUrl,
        providerId: this.id,
        sourceIdentifier: 'pingancoder.com',
        metadata: {
          version: skill.version,
          category: skill.category,
          author: skill.author,
          ...skill.metadata,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取技能失败');
    }
  }

  /**
   * 搜索技能
   */
  async searchSkills(query: string, options?: { limit?: number }): Promise<PingancoderSkill[]> {
    try {
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();
      const token = await this.authManager.getToken();

      const params = new URLSearchParams({
        q: query,
        limit: String(options?.limit || 20),
      });

      const response = await fetch(`${baseUrl}/skills/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`搜索技能失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('搜索技能失败');
    }
  }

  /**
   * 获取技能更新信息
   */
  async getUpdateInfo(skillId: string, currentVersion: string): Promise<{ hasUpdate: boolean; latestVersion: string } | null> {
    try {
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();
      const token = await this.authManager.getToken();

      const response = await fetch(`${baseUrl}/skills/${encodeURIComponent(skillId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        return null;
      }

      const skill = (await response.json()) as PingancoderSkill;

      return {
        hasUpdate: skill.version !== currentVersion,
        latestVersion: skill.version,
      };
    } catch {
      return null;
    }
  }
}

/**
 * 创建 Pingancoder 提供者实例
 */
export function createPingancoderProvider(): Provider {
  return new PingancoderProvider();
}
