#!/usr/bin/env node

/**
 * 自动化测试脚本：测试技能安装的核心功能
 * 不需要交互式输入
 */

import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import { parseSource } from './pa-skills/src/source-parser.js';
import { discoverSkills } from './pa-skills/src/skills.js';
import { getSkillFromLock } from './pa-skills/src/skill-lock.js';

const TEST_SKILL_PATH = '/tmp/test-skill';

async function testSkillParsing() {
  console.log('\n📋 测试 1: 技能路径解析');
  console.log('=' .repeat(50));

  try {
    const parsed = parseSource(TEST_SKILL_PATH);
    console.log('✅ 路径解析成功:');
    console.log(`   类型: ${parsed.type}`);
    console.log(`   本地路径: ${parsed.localPath}`);
    console.log(`   子路径: ${parsed.subpath || '无'}`);
    return true;
  } catch (error) {
    console.log('❌ 路径解析失败:', error.message);
    return false;
  }
}

async function testSkillDiscovery() {
  console.log('\n🔍 测试 2: 技能发现');
  console.log('=' .repeat(50));

  try {
    const skills = await discoverSkills(TEST_SKILL_PATH);
    console.log(`✅ 发现 ${skills.length} 个技能:`);

    skills.forEach((skill, index) => {
      console.log(`\n   技能 ${index + 1}:`);
      console.log(`   - 名称: ${skill.name}`);
      console.log(`   - 描述: ${skill.description}`);
      console.log(`   - 版本: ${skill.version}`);
      console.log(`   - 路径: ${skill.path}`);
    });

    return skills.length > 0;
  } catch (error) {
    console.log('❌ 技能发现失败:', error.message);
    return false;
  }
}

async function testSkillMetadata() {
  console.log('\n📄 测试 3: SKILL.md 元数据解析');
  console.log('=' .repeat(50));

  const skillMdPath = resolve(TEST_SKILL_PATH, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.log('❌ SKILL.md 文件不存在');
    return false;
  }

  try {
    const content = readFileSync(skillMdPath, 'utf-8');
    console.log('✅ SKILL.md 读取成功');
    console.log('\n   文件内容:');
    console.log('   ' + '─'.repeat(46));
    content.split('\n').forEach(line => {
      console.log('   ' + line);
    });
    console.log('   ' + '─'.repeat(46));
    return true;
  } catch (error) {
    console.log('❌ 读取 SKILL.md 失败:', error.message);
    return false;
  }
}

async function testLockFile() {
  console.log('\n🔒 测试 4: 锁文件检查');
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

    console.log(`✅ 锁文件读取成功`);
    console.log(`   已安装技能数量: ${skillNames.length}`);
    console.log(`   技能列表: ${skillNames.join(', ') || '无'}`);

    // 检查测试技能是否在锁文件中
    const testSkillInLock = await getSkillFromLock('test-skill');
    if (testSkillInLock) {
      console.log(`\n   ✅ test-skill 在锁文件中:`);
      console.log(`      来源: ${testSkillInLock.source}`);
      console.log(`      类型: ${testSkillInLock.sourceType}`);
    }

    return true;
  } catch (error) {
    console.log('❌ 读取锁文件失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 pa-skills 本地技能安装测试');
  console.log('═'.repeat(50));

  const results = {
    '技能路径解析': await testSkillParsing(),
    '技能发现': await testSkillDiscovery(),
    '元数据解析': await testSkillMetadata(),
    '锁文件检查': await testLockFile(),
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
  console.log('═'.repeat(50));

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n💥 测试运行失败:', error);
  process.exit(1);
});
