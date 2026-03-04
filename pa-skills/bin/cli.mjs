#!/usr/bin/env node

/**
 * Pingancoder Skills 主入口
 * 企业内网版本技能管理工具
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// 获取当前文件的目录
const __dirname = dirname(fileURLToPath(import.meta.url));

// 动态导入并执行 CLI
async function main() {
  try {
    // 从 dist 运行编译后的代码
    // 使用 resolve 来确保路径正确
    const cliPath = resolve(__dirname, '..', 'dist', 'cli.js');

    // 在 Windows 上，转换为 file:// URL
    const fileUrl = `file:///${cliPath.replace(/\\/g, '/')}`;

    await import(fileUrl);
  } catch (error) {
    console.error('无法启动 CLI:', error);
    process.exit(1);
  }
}

main();
