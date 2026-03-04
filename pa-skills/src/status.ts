/**
 * 状态命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getGlobalAuthManager } from './pingancoder-auth.js';
import { getGlobalConfigManager } from './config.js';
import { detectInstalledAgents } from './agents.js';
import { getAllLockedSkills } from './skill-lock.js';

export async function runStatus(args: string[]): Promise<void> {
  p.intro(pc.cyan('Pingancoder Skills 状态'));

  // 认证状态
  p.log.info(pc.bold('认证状态'));
  try {
    const authManager = getGlobalAuthManager();
    const authStatus = await authManager.getStatus();

    if (authStatus.authenticated) {
      p.log.success(`已认证: ${authStatus.username}`);
      const expiresAt = authStatus.expiresAt;
      const now = Date.now();
      const remaining = expiresAt ? expiresAt - now : 0;

      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        p.log.info(`Token 有效期剩余: ${hours} 小时 ${minutes} 分钟`);
      } else {
        p.log.warn('Token 已过期，请重新登录');
      }
    } else {
      p.log.warn('未登录');
    }
  } catch (error) {
    p.log.error('无法获取认证状态');
  }
  console.log();

  // 配置信息
  p.log.info(pc.bold('配置信息'));
  try {
    const configManager = getGlobalConfigManager();
    const config = await configManager.load();
    p.log.info(`API 地址: ${config.baseUrl}`);
    if (config.downloadBaseUrl) {
      p.log.info(`下载地址: ${config.downloadBaseUrl}`);
    }
  } catch (error) {
    p.log.error('无法获取配置信息');
  }
  console.log();

  // 代理状态
  p.log.info(pc.bold('代理状态'));
  try {
    const installedAgents = await detectInstalledAgents();
    if (installedAgents.length === 0) {
      p.log.warn('未检测到任何代理');
    } else {
      const { agents } = await import('./agents.js');
      for (const agentType of installedAgents) {
        p.log.success(`${agents[agentType].displayName} (${agentType})`);
      }
    }
  } catch (error) {
    p.log.error('无法检测代理');
  }
  console.log();

  // 技能统计
  p.log.info(pc.bold('技能统计'));
  try {
    const lockedSkills = await getAllLockedSkills();
    const skillCount = Object.keys(lockedSkills).length;
    p.log.info(`已安装技能: ${skillCount} 个`);

    if (skillCount > 0) {
      console.log();
      for (const [name, entry] of Object.entries(lockedSkills)) {
        p.log.info(`  ${pc.bold(name)} - ${entry.sourceType} (${entry.version || '未知版本'})`);
      }
    }
  } catch (error) {
    p.log.error('无法获取技能信息');
  }

  p.outro(pc.green('状态检查完成'));
}
