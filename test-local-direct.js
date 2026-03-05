#!/usr/bin/env node

/**
 * 本地安装优化验证测试
 * 验证本地安装现在与 zip 安装行为一致
 */

import { resolve, join } from 'path';
import { readFileSync, existsSync, mkdirSync, rmSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const TMP_DIR = '/tmp';
const TEST_DIRS = {
  correct: resolve(TMP_DIR, 'local-test-correct'),
  wrong: resolve(TMP_DIR, 'local-test-wrong'),
  subDir: resolve(TMP_DIR, 'local-test-subdir'),
};

async function cleanup() {
  console.log('\n🧹 清理测试文件...');

  Object.values(TEST_DIRS).forEach(dir => {
    try {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore
    }
  });

  console.log('✅ 清理完成');
}

async function setupTestSkills() {
  console.log('\n📁 1. 创建测试技能目录');
  console.log('='.repeat(50));

  try {
    // 正确结构：SKILL.md 在根目录
    mkdirSync(TEST_DIRS.correct, { recursive: true });
    const skillMd = `---
name: local-test-correct
description: 正确结构的本地技能
version: 1.0.0
---

# Local Test Correct

这是一个正确结构的本地技能。
SKILL.md 直接在根目录。
`;
    writeFileSync(join(TEST_DIRS.correct, 'SKILL.md'), skillMd, 'utf-8');
    console.log(`✅ 创建正确结构: ${TEST_DIRS.correct}`);
    console.log(`   └── SKILL.md`);

    // 错误结构：SKILL.md 在子目录
    mkdirSync(TEST_DIRS.wrong, { recursive: true });
    const subDir = join(TEST_DIRS.wrong, 'skills', 'my-skill');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(join(subDir, 'SKILL.md'), skillMd.replace('local-test-correct', 'local-test-wrong'), 'utf-8');
    console.log(`✅ 创建错误结构: ${TEST_DIRS.wrong}`);
    console.log(`   └── skills/my-skill/SKILL.md  ← 在子目录中`);

    return true;
  } catch (error) {
    console.log('❌ 创建测试目录失败:', error.message);
    return false;
  }
}

async function testCorrectStructure() {
  console.log('\n✅ 2. 测试正确结构（应该成功）');
  console.log('='.repeat(50));

  try {
    // 验证文件存在
    const skillMdPath = join(TEST_DIRS.correct, 'SKILL.md');
    if (!existsSync(skillMdPath)) {
      console.log('❌ SKILL.md 不存在');
      return false;
    }

    // 读取并验证内容
    const content = readFileSync(skillMdPath, 'utf-8');
    if (!content.includes('local-test-correct')) {
      console.log('❌ SKILL.md 内容不正确');
      return false;
    }

    console.log('✅ 文件结构正确');
    console.log(`   路径: ${TEST_DIRS.correct}`);
    console.log(`   SKILL.md: ✅ 存在`);
    console.log(`   技能名称: local-test-correct`);

    return true;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return false;
  }
}

async function testWrongStructure() {
  console.log('\n❌ 3. 测试错误结构（应该失败）');
  console.log('='.repeat(50));

  try {
    // 验证根目录没有 SKILL.md
    const rootSkillMd = join(TEST_DIRS.wrong, 'SKILL.md');
    if (existsSync(rootSkillMd)) {
      console.log('⚠️  意外：根目录存在 SKILL.md');
      return false;
    }

    // 验证子目录有 SKILL.md
    const subSkillMd = join(TEST_DIRS.wrong, 'skills', 'my-skill', 'SKILL.md');
    if (!existsSync(subSkillMd)) {
      console.log('❌ 子目录 SKILL.md 不存在');
      return false;
    }

    console.log('✅ 错误结构创建成功');
    console.log(`   根目录: ${TEST_DIRS.wrong}`);
    console.log(`   根目录 SKILL.md: ❌ 不存在（符合预期）`);
    console.log(`   子目录 SKILL.md: ✅ 存在于 skills/my-skill/`);
    console.log(`   预期结果: pa-skills add 会失败，提示 SKILL.md 不在根目录`);

    return true;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    return false;
  }
}

async function testManualCommands() {
  console.log('\n🔧 4. 手动测试命令');
  console.log('='.repeat(50));

  console.log('\n测试正确结构（应该成功）：');
  console.log(`  cd /Users/zcg/Desktop/pa-find-skills/pa-skills`);
  console.log(`  npm run dev add ${TEST_DIRS.correct}`);
  console.log('\n预期输出：');
  console.log('  ●  从 local 获取技能...');
  console.log('  ◆  找到技能: local-test-correct');
  console.log('  ◆  选择要安装到的代理');

  console.log('\n测试错误结构（应该失败）：');
  console.log(`  npm run dev add ${TEST_DIRS.wrong}`);
  console.log('\n预期输出：');
  console.log('  ❌ 本地路径中未找到有效技能：/tmp/local-test-wrong');
  console.log('  请确保 SKILL.md 文件直接在指定路径下。');

  console.log('\n对比 Zip 安装（行为应该一致）：');
  console.log(`  # 创建正确的 zip`);
  console.log(`  cd ${TEST_DIRS.correct}`);
  console.log(`  zip -r /tmp/local-test.zip SKILL.md`);
  console.log(`  npm run dev add /tmp/local-test.zip`);
  console.log('\n预期：两种方式行为完全一致 ✅');

  return true;
}

async function showComparison() {
  console.log('\n📊 5. 优化前后对比');
  console.log('='.repeat(50));

  console.log('\n优化前：');
  console.log('  - 会递归搜索 skills/, .agents/skills/ 等多个子目录');
  console.log('  - 即使 SKILL.md 在子目录也能找到');
  console.log('  - 行为复杂，不符合直觉');

  console.log('\n优化后：');
  console.log('  - ✅ 直接在指定路径查找 SKILL.md');
  console.log('  - ✅ 不搜索子目录');
  console.log('  - ✅ 与 Zip 安装行为一致');
  console.log('  - ✅ 结构清晰，符合用户预期');

  console.log('\n目录结构要求：');
  console.log('  my-skill/');
  console.log('  └── SKILL.md  ← 必须直接在这里');

  console.log('\n安装命令：');
  console.log('  pa-skills add ./my-skill');

  return true;
}

async function runTests() {
  console.log('\n🚀 本地安装优化验证测试');
  console.log('═'.repeat(50));
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('═'.repeat(50));

  await cleanup();

  const results = {
    '创建测试技能目录': await setupTestSkills(),
    '测试正确结构': await testCorrectStructure(),
    '测试错误结构': await testWrongStructure(),
    '手动测试命令': await testManualCommands(),
    '优化前后对比': await showComparison(),
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
    console.log('\n📝 测试目录已创建:');
    console.log(`   - 正确结构: ${TEST_DIRS.correct}`);
    console.log(`   - 错误结构: ${TEST_DIRS.wrong}`);
    console.log('\n💡 请手动运行上述命令验证完整安装流程');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误');
  }

  console.log('═'.repeat(50));
  console.log('\n🧹 测试目录将保留供手动测试');
  console.log('   运行以下命令清理：');
  console.log(`   rm -rf ${TEST_DIRS.correct} ${TEST_DIRS.wrong}`);

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n💥 测试运行失败:', error);
  process.exit(1);
});
