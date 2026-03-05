/**
 * Pingancoder Skills 代理配置
 * 精简到4个代理：gemini, opencode, openclaw, pingancoder
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import { xdgConfig } from 'xdg-basedir';
import type { AgentConfig, AgentType } from './types.ts';

const home = homedir();
// Use xdg-basedir to match OpenCode behavior on all platforms
const configHome = xdgConfig ?? join(home, '.config');

/**
 * 获取 OpenClaw 全局技能目录
 */
function getOpenClawGlobalSkillsDir(
  homeDir = home,
  pathExists: (path: string) => boolean = existsSync
): string {
  if (pathExists(join(homeDir, '.openclaw'))) {
    return join(homeDir, '.openclaw/skills');
  }
  if (pathExists(join(homeDir, '.clawdbot'))) {
    return join(homeDir, '.clawdbot/skills');
  }
  if (pathExists(join(homeDir, '.moltbot'))) {
    return join(homeDir, '.moltbot/skills');
  }
  return join(homeDir, '.openclaw/skills');
}

/**
 * 代理配置（精简到4个）
 */
export const agents: Record<AgentType, AgentConfig> = {
  gemini: {
    name: 'gemini',
    displayName: 'Gemini CLI',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.gemini'));
    },
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(configHome, 'opencode/skills'),
    detectInstalled: async () => {
      return existsSync(join(configHome, 'opencode'));
    },
  },
  openclaw: {
    name: 'openclaw',
    displayName: 'OpenClaw',
    skillsDir: 'skills',
    globalSkillsDir: getOpenClawGlobalSkillsDir(),
    detectInstalled: async () => {
      return (
        existsSync(join(home, '.openclaw')) ||
        existsSync(join(home, '.clawdbot')) ||
        existsSync(join(home, '.moltbot'))
      );
    },
  },
  pingancoder: {
    name: 'pingancoder',
    displayName: 'Pingancoder',
    skillsDir: '.pingancoder/skills',
    globalSkillsDir: join(home, '.pingancoder/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.pingancoder'));
    },
  },
};

/**
 * 检测已安装的代理
 */
export async function detectInstalledAgents(): Promise<AgentType[]> {
  const results = await Promise.all(
    Object.entries(agents).map(async ([type, config]) => ({
      type: type as AgentType,
      installed: await config.detectInstalled(),
    }))
  );
  return results.filter((r) => r.installed).map((r) => r.type);
}

/**
 * 获取代理配置
 */
export function getAgentConfig(type: AgentType): AgentConfig {
  return agents[type];
}

/**
 * 获取所有代理类型
 */
export function getAllAgentTypes(): AgentType[] {
  return Object.keys(agents) as AgentType[];
}

/**
 * 返回使用通用 .agents/skills 目录的代理
 * 这些代理共享一个公共技能位置，不需要符号链接
 */
export function getUniversalAgents(): AgentType[] {
  return (Object.entries(agents) as [AgentType, AgentConfig][])
    .filter(([_, config]) => config.skillsDir === '.agents/skills')
    .map(([type]) => type);
}

/**
 * 返回使用代理特定技能目录的代理（非通用）
 * 这些代理需要从规范的 .agents/skills 位置创建符号链接
 */
export function getNonUniversalAgents(): AgentType[] {
  return (Object.entries(agents) as [AgentType, AgentConfig][])
    .filter(([_, config]) => config.skillsDir !== '.agents/skills')
    .map(([type]) => type);
}

/**
 * 检查代理是否使用通用的 .agents/skills 目录
 */
export function isUniversalAgent(type: AgentType): boolean {
  return agents[type].skillsDir === '.agents/skills';
}

/**
 * 获取代理的规范技能目录（项目级）
 */
export function getAgentSkillsDir(type: AgentType, cwd: string = process.cwd()): string {
  const config = getAgentConfig(type);
  return join(cwd, config.skillsDir);
}

/**
 * 获取代理的全局技能目录
 */
export function getAgentGlobalSkillsDir(type: AgentType): string | undefined {
  const config = getAgentConfig(type);
  return config.globalSkillsDir;
}
