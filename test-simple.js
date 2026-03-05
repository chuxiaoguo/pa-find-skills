#!/usr/bin/env node

/**
 * 简化版测试脚本：验证测试技能文件结构
 */

import { resolve } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';

const TEST_SKILL_PATH = '/tmp/test-skill';

async function testSkillStructure() {
  console.log('\n🔍 测试 1: 测试技能文件结构');
  console.log('=' .repeat(50));

  if (!existsSync(TEST_SKILL_PATH)) {
    console.log('❌ 测试技能目录不存在:', TEST_SKILL_PATH);
    return false;
  }

  console.log('✅ 测试技能目录存在');

  const files = readdirSync(TEST_SKILL_PATH);
  console.log(`   目录内容: ${files.join(', ')}`);

  const skillMdPath = resolve(TEST_SKILL_PATH, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    console.log('❌ SKILL.md 不存在');
    return false;
  }

  console.log('✅ SKILL.md 存在');
  return true;
}

async function testSkillMetadata() {
  console.log('\n📄 测试 2: SKILL.md 元数据');
  console.log('=' .repeat(50));

  const skillMdPath = resolve(TEST_SKILL_PATH, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.log('❌ SKILL.md 文件不存在');
    return false;
  }

  try {
    const content = readFileSync(skillMdPath, 'utf-8');
    const lines = content.split('\n');

    // 检查 YAML frontmatter
    const frontmatterEnd = lines.indexOf('---', 1);
    if (frontmatterEnd === -1) {
      console.log('❌ 未找到 YAML frontmatter 结束标记');
      return false;
    }

    const frontmatter = lines.slice(1, frontmatterEnd).join('\n');

    // 解析基本字段
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    const versionMatch = frontmatter.match(/version:\s*(.+)/);

    if (!nameMatch) {
      console.log('❌ 缺少 name 字段');
      return false;
    }

    console.log('✅ SKILL.md 元数据完整:');
    console.log(`   名称: ${nameMatch[1].trim()}`);
    console.log(`   描述: ${descMatch ? descMatch[1].trim() : '无'}`);
    console.log(`   版本: ${versionMatch ? versionMatch[1].trim() : '无'}`);

    return true;
  } catch (error) {
    console.log('❌ 读取 SKILL.md 失败:', error.message);
    return false;
  }
}

async function testProjectStructure() {
  console.log('\n📁 测试 3: pa-skills 项目结构');
  console.log('=' .repeat(50));

  const projectPath = resolve('./pa-skills');

  if (!existsSync(projectPath)) {
    console.log('❌ pa-skills 目录不存在');
    return false;
  }

  console.log('✅ pa-skills 目录存在');

  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/cli.ts',
    'src/add.ts',
    'src/remove.ts',
    'src/list.ts',
  ];

  let allExist = true;
  for (const file of requiredFiles) {
    const filePath = resolve(projectPath, file);
    const exists = existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
    if (!exists) allExist = false;
  }

  return allExist;
}

async function testLockFile() {
  console.log('\n🔒 测试 4: 锁文件');
  console.log('=' .repeat(50));

  const lockPath = resolve('./pa-skills/skills-lock.json');

  if (!existsSync(lockPath)) {
    console.log('❌ 锁文件不存在');
    return false;
  }

  try {
    const lockContent = JSON.parse(readFileSync(lockPath, 'utf-8'));
    const skills = lockContent.skills || {};
    const skillNames = Object.keys(skills);

    console.log('✅ 锁文件格式正确');
    console.log(`   版本: ${lockContent.version}`);
    console.log(`   已安装技能数量: ${skillNames.length}`);
    console.log(`   技能列表: ${skillNames.join(', ') || '无'}`);

    return true;
  } catch (error) {
    console.log('❌ 解析锁文件失败:', error.message);
    return false;
  }
}

async function testDependencies() {
  console.log('\n📦 测试 5: 依赖安装');
  console.log('=' .repeat(50));

  const nodeModulesPath = resolve('./pa-skills/node_modules');

  if (!existsSync(nodeModulesPath)) {
    console.log('❌ node_modules 不存在，需要运行 npm install');
    return false;
  }

  console.log('✅ 依赖已安装');

  // 检查关键依赖
  const keyDeps = ['@clack/prompts', 'picocolors', 'tsx', 'typescript'];
  let allInstalled = true;

  for (const dep of keyDeps) {
    const depPath = resolve(nodeModulesPath, dep);
    const exists = existsSync(depPath);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${dep}`);
    if (!exists) allInstalled = false;
  }

  return allInstalled;
}

async function runTests() {
  console.log('\n🚀 pa-skills 本地技能安装简化测试');
  console.log('═'.repeat(50));
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('═'.repeat(50));

  const results = {
    '测试技能文件结构': await testSkillStructure(),
    'SKILL.md 元数据': await testSkillMetadata(),
    'pa-skills 项目结构': await testProjectStructure(),
    '锁文件检查': await testLockFile(),
    '依赖安装': await testDependencies(),
  };

  console.log('\n📊 测试结果汇总');
  console.log('═'.repeat(50));

  let passCount = 0;
  let failCount = 0;

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${test}`);
    if (passed) passCount++;
    else failCount++;
  });

  console.log('═'.repeat(50));
  console.log(`总计: ${passCount} 通过, ${failCount} 失败`);

  if (passCount === results.length) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误');
  }

  console.log('═'.repeat(50));

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n💥 测试运行失败:', error);
  process.exit(1);
});
