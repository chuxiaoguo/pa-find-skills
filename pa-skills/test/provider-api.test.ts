/**
 * Pingancoder Provider API 测试
 * 使用 Mock 数据验证 API 调用逻辑
 */

import { mockListResponse, mockDetailResponse_CodeReview, mockDetailResponse_ReactGen, mockErrorResponse_NotFound, mockDelay } from './mocks/skills-api.mock.js';

// 类型导入
type MarketSkillListResponse = import('../src/types.js').MarketSkillListResponse;
type MarketSkillDetailResponse = import('../src/types.js').MarketSkillDetailResponse;

/**
 * Mock fetch 函数
 */
let mockFetchState = {
  shouldFail: false,
  delayMs: 0,
  responseData: null as any,
};

async function mockFetch(url: string, options?: RequestInit): Promise<Response> {
  // 模拟延迟
  if (mockFetchState.delayMs > 0) {
    await mockDelay(mockFetchState.delayMs);
  }

  // 模拟网络错误
  if (mockFetchState.shouldFail) {
    throw new Error('模拟网络错误：无法连接到服务器');
  }

  // 根据请求 URL 返回对应的 Mock 数据
  let responseData: any;

  if (url.includes('/api/skills/list')) {
    responseData = mockListResponse;
  } else if (url.includes('/resource/download/')) {
    // 提取技能 ID
    const idMatch = url.match(/\/resource\/download\/(\d+)/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      if (id === 1) {
        responseData = mockDetailResponse_CodeReview;
      } else if (id === 2) {
        responseData = mockDetailResponse_ReactGen;
      } else {
        responseData = mockErrorResponse_NotFound;
      }
    } else {
      responseData = mockErrorResponse_NotFound;
    }
  } else {
    responseData = { code: 404, message: '接口不存在', success: false };
  }

  // 创建 Mock Response 对象
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
 * 设置 Mock fetch
 */
function setupMockFetch() {
  // @ts-ignore - 覆盖全局 fetch
  global.fetch = mockFetch;
}

/**
 * 重置 Mock 状态
 */
function resetMockFetch() {
  mockFetchState = {
    shouldFail: false,
    delayMs: 0,
    responseData: null,
  };
}

/**
 * 测试结果收集器
 */
class TestResults {
  private results: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

  add(name: string, passed: boolean, error?: string, duration: number = 0) {
    this.results.push({ name, passed, error, duration });
  }

  print() {
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    this.results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const duration = result.duration > 0 ? ` (${result.duration}ms)` : '';
      console.log(`${index + 1}. ${icon} ${result.name}${duration}`);

      if (!result.passed && result.error) {
        console.log(`   错误: ${result.error}`);
      }

      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    });

    console.log('\n========================================');
    console.log(`  总计: ${this.results.length} 个测试`);
    console.log(`  通过: ${passed} 个`);
    console.log(`  失败: ${failed} 个`);
    console.log(`  成功率: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log('========================================\n');

    return failed === 0;
  }
}

/**
 * 简化的 Provider 类（用于测试）
 */
class TestPingancoderProvider {
  private baseUrl = 'https://market.paic.com.cn';

  /**
   * 搜索技能（列表接口）
   */
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

    // 检查响应状态
    if (!responseData.success || responseData.code !== 200) {
      throw new Error(responseData.message || '获取技能列表失败');
    }

    // 转换为内部格式
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

  /**
   * 获取技能详情
   */
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

    // 检查响应状态
    if (!response_data.success || response_data.code !== 200) {
      throw new Error(response_data.message || '获取技能失败');
    }

    const skillDetail = response_data.data;
    const file = response_data.file;

    // 转换为内部格式
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

  /**
   * 生成默认内容
   */
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
${detail.tags ? `- 标签: ${detail.tags.join(', ')}` : ''}
`;
  }
}

/**
 * 测试套件
 */
async function runTestSuite() {
  const results = new TestResults();

  console.log('========================================');
  console.log('  Pingancoder Provider API 测试');
  console.log('========================================\n');

  // 设置 Mock fetch
  setupMockFetch();

  // 测试 1: 获取技能列表
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 1: 获取技能列表...');
      const provider = new TestPingancoderProvider();
      const skills = await provider.searchSkills('');

      if (!Array.isArray(skills)) {
        throw new Error('返回值不是数组');
      }

      if (skills.length === 0) {
        throw new Error('列表为空');
      }

      const firstSkill = skills[0];
      if (!firstSkill.id || !firstSkill.name || !firstSkill.description) {
        throw new Error('技能数据格式不正确，缺少必需字段');
      }

      if (firstSkill.id !== '1') {
        throw new Error(`ID 转换错误: expected "1", got "${firstSkill.id}"`);
      }

      if (firstSkill.name !== 'Code Review') {
        throw new Error(`名称映射错误: expected "Code Review", got "${firstSkill.name}"`);
      }

      const duration = Date.now() - startTime;
      results.add('获取技能列表', true, undefined, duration);
      console.log(`   ✅ 通过 - 返回 ${skills.length} 个技能\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('获取技能列表', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
    }
  }

  // 测试 2: 获取技能详情
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 2: 获取技能详情 (ID=1)...');
      const provider = new TestPingancoderProvider();
      const detail = await provider.fetchSkill('1');

      if (!detail.id || !detail.name || !detail.description) {
        throw new Error('详情数据格式不正确，缺少必需字段');
      }

      if (detail.id !== '1') {
        throw new Error(`ID 转换错误: expected "1", got "${detail.id}"`);
      }

      if (detail.name !== 'Code Review') {
        throw new Error(`名称映射错误: expected "Code Review", got "${detail.name}"`);
      }

      if (!detail.sourceUrl) {
        throw new Error('缺少下载地址 sourceUrl');
      }

      const duration = Date.now() - startTime;
      results.add('获取技能详情', true, undefined, duration);
      console.log(`   ✅ 通过 - 技能名称: ${detail.name}\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('获取技能详情', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
    }
  }

  // 测试 3: 获取不存在的技能
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 3: 获取不存在的技能 (ID=999)...');
      const provider = new TestPingancoderProvider();

      try {
        await provider.fetchSkill('999');
        throw new Error('应该抛出错误但没有');
      } catch (error: any) {
        if (error.message.includes('不存在')) {
          const duration = Date.now() - startTime;
          results.add('处理不存在的技能', true, undefined, duration);
          console.log(`   ✅ 通过 - 正确返回错误\n`);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('处理不存在的技能', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
    }
  }

  // 测试 4: 数据映射验证
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 4: 验证数据映射...');
      const provider = new TestPingancoderProvider();
      const skills = await provider.searchSkills('');
      const detail = await provider.fetchSkill('1');

      // 验证列表数据映射
      const listFirst = skills[0];
      if (listFirst.metadata?.originalId !== 1) {
        throw new Error('列表数据缺少 originalId');
      }

      if (listFirst.name !== listFirst.metadata?.title) {
        throw new Error('name 应该映射自 title');
      }

      // 验证详情数据映射
      if (detail.metadata?.originalId !== 1) {
        throw new Error('详情数据缺少 originalId');
      }

      const duration = Date.now() - startTime;
      results.add('数据映射验证', true, undefined, duration);
      console.log(`   ✅ 通过 - 数据映射正确\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('数据映射验证', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
    }
  }

  // 测试 5: 内容生成
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 5: 验证默认内容生成...');
      const provider = new TestPingancoderProvider();
      const detail = await provider.fetchSkill('1');

      if (!detail.content) {
        throw new Error('未生成默认内容');
      }

      if (!detail.content.includes('---')) {
        throw new Error('内容格式错误：缺少 frontmatter');
      }

      if (!detail.content.includes('# Code Review')) {
        throw new Error('内容格式错误：缺少标题');
      }

      const duration = Date.now() - startTime;
      results.add('默认内容生成', true, undefined, duration);
      console.log(`   ✅ 通过 - 内容格式正确\n`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('默认内容生成', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
    }
  }

  // 测试 6: 网络错误处理
  {
    const startTime = Date.now();
    try {
      console.log('🧪 测试 6: 网络错误处理...');
      mockFetchState.shouldFail = true;

      const provider = new TestPingancoderProvider();
      try {
        await provider.searchSkills('');
        throw new Error('应该抛出网络错误但没有');
      } catch (error: any) {
        if (error.message.includes('网络') || error.message.includes('无法连接')) {
          const duration = Date.now() - startTime;
          results.add('网络错误处理', true, undefined, duration);
          console.log(`   ✅ 通过 - 正确处理网络错误\n`);
        } else {
          throw error;
        }
      } finally {
        resetMockFetch();
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      results.add('网络错误处理', false, error.message, duration);
      console.log(`   ❌ 失败 - ${error.message}\n`);
      resetMockFetch();
    }
  }

  // 打印测试结果
  const allPassed = results.print();

  return allPassed;
}

/**
 * 主函数
 */
async function main() {
  try {
    const allPassed = await runTestSuite();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('测试运行出错:', error);
    process.exit(1);
  }
}

// 运行测试
main();
