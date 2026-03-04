/**
 * 健康检查脚本
 * 验证项目配置和依赖
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('Pingancoder Skills 健康检查');
console.log('='.repeat(40));

let hasErrors = false;

// 检查必要的文件
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'src/types.ts',
  'src/cli.ts',
  'src/agents.ts',
  'src/providers/index.ts',
];

console.log('\n检查必要文件...');
for (const file of requiredFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - 缺失`);
    hasErrors = true;
  }
}

// 检查依赖
console.log('\n检查依赖...');
try {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = ['@clack/prompts', 'picocolors', 'gray-matter', 'extract-zip'];
  for (const dep of requiredDeps) {
    if (dependencies[dep]) {
      console.log(`  ✓ ${dep}`);
    } else {
      console.log(`  ✗ ${dep} - 缺失`);
      hasErrors = true;
    }
  }
} catch (error) {
  console.log('  ✗ 无法读取 package.json');
  hasErrors = true;
}

// 检查 TypeScript 配置
console.log('\n检查 TypeScript 配置...');
try {
  const tsconfigPath = join(process.cwd(), 'tsconfig.json');
  const tsconfigContent = readFileSync(tsconfigPath, 'utf-8');
  const tsconfig = JSON.parse(tsconfigContent);
  if (tsconfig.compilerOptions) {
    console.log('  ✓ TypeScript 配置有效');
  } else {
    console.log('  ✗ TypeScript 配置无效');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ✗ 无法读取 tsconfig.json');
  hasErrors = true;
}

// 总结
console.log('\n' + '='.repeat(40));
if (hasErrors) {
  console.log('❌ 检查失败，请修复上述错误');
  process.exit(1);
} else {
  console.log('✅ 所有检查通过！');
  console.log('\n你可以运行以下命令开始开发：');
  console.log('  pnpm install  # 安装依赖');
  console.log('  pnpm dev      # 开发模式');
  console.log('  pnpm build    # 构建');
}
