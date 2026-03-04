/**
 * 开发模式启动脚本
 */

import { spawn } from 'child_process';
import { join } from 'path';

const cliPath = join(process.cwd(), 'src', 'cli.ts');

// 使用 tsx loader 运行 TypeScript
const args = [
  '--import',
  'tsx/import',
  cliPath,
  ...process.argv.slice(2),
];

const child = spawn('node', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
