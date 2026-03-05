#!/usr/bin/env node

/**
 * Pingancoder Skills CLI 主入口
 * 基于原版 skills-main 改造
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import pc from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return '1.0.0';
  }
}

const VERSION = getVersion();

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[38;5;102m';
const TEXT = '\x1b[38;5;145m';

/**
 * 显示 PA-SKILLS logo（盒子风格）
 */
function showLogo(): void {
  const logo = `${pc.cyan(
'┌──────────────────────────────────────┐' + '\n' +
'│                                      │' + '\n' +
'│  ┌─┐┌─┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │' + '\n' +
'│  │P││A││- ││S ││K ││I ││L ││L ││S │  │' + '\n' +
'│  └─┘└─┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘  │' + '\n' +
'│                                      │' + '\n' +
'│     PA - SKILLS                      │' + '\n' +
'│                                      │' + '\n' +
'└──────────────────────────────────────┘'
)}`;
  console.log();
  console.log(logo);
}

function showBanner(): void {
  showLogo();
  console.log();
  console.log(`${DIM}Pingancoder Skills - 企业内网版本${RESET}`);
  console.log();
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills add ${pc.green('<source>')}${RESET}       ${DIM}添加技能${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills remove${RESET}              ${DIM}移除技能${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills list${RESET}                ${DIM}列出已安装技能${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills find ${pc.cyan('[query]')}${RESET}        ${DIM}搜索技能${RESET}`);
  console.log();
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills update${RESET}              ${DIM}更新技能${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills auth login${RESET}         ${DIM}登录认证${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}pa-skills auth status${RESET}         ${DIM}查看认证状态${RESET}`);
  console.log();
  console.log(`${DIM}示例:${RESET} pa-skills add code-review`);
  console.log();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showBanner();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'add': {
        const { runAdd } = await import('./add.js');
        await runAdd(commandArgs);
        break;
      }
      case 'remove':
      case 'rm': {
        const { runRemove } = await import('./remove.js');
        await runRemove(commandArgs);
        break;
      }
      case 'list':
      case 'ls': {
        const { runList } = await import('./list.js');
        await runList(commandArgs);
        break;
      }
      case 'find':
      case 'search': {
        const { runFind } = await import('./find.js');
        await runFind(commandArgs);
        break;
      }
      case 'update': {
        const { runUpdate } = await import('./update.js');
        await runUpdate(commandArgs);
        break;
      }
      case 'auth': {
        const { runAuth } = await import('./auth.js');
        await runAuth(commandArgs);
        break;
      }
      case 'status': {
        const { runStatus } = await import('./status.js');
        await runStatus(commandArgs);
        break;
      }
      case '-v':
      case '--version':
      case 'version': {
        console.log(`pa-skills v${VERSION}`);
        break;
      }
      case '-h':
      case '--help':
      case 'help': {
        showBanner();
        break;
      }
      default: {
        console.error(`${pc.red('错误')}: 未知命令 '${command}'`);
        console.log();
        console.log(`运行 ${pc.cyan('pa-skills --help')} 查看帮助`);
        process.exit(1);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`${pc.red('错误')}: ${error.message}`);
    } else {
      console.error(`${pc.red('错误')}: 未知错误`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
