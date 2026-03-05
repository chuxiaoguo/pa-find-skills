/**
 * 创建 Mock Zip 文件
 * 为测试生成有效的技能包 zip 文件
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

async function createMockZip(
  id: string,
  name: string,
  description: string,
  version: string,
  author: string,
  category: string
) {
  const skillContent = `---
name: ${name}
description: ${description}
version: ${version}
author: ${author}
category: ${category}
---

# ${name}

${description}

## 功能特性

- 功能 1: ${name} 的核心功能
- 功能 2: 支持多种配置
- 功能 3: 易于集成

## 使用方法

\`\`\`bash
pa-skills add ${id}
\`\`\`

## 版本历史

- v${version}: 初始版本

## 作者

${author}

## 许可证

MIT
`;

  // 创建临时目录
  const tempDir = join(process.cwd(), 'test', 'mocks', 'temp', id);
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  // 写入 SKILL.md
  const skillFile = join(tempDir, 'SKILL.md');
  await writeFile(skillFile, skillContent, 'utf-8');

  // 创建 zip 文件
  const zip = new AdmZip();
  zip.addFile('SKILL.md', skillContent);

  const outputPath = join(process.cwd(), 'test', 'mocks', 'zips', `${id}-skill-v${version}.zip`);
  zip.writeZip(outputPath);

  console.log(`✓ 创建 zip 文件: ${outputPath}`);

  return outputPath;
}

async function main() {
  console.log('创建 Mock Zip 文件...\n');

  // 确保目标目录存在
  const zipsDir = join(process.cwd(), 'test', 'mocks', 'zips');
  if (!existsSync(zipsDir)) {
    await mkdir(zipsDir, { recursive: true });
  }

  // 创建三个技能的 zip 文件
  await createMockZip(
    '1',
    'Code Review',
    '智能代码审查技能，帮助识别代码问题并提供改进建议',
    '1.2.0',
    'Pingancoder Team',
    '代码质量'
  );

  await createMockZip(
    '2',
    'React Components Generator',
    '基于描述生成 React 组件代码，支持 TypeScript 和样式',
    '2.0.1',
    'Frontend Team',
    '代码生成'
  );

  await createMockZip(
    '3',
    'Database Schema Designer',
    '数据库表结构设计工具，支持 ER 图生成和 SQL 导出',
    '1.5.3',
    'DBA Team',
    '数据库'
  );

  console.log('\n✓ 所有 Mock Zip 文件创建完成！');
}

main().catch(console.error);
