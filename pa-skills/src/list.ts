/**
 * 列出技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getAllLockedSkills } from './skill-lock.js';
import { agents } from './agents.js';

export async function runList(args: string[]): Promise<void> {
  const lockedSkills = await getAllLockedSkills();
  const skillNames = Object.keys(lockedSkills);

  if (skillNames.length === 0) {
    p.note('没有已安装的技能');
    return;
  }

  p.intro(pc.cyan('已安装的技能'));

  for (const [name, entry] of Object.entries(lockedSkills)) {
    p.log.info(`${pc.bold(name)}`);
    p.log.info(`  来源: ${entry.sourceType}`);
    p.log.info(`  版本: ${entry.version || '未知'}`);
    p.log.info(`  安装时间: ${new Date(entry.installedAt).toLocaleString('zh-CN')}`);
    p.log.info(`  更新时间: ${new Date(entry.updatedAt).toLocaleString('zh-CN')}`);
    console.log();
  }

  p.outro(pc.green(`共 ${skillNames.length} 个技能`));
}
