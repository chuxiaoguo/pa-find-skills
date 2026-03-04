/**
 * 全局技能锁文件
 * 基于原版改造，移除 GitHub 相关功能
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { AGENTS_DIR } from './constants.js';

const LOCK_FILE = '.skill-lock.json';
const CURRENT_VERSION = 1;

/**
 * 技能锁条目
 */
export interface SkillLockEntry {
  /** 规范化的来源标识符 */
  source: string;
  /** 提供者类型 */
  sourceType: string;
  /** 原始 URL */
  sourceUrl: string;
  /** 子路径（如果适用） */
  skillPath?: string;
  /** 技能文件夹哈希 */
  skillFolderHash: string;
  /** 安装时间 */
  installedAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 版本（如果提供者支持） */
  version?: string;
  /** 插件名称 */
  pluginName?: string;
}

/**
 * 已忽略的提示
 */
export interface DismissedPrompts {
  /** 忽略了查找技能的提示 */
  findSkillsPrompt?: boolean;
}

/**
 * 锁文件结构
 */
export interface SkillLockFile {
  /** 版本 */
  version: number;
  /** 技能映射 */
  skills: Record<string, SkillLockEntry>;
  /** 忽略的提示 */
  dismissed?: DismissedPrompts;
  /** 最后选择的代理 */
  lastSelectedAgents?: string[];
}

/**
 * 获取锁文件路径
 */
export function getSkillLockPath(): string {
  return join(homedir(), AGENTS_DIR, LOCK_FILE);
}

/**
 * 读取锁文件
 */
export async function readSkillLock(): Promise<SkillLockFile> {
  const lockPath = getSkillLockPath();

  try {
    const content = await readFile(lockPath, 'utf-8');
    const parsed = JSON.parse(content) as SkillLockFile;

    if (typeof parsed.version !== 'number' || !parsed.skills) {
      return createEmptyLockFile();
    }

    if (parsed.version < CURRENT_VERSION) {
      return createEmptyLockFile();
    }

    return parsed;
  } catch {
    return createEmptyLockFile();
  }
}

/**
 * 写入锁文件
 */
export async function writeSkillLock(lock: SkillLockFile): Promise<void> {
  const lockPath = getSkillLockPath();
  await mkdir(dirname(lockPath), { recursive: true });

  const content = JSON.stringify(lock, null, 2);
  await writeFile(lockPath, content, 'utf-8');
}

/**
 * 计算内容哈希
 */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

/**
 * 添加技能到锁文件
 */
export async function addSkillToLock(
  skillName: string,
  entry: Omit<SkillLockEntry, 'installedAt' | 'updatedAt'>
): Promise<void> {
  const lock = await readSkillLock();
  const now = new Date().toISOString();

  const existingEntry = lock.skills[skillName];

  lock.skills[skillName] = {
    ...entry,
    installedAt: existingEntry?.installedAt ?? now,
    updatedAt: now,
  };

  await writeSkillLock(lock);
}

/**
 * 从锁文件移除技能
 */
export async function removeSkillFromLock(skillName: string): Promise<boolean> {
  const lock = await readSkillLock();

  if (!(skillName in lock.skills)) {
    return false;
  }

  delete lock.skills[skillName];
  await writeSkillLock(lock);
  return true;
}

/**
 * 从锁文件获取技能
 */
export async function getSkillFromLock(skillName: string): Promise<SkillLockEntry | null> {
  const lock = await readSkillLock();
  return lock.skills[skillName] ?? null;
}

/**
 * 获取所有锁定的技能
 */
export async function getAllLockedSkills(): Promise<Record<string, SkillLockEntry>> {
  const lock = await readSkillLock();
  return lock.skills;
}

/**
 * 按来源分组获取技能
 */
export async function getSkillsBySource(): Promise<
  Map<string, { skills: string[]; entry: SkillLockEntry }>
> {
  const lock = await readSkillLock();
  const bySource = new Map<string, { skills: string[]; entry: SkillLockEntry }>();

  for (const [skillName, entry] of Object.entries(lock.skills)) {
    const existing = bySource.get(entry.source);
    if (existing) {
      existing.skills.push(skillName);
    } else {
      bySource.set(entry.source, { skills: [skillName], entry });
    }
  }

  return bySource;
}

/**
 * 创建空的锁文件
 */
function createEmptyLockFile(): SkillLockFile {
  return {
    version: CURRENT_VERSION,
    skills: {},
    dismissed: {},
  };
}

/**
 * 检查提示是否已忽略
 */
export async function isPromptDismissed(promptKey: keyof DismissedPrompts): Promise<boolean> {
  const lock = await readSkillLock();
  return lock.dismissed?.[promptKey] === true;
}

/**
 * 忽略提示
 */
export async function dismissPrompt(promptKey: keyof DismissedPrompts): Promise<void> {
  const lock = await readSkillLock();
  if (!lock.dismissed) {
    lock.dismissed = {};
  }
  lock.dismissed[promptKey] = true;
  await writeSkillLock(lock);
}

/**
 * 获取最后选择的代理
 */
export async function getLastSelectedAgents(): Promise<string[] | undefined> {
  const lock = await readSkillLock();
  return lock.lastSelectedAgents;
}

/**
 * 保存选择的代理
 */
export async function saveSelectedAgents(agents: string[]): Promise<void> {
  const lock = await readSkillLock();
  lock.lastSelectedAgents = agents;
  await writeSkillLock(lock);
}
