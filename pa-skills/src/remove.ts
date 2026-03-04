/**
 * 移除技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getAllLockedSkills, removeSkillFromLock } from './skill-lock.js';
import { removeSkillFromLocalLock } from './local-lock.js';
import { removeSkillFromAllAgents } from './installer.js';
import { agents } from './agents.js';

export async function runRemove(args: string[]): Promise<void> {
  p.intro(pc.cyan('移除技能'));

  const lockedSkills = await getAllLockedSkills();
  const skillNames = Object.keys(lockedSkills);

  if (skillNames.length === 0) {
    p.note('没有已安装的技能');
    p.outro(pc.yellow('没有可移除的技能'));
    return;
  }

  let skillToRemove: string;

  if (args.length === 0) {
    const selected = await p.select({
      message: '选择要移除的技能',
      options: skillNames.map((name) => ({
        value: name,
        label: name,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel('操作已取消');
      return;
    }

    skillToRemove = selected;
  } else {
    skillToRemove = args[0];

    if (!skillNames.includes(skillToRemove)) {
      p.cancel(`技能 '${skillToRemove}' 未安装`);
      return;
    }
  }

  const shouldRemove = await p.confirm({
    message: `确定要移除技能 '${skillToRemove}' 吗？`,
  });

  if (p.isCancel(shouldRemove) || !shouldRemove) {
    p.cancel('操作已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在移除...');

  try {
    const results = await removeSkillFromAllAgents(skillToRemove);

    let successCount = 0;
    let failCount = 0;

    for (const [agentType, result] of results) {
      if (result.success) {
        successCount++;
        p.log.success(`已从 ${agents[agentType].displayName} 移除`);
      } else {
        failCount++;
        p.log.error(`从 ${agents[agentType].displayName} 移除失败: ${result.error}`);
      }
    }

    // 更新锁文件
    await removeSkillFromLock(skillToRemove);
    await removeSkillFromLocalLock(skillToRemove);

    s.stop(`移除完成！(${successCount} 个代理成功${failCount > 0 ? `, ${failCount} 个失败` : ''})`);
    p.outro(pc.green('✓ 技能移除成功'));
  } catch (error) {
    s.stop('移除失败');
    p.cancel(error instanceof Error ? error.message : '移除失败');
  }
}
