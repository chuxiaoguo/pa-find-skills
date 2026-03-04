/**
 * 搜索技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getGlobalAuthManager } from './pingancoder-auth.js';
import { createPingancoderProvider } from './providers/pingancoder-provider.js';

export async function runFind(args: string[]): Promise<void> {
  p.intro(pc.cyan('搜索技能'));

  const authManager = getGlobalAuthManager();
  const status = await authManager.getStatus();

  if (!status.authenticated) {
    p.cancel('请先登录: pa-skills auth login');
    return;
  }

  const query = args[0] || '';

  if (!query) {
    const input = await p.text({
      message: '请输入搜索关键词',
      validate: (value) => {
        if (!value) return '请输入搜索关键词';
        return undefined;
      },
    });

    if (p.isCancel(input)) {
      p.cancel('操作已取消');
      return;
    }
  }

  const s = p.spinner();
  s.start('正在搜索...');

  try {
    const provider = createPingancoderProvider();

    if (!provider.searchSkills) {
      s.stop('提供者不支持搜索');
      p.cancel('此提供者不支持搜索功能');
      return;
    }

    const results = await provider.searchSkills(query, { query, limit: 20 });

    s.stop(`找到 ${results.length} 个技能`);

    if (results.length === 0) {
      p.note('没有找到匹配的技能');
      p.outro(pc.yellow('未找到结果'));
      return;
    }

    for (const skill of results) {
      p.log.info(`${pc.bold(skill.name)}`);
      p.log.info(`  描述: ${skill.description}`);
      if (skill.category) {
        p.log.info(`  分类: ${skill.category}`);
      }
      if (skill.author) {
        p.log.info(`  作者: ${skill.author}`);
      }
      p.log.info(`  版本: ${skill.version}`);
      console.log();
    }

    p.outro(pc.green(`搜索完成，找到 ${results.length} 个技能`));
  } catch (error) {
    s.stop('搜索失败');
    p.cancel(error instanceof Error ? error.message : '搜索失败');
  }
}
