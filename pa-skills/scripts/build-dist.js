/**
 * 构建脚本
 * 确保所有必要的文件都被正确构建
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

console.log('开始构建...');

try {
  // 创建 dist 目录
  const distDir = join(process.cwd(), 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // 运行 TypeScript 编译
  console.log('编译 TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // 复制 package.json 到 dist
  console.log('复制配置文件...');
  copyFileSync('package.json', join(distDir, 'package.json'));

  console.log('构建完成！');
} catch (error) {
  console.error('构建失败:', error);
  process.exit(1);
}
