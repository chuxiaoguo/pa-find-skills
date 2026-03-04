/**
 * 本地路径提供者
 * 从本地文件系统获取技能
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { Provider, RemoteSkill, ParsedSource, Skill } from '../types.js';
import { discoverSkills } from '../skills.js';

/**
 * 本地路径提供者类
 */
class LocalPathProvider implements Provider {
  id = 'local-path';
  displayName = '本地路径';

  /**
   * 匹配源是否属于此提供者
   */
  match(source: string): boolean {
    return (
      source.startsWith('./') ||
      source.startsWith('../') ||
      source.startsWith('/') ||
      /^[a-zA-Z]:/.test(source) // Windows 绝对路径
    );
  }

  /**
   * 从本地路径获取技能
   */
  async fetchSkill(parsedSource: ParsedSource): Promise<RemoteSkill | null> {
    try {
      const localPath = parsedSource.localPath || parsedSource.url;

      // 发现技能
      const skills = await discoverSkills(localPath);

      if (skills.length === 0) {
        throw new Error('未在指定路径找到技能');
      }

      // 如果指定了子路径，筛选技能
      let targetSkill = skills[0];
      if (parsedSource.subpath) {
        const filtered = skills.filter((s) => s.path.includes(parsedSource.subpath!));
        if (filtered.length > 0) {
          targetSkill = filtered[0];
        }
      }

      // 读取 SKILL.md 内容
      const skillMdPath = join(targetSkill.path, 'SKILL.md');
      const content = await readFile(skillMdPath, 'utf-8');

      return {
        name: targetSkill.name,
        description: targetSkill.description,
        content,
        installName: targetSkill.name,
        sourceUrl: localPath,
        providerId: this.id,
        sourceIdentifier: 'local',
        metadata: targetSkill.metadata,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('从本地路径获取技能失败');
    }
  }
}

/**
 * 创建本地路径提供者实例
 */
export function createLocalPathProvider(): Provider {
  return new LocalPathProvider();
}
