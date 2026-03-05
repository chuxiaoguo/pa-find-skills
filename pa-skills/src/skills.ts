/**
 * 技能发现模块
 * 基于原版 skills-main 改造
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, resolve, dirname } from 'path';
import * as matter from 'gray-matter';
import type { Skill } from './types.js';
import { SKIP_DIRS, MAX_SEARCH_DEPTH } from './constants.js';
import { getPluginSkillPaths, getPluginGroupings } from './plugin-manifest.js';

/**
 * 检查是否应该安装内部技能
 */
export function shouldInstallInternalSkills(): boolean {
  const envValue = process.env.INSTALL_INTERNAL_SKILLS;
  return envValue === '1' || envValue === 'true';
}

/**
 * 检查目录是否包含 SKILL.md
 */
async function hasSkillMd(dir: string): Promise<boolean> {
  try {
    const skillPath = join(dir, 'SKILL.md');
    const stats = await stat(skillPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * 解析 SKILL.md 文件
 */
export async function parseSkillMd(
  skillMdPath: string,
  options?: { includeInternal?: boolean }
): Promise<Skill | null> {
  try {
    const content = await readFile(skillMdPath, 'utf-8');
    const { data } = matter.default(content);

    if (!data.name || !data.description) {
      return null;
    }

    // 确保 name 和 description 是字符串
    if (typeof data.name !== 'string' || typeof data.description !== 'string') {
      return null;
    }

    // 跳过内部技能（除非明确指定）
    const isInternal = data.metadata?.internal === true;
    if (isInternal && !shouldInstallInternalSkills() && !options?.includeInternal) {
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      path: dirname(skillMdPath),
      rawContent: content,
      metadata: data.metadata,
    };
  } catch {
    return null;
  }
}

/**
 * 递归查找技能目录
 */
async function findSkillDirs(dir: string, depth = 0, maxDepth = MAX_SEARCH_DEPTH): Promise<string[]> {
  if (depth > maxDepth) return [];

  try {
    const [hasSkill, entries] = await Promise.all([
      hasSkillMd(dir),
      readdir(dir, { withFileTypes: true }).catch(() => []),
    ]);

    const currentDir = hasSkill ? [dir] : [];

    // 并行搜索子目录
    const subDirResults = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && !SKIP_DIRS.includes(entry.name))
        .map((entry) => findSkillDirs(join(dir, entry.name), depth + 1, maxDepth))
    );

    return [...currentDir, ...subDirResults.flat()];
  } catch {
    return [];
  }
}

/**
 * 发现技能选项
 */
export interface DiscoverSkillsOptions {
  /** 包含内部技能 */
  includeInternal?: boolean;
  /** 搜索所有子目录 */
  fullDepth?: boolean;
  /** 直接模式：只在指定路径查找，不搜索子目录（与zip安装行为一致） */
  direct?: boolean;
}

/**
 * 发现技能
 */
export async function discoverSkills(
  basePath: string,
  subpath?: string,
  options?: DiscoverSkillsOptions
): Promise<Skill[]> {
  const skills: Skill[] = [];
  const seenNames = new Set<string>();
  const searchPath = subpath ? join(basePath, subpath) : basePath;

  // 直接模式：只在指定路径查找 SKILL.md，不搜索子目录
  // 与 zip 安装行为保持一致
  if (options?.direct) {
    if (await hasSkillMd(searchPath)) {
      const skillMdPath = join(searchPath, 'SKILL.md');
      let skill = await parseSkillMd(skillMdPath, options);
      if (skill) {
        skills.push(skill);
      }
    }
    return skills;
  }

  // 获取插件分组信息
  const pluginGroupings = await getPluginGroupings(searchPath);

  // 增强技能信息
  const enhanceSkill = (skill: Skill) => {
    const resolvedPath = resolve(skill.path);
    if (pluginGroupings.has(resolvedPath)) {
      skill.pluginName = pluginGroupings.get(resolvedPath);
    }
    return skill;
  };

  // 如果直接指向技能，添加它
  if (await hasSkillMd(searchPath)) {
    let skill = await parseSkillMd(join(searchPath, 'SKILL.md'), options);
    if (skill) {
      skill = enhanceSkill(skill);
      skills.push(skill);
      seenNames.add(skill.name);
      if (!options?.fullDepth) {
        return skills;
      }
    }
  }

  // 搜索常见的技能位置
  const prioritySearchDirs = [
    searchPath,
    join(searchPath, 'skills'),
    join(searchPath, 'skills/.curated'),
    join(searchPath, 'skills/.experimental'),
    join(searchPath, 'skills/.system'),
    join(searchPath, '.agent/skills'),
    join(searchPath, '.agents/skills'),
    join(searchPath, '.gemini/skills'),
    join(searchPath, '.opencode/skills'),
    join(searchPath, '.pingancoder/skills'),
    join(searchPath, 'skills'), // OpenClaw
  ];

  // 添加插件清单中声明的技能路径
  prioritySearchDirs.push(...(await getPluginSkillPaths(searchPath)));

  for (const dir of prioritySearchDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillDir = join(dir, entry.name);
          if (await hasSkillMd(skillDir)) {
            let skill = await parseSkillMd(join(skillDir, 'SKILL.md'), options);
            if (skill && !seenNames.has(skill.name)) {
              skill = enhanceSkill(skill);
              skills.push(skill);
              seenNames.add(skill.name);
            }
          }
        }
      }
    } catch {
      // 目录不存在
    }
  }

  // 如果没找到或 fullDepth，进行递归搜索
  if (skills.length === 0 || options?.fullDepth) {
    const allSkillDirs = await findSkillDirs(searchPath);

    for (const skillDir of allSkillDirs) {
      let skill = await parseSkillMd(join(skillDir, 'SKILL.md'), options);
      if (skill && !seenNames.has(skill.name)) {
        skill = enhanceSkill(skill);
        skills.push(skill);
        seenNames.add(skill.name);
      }
    }
  }

  return skills;
}

/**
 * 获取技能显示名称
 */
export function getSkillDisplayName(skill: Skill): string {
  return skill.name || basename(skill.path);
}

/**
 * 根据输入过滤技能
 */
export function filterSkills(skills: Skill[], inputNames: string[]): Skill[] {
  const normalizedInputs = inputNames.map((n) => n.toLowerCase());

  return skills.filter((skill) => {
    const name = skill.name.toLowerCase();
    const displayName = getSkillDisplayName(skill).toLowerCase();

    return normalizedInputs.some((input) => input === name || input === displayName);
  });
}
