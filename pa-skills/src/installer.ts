/**
 * 安装引擎
 * 基于原版 skills-main 改造
 */

import {
  mkdir,
  cp,
  access,
  readdir,
  symlink,
  lstat,
  rm,
  readlink,
  realpath,
} from 'fs/promises';
import { join, basename, normalize, resolve, sep, relative, dirname } from 'path';
import { homedir, platform } from 'os';
import type { Skill, AgentType, InstallOptions } from './types.js';
import { agents, isUniversalAgent } from './agents.js';
import { AGENTS_DIR, SKILLS_SUBDIR } from './constants.js';

export type InstallMode = 'symlink' | 'copy';

export interface InstallResult {
  success: boolean;
  path: string;
  canonicalPath?: string;
  mode: InstallMode;
  symlinkFailed?: boolean;
  error?: string;
}

/**
 * 清理名称，防止路径遍历攻击
 */
export function sanitizeName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '');

  return sanitized.substring(0, 255) || 'unnamed-skill';
}

/**
 * 验证路径是否在预期的基础目录内
 */
function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = normalize(resolve(basePath));
  const normalizedTarget = normalize(resolve(targetPath));

  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}

/**
 * 获取规范技能目录
 */
export function getCanonicalSkillsDir(global: boolean, cwd?: string): string {
  const baseDir = global ? homedir() : cwd || process.cwd();
  return join(baseDir, AGENTS_DIR, SKILLS_SUBDIR);
}

/**
 * 获取代理的基础目录
 */
export function getAgentBaseDir(agentType: AgentType, global: boolean, cwd?: string): string {
  const agent = agents[agentType];
  const baseDir = global ? homedir() : cwd || process.cwd();

  if (global) {
    // 全局安装：优先使用 agent.globalSkillsDir
    if (agent.globalSkillsDir !== undefined) {
      return agent.globalSkillsDir;
    }
    // 通用代理的全局安装使用规范目录
    if (isUniversalAgent(agentType)) {
      return getCanonicalSkillsDir(global, cwd);
    }
    return join(baseDir, agent.skillsDir);
  }

  // 项目级安装
  if (isUniversalAgent(agentType)) {
    return getCanonicalSkillsDir(global, cwd);
  }
  return join(baseDir, agent.skillsDir);
}

/**
 * 解析符号链接目标
 */
function resolveSymlinkTarget(linkPath: string, linkTarget: string): string {
  return resolve(dirname(linkPath), linkTarget);
}

/**
 * 清理并重新创建目录
 */
async function cleanAndCreateDirectory(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch {
    // 忽略清理错误
  }
  await mkdir(path, { recursive: true });
}

/**
 * 解析父目录的符号链接
 */
async function resolveParentSymlinks(path: string): Promise<string> {
  const resolved = resolve(path);
  const dir = dirname(resolved);
  const base = basename(resolved);
  try {
    const realDir = await realpath(dir);
    return join(realDir, base);
  } catch {
    return resolved;
  }
}

/**
 * 创建符号链接
 */
async function createSymlink(target: string, linkPath: string): Promise<boolean> {
  try {
    const resolvedTarget = resolve(target);
    const resolvedLinkPath = resolve(linkPath);

    const [realTarget, realLinkPath] = await Promise.all([
      realpath(resolvedTarget).catch(() => resolvedTarget),
      realpath(resolvedLinkPath).catch(() => resolvedLinkPath),
    ]);

    if (realTarget === realLinkPath) {
      return true;
    }

    const realTargetWithParents = await resolveParentSymlinks(target);
    const realLinkPathWithParents = await resolveParentSymlinks(linkPath);

    if (realTargetWithParents === realLinkPathWithParents) {
      return true;
    }

    try {
      const stats = await lstat(linkPath);
      if (stats.isSymbolicLink()) {
        const existingTarget = await readlink(linkPath);
        if (resolveSymlinkTarget(linkPath, existingTarget) === resolvedTarget) {
          return true;
        }
        await rm(linkPath);
      } else {
        await rm(linkPath, { recursive: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'ELOOP') {
        try {
          await rm(linkPath, { force: true });
        } catch {
          // 忽略
        }
      }
    }

    const linkDir = dirname(linkPath);
    await mkdir(linkDir, { recursive: true });

    const realLinkDir = await resolveParentSymlinks(linkDir);
    const relativePath = relative(realLinkDir, target);
    const symlinkType = platform() === 'win32' ? 'junction' : undefined;

    await symlink(relativePath, linkPath, symlinkType);
    return true;
  } catch {
    return false;
  }
}

/**
 * 为单个代理安装技能
 */
export async function installSkillForAgent(
  skill: Skill,
  agentType: AgentType,
  options: InstallOptions = {}
): Promise<InstallResult> {
  const agent = agents[agentType];
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();

  if (isGlobal && agent.globalSkillsDir === undefined) {
    return {
      success: false,
      path: '',
      mode: options.mode ?? 'symlink',
      error: `${agent.displayName} 不支持全局技能安装`,
    };
  }

  const rawSkillName = skill.name || basename(skill.path);
  const skillName = sanitizeName(rawSkillName);

  const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);

  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
  const agentDir = join(agentBase, skillName);

  const installMode = options.mode ?? 'symlink';

  if (!isPathSafe(canonicalBase, canonicalDir)) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: '无效的技能名称：检测到潜在的路径遍历攻击',
    };
  }

  if (!isPathSafe(agentBase, agentDir)) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: '无效的技能名称：检测到潜在的路径遍历攻击',
    };
  }

  try {
    if (installMode === 'copy') {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir);

      return {
        success: true,
        path: agentDir,
        mode: 'copy',
      };
    }

    // 对于有独立全局目录的代理（如 pingancoder），直接复制到目标目录
    if (isGlobal && agent.globalSkillsDir !== undefined) {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir);

      return {
        success: true,
        path: agentDir,
        mode: 'copy',
      };
    }

    // 使用符号链接模式（默认）
    await cleanAndCreateDirectory(canonicalDir);
    await copyDirectory(skill.path, canonicalDir);

    if (isGlobal && isUniversalAgent(agentType)) {
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: 'symlink',
      };
    }

    const symlinkCreated = await createSymlink(canonicalDir, agentDir);

    if (!symlinkCreated) {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir);

      return {
        success: true,
        path: agentDir,
        canonicalPath: canonicalDir,
        mode: 'symlink',
        symlinkFailed: true,
      };
    }

    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: 'symlink',
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

const EXCLUDE_FILES = new Set(['metadata.json']);
const EXCLUDE_DIRS = new Set(['.git']);

const isExcluded = (name: string, isDirectory: boolean = false): boolean => {
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith('_')) return true;
  if (isDirectory && EXCLUDE_DIRS.has(name)) return true;
  return false;
};

/**
 * 复制目录
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => !isExcluded(entry.name, entry.isDirectory()))
      .map(async (entry) => {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyDirectory(srcPath, destPath);
        } else {
          await cp(srcPath, destPath, {
            dereference: true,
            recursive: true,
          });
        }
      })
  );
}

/**
 * 检查技能是否已安装
 */
export async function isSkillInstalled(
  skillName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): Promise<boolean> {
  const agent = agents[agentType];
  const sanitized = sanitizeName(skillName);

  if (options.global && agent.globalSkillsDir === undefined) {
    return false;
  }

  const targetBase = options.global
    ? agent.globalSkillsDir!
    : join(options.cwd || process.cwd(), agent.skillsDir);

  const skillDir = join(targetBase, sanitized);

  if (!isPathSafe(targetBase, skillDir)) {
    return false;
  }

  try {
    await access(skillDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取安装路径
 */
export function getInstallPath(
  skillName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): string {
  const agent = agents[agentType];
  const sanitized = sanitizeName(skillName);

  const targetBase = options.global
    ? agent.globalSkillsDir!
    : join(options.cwd || process.cwd(), agent.skillsDir);

  return join(targetBase, sanitized);
}

/**
 * 移除技能
 */
export async function removeSkill(
  skillName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {}
): Promise<{ success: boolean; error?: string }> {
  const agent = agents[agentType];
  const sanitized = sanitizeName(skillName);

  const targetBase = options.global
    ? agent.globalSkillsDir!
    : join(options.cwd || process.cwd(), agent.skillsDir);

  const skillDir = join(targetBase, sanitized);

  if (!isPathSafe(targetBase, skillDir)) {
    return {
      success: false,
      error: '无效的技能名称：检测到潜在的路径遍历攻击',
    };
  }

  try {
    await rm(skillDir, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '移除失败',
    };
  }
}

/**
 * 为所有检测到的代理安装技能
 */
export async function installSkillForAllAgents(
  skill: Skill,
  options: InstallOptions = {}
): Promise<Map<AgentType, InstallResult>> {
  const { detectInstalledAgents } = await import('./agents.js');
  const detectedAgents = options.agents || (await detectInstalledAgents());

  const results = new Map<AgentType, InstallResult>();

  for (const agentType of detectedAgents) {
    // 验证代理类型是否有效
    if (!(agentType in agents)) {
      results.set(agentType, {
        success: false,
        path: '',
        mode: options.mode ?? 'symlink',
        error: `无效的代理类型: ${agentType}`,
      });
      continue;
    }

    const result = await installSkillForAgent(skill, agentType, options);
    results.set(agentType, result);
  }

  return results;
}

/**
 * 从所有代理移除技能
 */
export async function removeSkillFromAllAgents(
  skillName: string,
  options: { global?: boolean; cwd?: string; agents?: AgentType[] } = {}
): Promise<Map<AgentType, { success: boolean; error?: string }>> {
  const { detectInstalledAgents } = await import('./agents.js');
  const detectedAgents = options.agents || (await detectInstalledAgents());

  const results = new Map<AgentType, { success: boolean; error?: string }>();

  for (const agentType of detectedAgents) {
    const result = await removeSkill(skillName, agentType, options);
    results.set(agentType, result);
  }

  return results;
}
