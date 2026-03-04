/**
 * 更新技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getAllLockedSkills } from './skill-lock.js';
import { createPingancoderProvider } from './providers/pingancoder-provider.js';

export async function runUpdate(args: string[]): Promise<void> {
  p.intro(pc.cyan('更新技能'));

  const lockedSkills = await getAllLockedSkills();
  const skillNames = Object.keys(lockedSkills);

  if (skillNames.length === 0) {
    p.note('没有已安装的技能');
    p.outro(pc.yellow('没有可更新的技能'));
    return;
  }

  const s = p.spinner();
  s.start('正在检查更新...');

  try {
    const provider = createPingancoderProvider();
    const updateResults: Array<{
      name: string;
      hasUpdate: boolean;
      currentVersion: string;
      latestVersion: string;
    }> = [];

    for (const [name, entry] of Object.entries(lockedSkills)) {
      if (entry.sourceType === 'pingancoder-api' && provider.getUpdateInfo) {
        const result = await provider.getUpdateInfo(name, entry.version || '0.0.0');
        if (result && result.hasUpdate) {
          updateResults.push({
            name,
            hasUpdate: true,
            currentVersion: entry.version || '0.0.0',
            latestVersion: result.latestVersion,
          });
        }
      }
    }

    s.stop(`检查完成，${updateResults.length} 个技能有更新`);

    if (updateResults.length === 0) {
      p.note('所有技能都是最新版本');
      p.outro(pc.green('没有可用更新'));
      return;
    }

    for (const result of updateResults) {
      p.log.info(`${pc.bold(result.name)}`);
      p.log.info(`  当前版本: ${result.currentVersion}`);
      p.log.info(`  最新版本: ${pc.green(result.latestVersion)}`);
      console.log();
    }

    const shouldUpdate = await p.confirm({
      message: `是否更新 ${updateResults.length} 个技能？`,
    });

    if (p.isCancel(shouldUpdate) || !shouldUpdate) {
      p.cancel('操作已取消');
      return;
    }

    p.note('更新功能开发中...');
    p.outro(pc.yellow('更新功能即将推出'));
  } catch (error) {
    s.stop('检查更新失败');
    p.cancel(error instanceof Error ? error.message : '检查更新失败');
  }
}
