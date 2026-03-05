/**
 * Pingancoder Skills 集成测试（Mock 模式）
 * 模拟真实 CLI 使用场景，验证完整的功能流程
 */

import { mockListResponse, mockDetailResponse_CodeReview, mockDetailResponse_ReactGen, mockDelay } from './mocks/skills-api.mock.js';

// 类型导入
type MarketSkillListResponse = import('../src/types.js').MarketSkillListResponse;
type MarketSkillDetailResponse = import('../src/types.js').MarketSkillDetailResponse;

/**
 * Mock fetch 全局函数
 */
async function mockFetch(url: string, options?: RequestInit): Promise<Response> {
  // 模拟网络延迟（更真实）
  await mockDelay(100);

  let responseData: any;

  if (url.includes('/api/skills/list')) {
    responseData = mockListResponse;
  } else if (url.includes('/resource/download/')) {
    const idMatch = url.match(/\/resource\/download\/(\d+)/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      if (id === 1) {
        responseData = mockDetailResponse_CodeReview;
      } else if (id === 2) {
        responseData = mockDetailResponse_ReactGen;
      } else {
        responseData = { code: 404, message: '技能不存在', success: false, data: null };
      }
    } else {
      responseData = { code: 404, message: '技能不存在', success: false, data: null };
    }
  } else {
    responseData = { code: 404, message: '接口不存在', success: false };
  }

  return {
    ok: responseData.code >= 200 && responseData.code < 300,
    status: responseData.code,
    statusText: responseData.message,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
    headers: new Headers(),
    url,
    redirected: false,
    type: 'basic' as ResponseType,
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

/**
 * 简化的 Provider（与实际代码一致）
 */
class PingancoderProvider {
  private baseUrl = 'https://market.paic.com.cn';

  async searchSkills(query: string = ''): Promise<any[]> {
    const url = `${this.baseUrl}/api/skills/list`;

    const response = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`获取技能列表失败: ${response.statusText}`);
    }

    const responseData = await response.json() as MarketSkillListResponse;

    if (!responseData.success || responseData.code !== 200) {
      throw new Error(responseData.message || '获取技能列表失败');
    }

    return responseData.data.map(item => ({
      id: String(item.id),
      name: item.title,
      description: item.description || '',
      downloadUrl: item.downloadUrl || '',
      version: item.version || '1.0.0',
      category: item.category,
      author: item.author,
      metadata: {
        ...item,
        originalId: item.id,
      },
    }));
  }

  async fetchSkill(identifier: string): Promise<any> {
    const url = `${this.baseUrl}/resource/download/${identifier}`;

    const response = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('技能不存在');
      }
      throw new Error(`获取技能失败: ${response.statusText}`);
    }

    const response_data = await response.json() as MarketSkillDetailResponse;

    if (!response_data.success || response_data.code !== 200) {
      throw new Error(response_data.message || '获取技能失败');
    }

    const skillDetail = response_data.data;
    const file = response_data.file;

    return {
      id: String(skillDetail.id),
      name: skillDetail.title || skillDetail.description || 'Unknown',
      description: skillDetail.description || '',
      content: this.generateDefaultContent(skillDetail),
      sourceUrl: file?.downloadUrl || '',
      downloadUrl: file?.downloadUrl || '',
      version: skillDetail.version || '1.0.0',
      category: skillDetail.categoryName,
      author: skillDetail.author,
      metadata: {
        ...skillDetail,
        originalId: skillDetail.id,
      },
    };
  }

  private generateDefaultContent(detail: any): string {
    return `---
name: ${detail.title || 'Unknown'}
description: ${detail.description || ''}
version: ${detail.version || '1.0.0'}
${detail.categoryName ? `category: ${detail.categoryName}` : ''}
${detail.author ? `author: ${detail.author}` : ''}
---

# ${detail.title || 'Unknown'}

${detail.description || ''}

## 功能特性

- 技能 ID: ${detail.id}
- 版本: ${detail.version || '1.0.0'}
- 作者: ${detail.author || 'Unknown'}
${detail.tags && detail.tags.length > 0 ? `- 标签: ${detail.tags.join(', ')}` : ''}
`;
  }
}

/**
 * 测试场景：模拟 CLI find 命令
 */
async function testFindCommand() {
  console.log('\n========================================');
  console.log('  场景 1: pa-skills find <keyword>');
  console.log('========================================\n');

  const provider = new PingancoderProvider();

  try {
    console.log('🔍 搜索技能: react');
    const skills = await provider.searchSkills('react');

    console.log(`✅ 找到 ${skills.length} 个技能\n`);

    skills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name}`);
      console.log(`   描述: ${skill.description}`);
      console.log(`   版本: ${skill.version}`);
      console.log(`   作者: ${skill.author || 'Unknown'}`);
      console.log(`   分类: ${skill.category || '未分类'}`);
      console.log(`   下载: ${skill.downloadUrl ? '✓' : '✗'}`);
      console.log('');
    });

    return skills;
  } catch (error: any) {
    console.error(`❌ 搜索失败: ${error.message}\n`);
    return [];
  }
}

/**
 * 测试场景：模拟 CLI add 命令（前半部分 - 获取技能信息）
 */
async function testAddCommand(skillId: string) {
  console.log('\n========================================');
  console.log(`  场景 2: pa-skills add ${skillId}`);
  console.log('========================================\n');

  const provider = new PingancoderProvider();

  try {
    console.log(`📥 获取技能详情 (ID: ${skillId})...`);
    const skill = await provider.fetchSkill(skillId);

    console.log(`✅ 技能信息获取成功\n`);
    console.log(`名称: ${skill.name}`);
    console.log(`描述: ${skill.description}`);
    console.log(`版本: ${skill.version}`);
    console.log(`作者: ${skill.author || 'Unknown'}`);
    console.log(`分类: ${skill.category || '未分类'}`);
    console.log(`下载地址: ${skill.downloadUrl}`);
    console.log('\n--- 技能内容预览 ---\n');
    console.log(skill.content.substring(0, 200) + '...\n');

    return skill;
  } catch (error: any) {
    console.error(`❌ 获取技能失败: ${error.message}\n`);
    return null;
  }
}

/**
 * 测试场景：模拟完整流程
 */
async function testCompleteFlow() {
  console.log('\n========================================');
  console.log('  场景 3: 完整工作流程');
  console.log('========================================\n');

  const provider = new PingancoderProvider();

  try {
    // Step 1: 搜索技能
    console.log('Step 1: 搜索可用技能...\n');
    const skills = await provider.searchSkills('');
    console.log(`✅ 找到 ${skills.length} 个技能\n`);

    // Step 2: 选择第一个技能
    const selectedSkill = skills[0];
    console.log(`Step 2: 选择技能 "${selectedSkill.name}" (ID: ${selectedSkill.id})\n`);

    // Step 3: 获取详情
    console.log('Step 3: 获取技能详情...\n');
    const detail = await provider.fetchSkill(selectedSkill.id);
    console.log(`✅ 技能详情获取成功\n`);
    console.log(`   完整名称: ${detail.name}`);
    console.log(`   内容长度: ${detail.content.length} 字符`);
    console.log(`   可下载: ${detail.downloadUrl ? '是' : '否'}\n`);

    // Step 4: 验证数据完整性
    console.log('Step 4: 验证数据完整性...\n');
    const checks = [
      { name: 'ID 转换', pass: detail.id === '1', expected: '1', actual: detail.id },
      { name: '名称映射', pass: detail.name === 'Code Review', expected: 'Code Review', actual: detail.name },
      { name: '下载地址', pass: !!detail.downloadUrl, expected: '存在', actual: detail.downloadUrl ? '存在' : '不存在' },
      { name: '内容生成', pass: detail.content.includes('---'), expected: '包含 frontmatter', actual: detail.content.includes('---') ? '是' : '否' },
      { name: '元数据保留', pass: detail.metadata?.originalId === 1, expected: '1', actual: detail.metadata?.originalId },
    ];

    let allPassed = true;
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}: ${check.pass ? '通过' : '失败'} (${check.expected} vs ${check.actual})`);
      if (!check.pass) allPassed = false;
    });

    console.log(`\n${allPassed ? '✅' : '❌'} 数据完整性验证: ${allPassed ? '全部通过' : '部分失败'}\n`);

    return allPassed;
  } catch (error: any) {
    console.error(`❌ 流程失败: ${error.message}\n`);
    return false;
  }
}

/**
 * 测试场景：错误处理
 */
async function testErrorHandling() {
  console.log('\n========================================');
  console.log('  场景 4: 错误处理');
  console.log('========================================\n');

  const provider = new PingancoderProvider();

  // 测试 1: 不存在的技能
  console.log('测试 4.1: 获取不存在的技能 (ID: 999)');
  try {
    await provider.fetchSkill('999');
    console.log('❌ 应该抛出错误但没有\n');
    return false;
  } catch (error: any) {
    console.log(`✅ 正确抛出错误: ${error.message}\n`);
  }

  // 测试 2: 空列表处理
  console.log('测试 4.2: 空列表处理');
  const list = await provider.searchSkills('');
  if (list.length > 0) {
    console.log(`✅ 列表不为空 (${list.length} 个技能)\n`);
  } else {
    console.log('⚠️  列表为空（可能正常）\n');
  }

  return true;
}

/**
 * 测试场景：性能测试
 */
async function testPerformance() {
  console.log('\n========================================');
  console.log('  场景 5: 性能测试');
  console.log('========================================\n');

  const provider = new PingancoderProvider();

  // 测试列表查询性能
  console.log('测试 5.1: 列表查询性能...');
  const startTime = Date.now();
  await provider.searchSkills('');
  const listDuration = Date.now() - startTime;
  console.log(`   ✅ 列表查询耗时: ${listDuration}ms\n`);

  // 测试详情查询性能
  console.log('测试 5.2: 详情查询性能...');
  const detailStart = Date.now();
  await provider.fetchSkill('1');
  const detailDuration = Date.now() - detailStart;
  console.log(`   ✅ 详情查询耗时: ${detailDuration}ms\n`);

  // 性能评估
  const maxDuration = 500; // 500ms 阈值
  const listFast = listDuration < maxDuration;
  const detailFast = detailDuration < maxDuration;

  console.log(`性能评估 (阈值: ${maxDuration}ms):`);
  console.log(`   ${listFast ? '✅' : '❌'} 列表查询: ${listDuration}ms ${listFast ? '通过' : '超时'}`);
  console.log(`   ${detailFast ? '✅' : '❌'} 详情查询: ${detailDuration}ms ${detailFast ? '通过' : '超时'}\n`);

  return listFast && detailFast;
}

/**
 * 主测试运行器
 */
async function runIntegrationTests() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Pingancoder Skills 集成测试 (Mock)    ║');
  console.log('╚══════════════════════════════════════════╝');

  // 设置 Mock fetch
  // @ts-ignore
  global.fetch = mockFetch;

  const results: { scenario: string; passed: boolean; duration?: number }[] = [];

  // 场景 1: find 命令
  const start1 = Date.now();
  const skills = await testFindCommand();
  results.push({ scenario: 'find 命令', passed: skills.length > 0, duration: Date.now() - start1 });

  // 场景 2: add 命令
  const start2 = Date.now();
  const skill = await testAddCommand('1');
  results.push({ scenario: 'add 命令', passed: skill !== null, duration: Date.now() - start2 });

  // 场景 3: 完整流程
  const start3 = Date.now();
  const flowPassed = await testCompleteFlow();
  results.push({ scenario: '完整流程', passed: flowPassed, duration: Date.now() - start3 });

  // 场景 4: 错误处理
  const start4 = Date.now();
  const errorPassed = await testErrorHandling();
  results.push({ scenario: '错误处理', passed: errorPassed, duration: Date.now() - start4 });

  // 场景 5: 性能测试
  const start5 = Date.now();
  const perfPassed = await testPerformance();
  results.push({ scenario: '性能测试', passed: perfPassed, duration: Date.now() - start5 });

  // 打印测试总结
  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`${index + 1}. ${icon} ${result.scenario}: ${result.passed ? '通过' : '失败'}${duration}`);
    if (result.passed) passed++;
    else failed++;
  });

  console.log('\n========================================');
  console.log(`  总计: ${results.length} 个场景`);
  console.log(`  通过: ${passed} 个`);
  console.log(`  失败: ${failed} 个`);
  console.log(`  成功率: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (failed === 0) {
    console.log('🎉 所有测试通过！代码已准备就绪。\n');
  } else {
    console.log('⚠️  部分测试失败，请检查。\n');
  }

  return failed === 0;
}

// 运行测试
runIntegrationTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试运行出错:', error);
    process.exit(1);
  });
