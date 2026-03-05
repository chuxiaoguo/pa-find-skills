/**
 * Pingancoder API 提供者
 * 从真实 API 获取技能
 */

import type {
  Provider,
  RemoteSkill,
  ParsedSource,
  PingancoderSkill,
  MarketSkillListResponse,
  MarketSkillDetailResponse,
} from '../types.js';
import { getGlobalAuthManager, createAuthManager } from '../pingancoder-auth.js';
import { getGlobalConfigManager } from '../config.js';
import { ERROR_MESSAGES } from '../constants.js';

/**
 * 将标题转换为 slug 格式
 * 例如: "React Components Generator" -> "react-components-generator"
 */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 空格替换为连字符
    .replace(/-+/g, '-')       // 多个连字符合并为一个
    .trim();
}

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
   * 从 API 获取技能详情
   */
  async fetchSkill(parsedSource: ParsedSource): Promise<RemoteSkill | null> {
    try {
      const identifier = parsedSource.identifier || parsedSource.url.replace('pingancoder://', '');
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();

      // 调用真实 API：获取技能详情
      const response = await fetch(`${baseUrl}/resource/download/${identifier}`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(ERROR_MESSAGES.SKILL_NOT_FOUND);
        }
        throw new Error(`获取技能失败: ${response.statusText}`);
      }

      const response_data = (await response.json()) as MarketSkillDetailResponse;

      // 检查响应状态
      if (!response_data.success || response_data.code !== 200) {
        throw new Error(response_data.message || '获取技能失败');
      }

      const skillDetail = response_data.data;
      const file = response_data.file;

      // 转换为内部格式
      const skill: PingancoderSkill = {
        id: String(skillDetail.id),
        name: skillDetail.title || skillDetail.description || 'Unknown',
        description: skillDetail.description || '',
        downloadUrl: file?.downloadUrl || '',
        version: skillDetail.version || '1.0.0',
        category: skillDetail.categoryName,
        author: skillDetail.author,
        metadata: {
          ...skillDetail,
          originalId: skillDetail.id,
        },
      };

      // 获取技能内容（如果 downloadUrl 可用）
      let content = '';
      if (skill.downloadUrl) {
        try {
          const contentResponse = await fetch(skill.downloadUrl, {
            headers: {
              'accept': 'application/json, text/plain, */*',
            },
            signal: AbortSignal.timeout(timeout),
          });
          if (contentResponse.ok) {
            content = await contentResponse.text();
          }
        } catch {
          // 忽略错误，使用默认内容
        }
      }

      // 如果没有获取到内容，生成默认内容
      if (!content) {
        content = `---
name: ${skill.name}
description: ${skill.description}
version: ${skill.version}
${skill.category ? `category: ${skill.category}` : ''}
${skill.author ? `author: ${skill.author}` : ''}
---

# ${skill.name}

${skill.description}

## 功能特性

- 技能 ID: ${skillDetail.id}
- 版本: ${skill.version}
- 作者: ${skill.author || 'Unknown'}
${skillDetail.tags && skillDetail.tags.length > 0 ? `- 标签: ${skillDetail.tags.join(', ')}` : ''}
`;
      }

      return {
        name: skill.name,
        description: skill.description,
        content,
        installName: toSlug(skill.name), // 使用 slug 格式的标题
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
   * 搜索技能（获取技能列表）
   */
  async searchSkills(query: string, options?: { limit?: number }): Promise<PingancoderSkill[]> {
    try {
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();

      // 调用真实 API：获取技能列表
      const response = await fetch(`${baseUrl}/api/skills/list`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`获取技能列表失败: ${response.statusText}`);
      }

      const responseData = await response.json() as MarketSkillListResponse;

      // 检查响应状态
      if (!responseData.success || responseData.code !== 200) {
        throw new Error(responseData.message || '获取技能列表失败');
      }

      // 转换为内部格式
      return responseData.data.map(item => ({
        id: String(item.id),
        name: item.title,
        description: item.description || '',
        downloadUrl: item.downloadUrl || '',
        version: item.version || '1.0.0',
        category: item.category,
        author: item.author,
        metadata: {
          ...item,
          originalId: item.id,
        },
      })) as PingancoderSkill[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取技能列表失败');
    }
  }

  /**
   * 获取技能更新信息
   */
  async getUpdateInfo(skillId: string, currentVersion: string): Promise<{ hasUpdate: boolean; latestVersion: string } | null> {
    try {
      const baseUrl = await this.configManager.getApiBaseUrl();
      const timeout = await this.configManager.getTimeout();

      // 调用真实 API：获取技能详情
      const response = await fetch(`${baseUrl}/resource/download/${skillId}`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        return null;
      }

      const response_data = await response.json() as MarketSkillDetailResponse;

      if (!response_data.success || response_data.code !== 200) {
        return null;
      }

      const skillDetail = response_data.data;

      return {
        hasUpdate: skillDetail.version !== currentVersion,
        latestVersion: skillDetail.version || '1.0.0',
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
