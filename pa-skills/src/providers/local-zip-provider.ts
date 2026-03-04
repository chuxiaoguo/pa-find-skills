/**
 * 本地 Zip 提供者
 * 从本地 Zip 文件获取技能
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { Provider, RemoteSkill, ParsedSource } from '../types.js';
import { getGlobalZipHandler } from '../zip-handler.js';
import { SKILL_MD_FILE } from '../constants.js';

/**
 * 本地 Zip 提供者类
 */
class LocalZipProvider implements Provider {
  id = 'local-zip';
  displayName = '本地 Zip';
  private zipHandler = getGlobalZipHandler();

  /**
   * 匹配源是否属于此提供者
   */
  match(source: string): boolean {
    return source.endsWith('.zip') || source.endsWith('.ZIP');
  }

  /**
   * 从本地 Zip 文件获取技能
   */
  async fetchSkill(parsedSource: ParsedSource): Promise<RemoteSkill | null> {
    try {
      const zipPath = parsedSource.localPath || parsedSource.url;

      // 读取 Zip 文件
      const buffer = await readFile(zipPath);

      // 解压到临时目录
      const extractPath = await this.zipHandler.extractZipFromBuffer(buffer);

      try {
        // 查找 SKILL.md
        const skillMdPath = join(extractPath, SKILL_MD_FILE);
        const content = await readFile(skillMdPath, 'utf-8');

        // 解析 frontmatter
        const { data } = matter(content);

        if (!data.name || !data.description) {
          throw new Error('Zip 文件中的 SKILL.md 缺少必需字段');
        }

        return {
          name: data.name as string,
          description: data.description as string,
          content,
          installName: data.name as string,
          sourceUrl: zipPath,
          providerId: this.id,
          sourceIdentifier: 'local-zip',
          metadata: data.metadata,
        };
      } finally {
        // 清理临时目录
        await this.zipHandler.cleanup(extractPath);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('从 Zip 文件获取技能失败');
    }
  }
}

/**
 * 创建本地 Zip 提供者实例
 */
export function createLocalZipProvider(): Provider {
  return new LocalZipProvider();
}
