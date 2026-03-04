/**
 * 源解析器
 * 解析各种技能源格式
 */

import { resolve, join, extname, basename } from 'path';
import { existsSync } from 'fs';
import type { ParsedSource, SourceType } from './types.js';

/**
 * 解析技能源
 */
export function parseSource(source: string): ParsedSource {
  // 检查是否是 pingancoder:// 协议
  if (source.startsWith('pingancoder://')) {
    const identifier = source.replace('pingancoder://', '');
    return {
      type: 'pingancoder-api',
      url: source,
      identifier,
    };
  }

  // 检查是否是本地 Zip 文件
  if (source.endsWith('.zip') || source.endsWith('.ZIP')) {
    const localPath = resolve(source);
    if (!existsSync(localPath)) {
      throw new Error(`Zip 文件不存在: ${source}`);
    }
    return {
      type: 'local-zip',
      url: localPath,
      localPath,
    };
  }

  // 检查是否是本地路径
  if (source.startsWith('./') || source.startsWith('../') || source.startsWith('/') || source.match(/^[a-zA-Z]:/)) {
    const localPath = resolve(source);
    if (!existsSync(localPath)) {
      throw new Error(`路径不存在: ${source}`);
    }
    return {
      type: 'local',
      url: localPath,
      localPath,
    };
  }

  // 默认当作内网 API 的技能标识符
  return {
    type: 'pingancoder-api',
    url: `pingancoder://${source}`,
    identifier: source,
  };
}

/**
 * 从解析的源获取安装名称
 */
export function getInstallName(parsed: ParsedSource): string {
  if (parsed.type === 'pingancoder-api') {
    return parsed.identifier || parsed.url.split('/').pop() || 'skill';
  }

  if (parsed.type === 'local-zip') {
    const fileName = parsed.localPath || parsed.url;
    return basename(fileName, extname(fileName));
  }

  if (parsed.type === 'local') {
    const path = parsed.localPath || parsed.url;
    return basename(path);
  }

  return 'skill';
}

/**
 * 检查源类型
 */
export function getSourceType(source: string): SourceType {
  const parsed = parseSource(source);
  return parsed.type;
}

/**
 * 验证源格式
 */
export function validateSource(source: string): { valid: boolean; error?: string } {
  try {
    parseSource(source);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '无效的源格式',
    };
  }
}

/**
 * 获取源的显示名称
 */
export function getSourceDisplayName(source: string): string {
  if (source.startsWith('pingancoder://')) {
    return `Pingancoder API: ${source.replace('pingancoder://', '')}`;
  }

  if (source.endsWith('.zip')) {
    return `本地 Zip: ${source}`;
  }

  return `本地路径: ${source}`;
}
