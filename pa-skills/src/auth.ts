/**
 * 认证命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getGlobalAuthManager } from './pingancoder-auth.js';

export async function runAuth(args: string[]): Promise<void> {
  if (args.length === 0) {
    await showAuthHelp();
    return;
  }

  const action = args[0];

  switch (action) {
    case 'login':
      await runLogin();
      break;
    case 'logout':
      await runLogout();
      break;
    case 'status':
      await runStatusCheck();
      break;
    default:
      p.cancel(`未知的认证操作: ${action}`);
      await showAuthHelp();
  }
}

async function showAuthHelp(): Promise<void> {
  p.intro(pc.cyan('认证命令'));
  console.log();
  console.log(`  ${pc.cyan('pa-skills auth login')}   - 登录到内网服务`);
  console.log(`  ${pc.cyan('pa-skills auth logout')}  - 登出`);
  console.log(`  ${pc.cyan('pa-skills auth status')}  - 查看认证状态`);
  console.log();
}

async function runLogin(): Promise<void> {
  p.intro(pc.cyan('登录到 Pingancoder'));

  const username = await p.text({
    message: '请输入用户名',
    validate: (value) => {
      if (!value) return '请输入用户名';
      return undefined;
    },
  });

  if (p.isCancel(username)) {
    p.cancel('操作已取消');
    return;
  }

  const password = await p.password({
    message: '请输入密码',
    validate: (value) => {
      if (!value) return '请输入密码';
      return undefined;
    },
  });

  if (p.isCancel(password)) {
    p.cancel('操作已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在登录...');

  try {
    const authManager = getGlobalAuthManager();
    const session = await authManager.login(username, password);

    s.stop('登录成功');
    p.note(`欢迎, ${session.username}!`);
    p.outro(pc.green('✓ 登录成功'));
  } catch (error) {
    s.stop('登录失败');
    p.cancel(error instanceof Error ? error.message : '登录失败');
  }
}

async function runLogout(): Promise<void> {
  p.intro(pc.cyan('登出'));

  const shouldLogout = await p.confirm({
    message: '确定要登出吗？',
  });

  if (p.isCancel(shouldLogout) || !shouldLogout) {
    p.cancel('操作已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在登出...');

  try {
    const authManager = getGlobalAuthManager();
    await authManager.logout();

    s.stop('登出成功');
    p.outro(pc.green('✓ 已登出'));
  } catch (error) {
    s.stop('登出失败');
    p.cancel(error instanceof Error ? error.message : '登出失败');
  }
}

async function runStatusCheck(): Promise<void> {
  p.intro(pc.cyan('认证状态'));

  try {
    const authManager = getGlobalAuthManager();
    const status = await authManager.getStatus();

    if (status.authenticated) {
      p.note(`用户: ${status.username}`);
      p.note(`过期时间: ${status.expiresAt ? new Date(status.expiresAt).toLocaleString('zh-CN') : '未知'}`);
      p.outro(pc.green('✓ 已认证'));
    } else {
      p.note('未登录');
      p.outro(pc.yellow('请先登录: pa-skills auth login'));
    }
  } catch (error) {
    p.cancel(error instanceof Error ? error.message : '检查状态失败');
  }
}
