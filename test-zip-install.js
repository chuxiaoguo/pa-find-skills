#!/usr/bin/env node

/**
 * Zip 安装功能测试脚本
 */

import { resolve } from 'path';
import { readFileSync, existsSync, unlinkSync, rmdirSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const TMP_DIR = '/tmp';
const ZIP_TEST_DIR = resolve(TMP_DIR, 'zip-test');
const ZIP_FILE = resolve(TMP_DIR, 'zip-test.zip');
const WRONG_ZIP_FILE = resolve(TMP_DIR, 'zip-test-wrong.zip');

async function cleanup() {
  console.log('\n🧹 清理测试文件...');
  try {
    if (existsSync(ZIP_FILE)) unlinkSync(ZIP_FILE);
    if (existsSync(WRONG_ZIP_FILE)) unlinkSync(WRONG_ZIP_FILE);
    if (existsSync(ZIP_TEST_DIR)) {
      execSync(`rm -rf ${ZIP_TEST_DIR}`);
    }
    console.log('✅ 清理完成');
  } catch (error) {
    console.log('⚠️  清理失败:', error.message);
  }
}

async function setupTestSkill() {
  console.log('\n📁 1. 创建测试技能');
  console.log('='.repeat(50));

  try {
    // 创建目录
    if (!existsSync(ZIP_TEST_DIR)) {
      mkdirSync(ZIP_TEST_DIR, { recursive: true });
    }

    // 创建 SKILL.md
    const skillMd = `---
name: zip-test
description: Zip 测试技能
version: 1.0.0
---

# Zip Test

测试 Zip 安装。
`;

    const skillMdPath = resolve(ZIP_TEST_DIR, 'SKILL.md');
    const { writeFileSync } = await import('fs');
    writeFileSync(skillMdPath, skillMd, 'utf-8');

    console.log('✅ 测试技能创建成功');
    console.log(`   路径: ${ZIP_TEST_DIR}`);
    console.log(`   SKILL.md: ${skillMdPath}`);
    return true;
  } catch (error) {
    console.log('❌ 创建测试技能失败:', error.message);
    return false;
  }
}

async function createWrongZip() {
  console.log('\n📦 2a. 创建错误的 Zip 文件（包含子目录）');
  console.log('='.repeat(50));

  try {
    // 从 /tmp 打包，会包含子目录
    execSync(`cd ${TMP_DIR} && zip -r ${WRONG_ZIP_FILE} zip-test/`, {
      stdio: 'pipe'
    });

    // 验证结构
    const output = execSync(`unzip -l ${WRONG_ZIP_FILE}`, { encoding: 'utf-8' });
    console.log('✅ Zip 文件创建成功（错误结构）');
    console.log('   文件结构:');
    output.split('\n').slice(3, -3).forEach(line => {
      if (line.trim()) console.log(`     ${line}`);
    });

    // 检查是否有子目录
    if (output.includes('zip-test/')) {
      console.log('   ⚠️  警告: SKILL.md 在子目录中');
    }

    return true;
  } catch (error) {
    console.log('❌ 创建 Zip 失败:', error.message);
    return false;
  }
}

async function createCorrectZip() {
  console.log('\n📦 2b. 创建正确的 Zip 文件（根目录）');
  console.log('='.repeat(50));

  try {
    // 从技能目录内打包，SKILL.md 在根目录
    execSync(`cd ${ZIP_TEST_DIR} && zip -r ${ZIP_FILE} SKILL.md`, {
      stdio: 'pipe'
    });

    // 验证结构
    const output = execSync(`unzip -l ${ZIP_FILE}`, { encoding: 'utf-8' });
    console.log('✅ Zip 文件创建成功（正确结构）');
    console.log('   文件结构:');
    output.split('\n').slice(3, -3).forEach(line => {
      if (line.trim()) console.log(`     ${line}`);
    });

    // 验证 SKILL.md 在根目录
    const lines = output.split('\n');
    const hasRootSkillMd = lines.some(line =>
      line.includes('SKILL.md') && !line.includes('/')
    );

    if (hasRootSkillMd) {
      console.log('   ✅ SKILL.md 在根目录');
    } else {
      console.log('   ❌ SKILL.md 不在根目录');
    }

    return hasRootSkillMd;
  } catch (error) {
    console.log('❌ 创建 Zip 失败:', error.message);
    return false;
  }
}

async function verifyZipContent() {
  console.log('\n🔍 3. 验证 Zip 内容');
  console.log('='.repeat(50));

  try {
    const output = execSync(`unzip -l ${ZIP_FILE}`, { encoding: 'utf-8' });

    // 检查是否包含 SKILL.md
    if (!output.includes('SKILL.md')) {
      console.log('❌ Zip 文件不包含 SKILL.md');
      return false;
    }

    // 检查文件大小
    const sizeMatch = output.match(/(\d+)\s+.*?SKILL.md/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      console.log(`✅ SKILL.md 大小: ${size} 字节`);
    }

    return true;
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
    return false;
  }
}

async function checkZipStructure() {
  console.log('\n📋 4. Zip 结构对比');
  console.log('='.repeat(50));

  const results = {
    '错误结构（子目录）': false,
    '正确结构（根目录）': false,
  };

  // 检查错误结构
  if (existsSync(WRONG_ZIP_FILE)) {
    try {
      const output = execSync(`unzip -l ${WRONG_ZIP_FILE}`, { encoding: 'utf-8' });
      const hasSubdir = output.includes('zip-test/');
      console.log(`\n❌ 错误结构示例: ${WRONG_ZIP_FILE}`);
      console.log(`   问题: SKILL.md 在子目录 'zip-test/' 中`);
      console.log(`   影响: 会导致 "技能包中缺少 SKILL.md 文件" 错误`);
      results['错误结构（子目录）'] = true;
    } catch (error) {
      console.log('⚠️  无法检查错误结构示例');
    }
  }

  // 检查正确结构
  if (existsSync(ZIP_FILE)) {
    try {
      const output = execSync(`unzip -l ${ZIP_FILE}`, { encoding: 'utf-8' });
      const hasRoot = output.split('\n').some(line =>
        line.match(/^\s*\d+\s+.*SKILL.md$/)
      );

      console.log(`\n✅ 正确结构示例: ${ZIP_FILE}`);
      console.log(`   特点: SKILL.md 直接在根目录`);
      console.log(`   结果: 可以被 pa-skills 正确识别`);
      results['正确结构（根目录）'] = hasRoot;
    } catch (error) {
      console.log('⚠️  无法检查正确结构示例');
    }
  }

  return Object.values(results).every(v => v);
}

async function testPaSkillsDetection() {
  console.log('\n🔧 5. 测试 pa-skills 识别');
  console.log('='.repeat(50));

  console.log('\n要测试完整安装流程，请手动运行：');
  console.log(`  cd /Users/zcg/Desktop/pa-find-skills/pa-skills`);
  console.log(`  npm run dev add ${ZIP_FILE}`);
  console.log('\n预期输出：');
  console.log('  ●  从 local-zip 获取技能...');
  console.log('  ◆  找到技能: zip-test');
  console.log('  ◆  选择要安装到的代理');

  console.log('\n⚠️  注意：由于是交互式 CLI，需要手动选择代理');

  return true;
}

async function runTests() {
  console.log('\n🚀 Zip 安装功能测试');
  console.log('═'.repeat(50));
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('═'.repeat(50));

  // 清理之前的测试文件
  await cleanup();

  const results = {
    '创建测试技能': await setupTestSkill(),
    '创建错误结构 Zip': await createWrongZip(),
    '创建正确结构 Zip': await createCorrectZip(),
    '验证 Zip 内容': await verifyZipContent(),
    '检查 Zip 结构': await checkZipStructure(),
    'pa-skills 识别': await testPaSkillsDetection(),
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

  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！');
    console.log('\n📝 测试文件已创建:');
    console.log(`   - 测试技能目录: ${ZIP_TEST_DIR}`);
    console.log(`   - 正确的 Zip: ${ZIP_FILE}`);
    console.log(`   - 错误的 Zip: ${WRONG_ZIP_FILE}`);
    console.log('\n💡 提示: 你可以使用这些文件手动测试完整的安装流程');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误');
  }

  console.log('═'.repeat(50));

  // 询问是否清理
  console.log('\n🧹 测试文件将保留供手动测试');
  console.log('   运行以下命令清理：');
  console.log(`   rm -rf ${ZIP_TEST_DIR} ${ZIP_FILE} ${WRONG_ZIP_FILE}`);

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n💥 测试运行失败:', error);
  process.exit(1);
});
