/**
 * Mock API 服务器
 * 模拟 https://market.paic.com.cn 的 API 接口
 * 支持认证登录和按名称搜索技能
 */

import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  mockListResponse,
  mockDetailResponse_CodeReview,
  mockDetailResponse_ReactGen,
  mockErrorResponse_NotFound,
} from './mocks/skills-api.mock.js';

const app = express();
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Mock 用户存储
const MOCK_USERS = {
  admin: 'admin123',
  test: 'test123',
  mock: 'mock123',
};

// Mock token 存储
const mockTokens = new Map<string, { username: string; expiresAt: number }>();

// 生成 mock token
function generateMockToken(username: string): string {
  const timestamp = Date.now();
  const tokenData = `${username}-${timestamp}-${Math.random().toString(36).substring(7)}`;
  return Buffer.from(tokenData).toString('base64');
}

// 中间件
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ============================================================================
// 认证接口
// ============================================================================

// 登录接口
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  console.log(`→ 登录请求: username=${username}`);

  if (!username || !password) {
    console.log('→ 登录失败: 缺少用户名或密码');
    return res.status(400).json({
      code: 400,
      message: '用户名或密码不能为空',
      success: false,
    });
  }

  const validPassword = MOCK_USERS[username as keyof typeof MOCK_USERS];
  if (!validPassword || validPassword !== password) {
    console.log('→ 登录失败: 用户名或密码错误');
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
      success: false,
    });
  }

  const token = generateMockToken(username);
  const expiresIn = 24 * 60 * 60 * 1000;
  const expiresAt = Date.now() + expiresIn;

  mockTokens.set(token, { username, expiresAt });

  console.log(`→ 登录成功: username=${username}, token=${token.substring(0, 20)}...`);

  res.json({
    code: 200,
    message: '登录成功',
    success: true,
    data: {
      token,
      expiresIn,
      username,
    },
  });
});

// 登出接口
app.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      code: 401,
      message: '未认证',
      success: false,
    });
  }

  const token = authHeader.replace('Bearer ', '');
  mockTokens.delete(token);

  console.log(`→ 登出成功: token=${token.substring(0, 20)}...`);

  res.json({
    code: 200,
    message: '登出成功',
    success: true,
  });
});

// ============================================================================
// 技能接口
// ============================================================================

// 技能搜索接口（支持按 ID 或名称）
app.get('/api/skills/search', (req, res) => {
  const query = (req.query.q as string) || '';
  console.log(`→ 搜索技能: query="${query}"`);

  // 如果 query 是数字，当作 ID 处理
  if (/^\d+$/.test(query)) {
    const id = parseInt(query, 10);
    const skill = mockListResponse.data.find(s => s.id === id);
    if (skill) {
      console.log(`→ 找到技能 (ID): ${skill.title}`);
      return res.json({
        code: 200,
        message: 'success',
        success: true,
        data: [skill],
      });
    }
  }

  // 按名称或描述搜索
  const lowerQuery = query.toLowerCase();
  const results = mockListResponse.data.filter(skill => {
    return (
      skill.title.toLowerCase().includes(lowerQuery) ||
      skill.description?.toLowerCase().includes(lowerQuery) ||
      skill.category?.toLowerCase().includes(lowerQuery) ||
      skill.author?.toLowerCase().includes(lowerQuery) ||
      skill.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });

  console.log(`→ 搜索结果: ${results.length} 个技能`);

  res.json({
    code: 200,
    message: 'success',
    success: true,
    data: results,
  });
});

// 路由：获取技能列表
app.get('/api/skills/list', (req, res) => {
  console.log('→ 返回技能列表 (3 个技能)');
  res.json(mockListResponse);
});

// 路由：获取技能详情（支持 ID 或名称）
app.get('/resource/download/:identifier', (req, res) => {
  const identifier = req.params.identifier;

  console.log(`→ 获取技能详情: identifier="${identifier}"`);

  // 如果是数字 ID
  if (/^\d+$/.test(identifier)) {
    const id = parseInt(identifier, 10);
    console.log(`→ 按 ID 查找: ${id}`);

    if (id === 1) {
      return res.json(mockDetailResponse_CodeReview);
    } else if (id === 2) {
      return res.json(mockDetailResponse_ReactGen);
    } else {
      console.log(`→ 未找到技能 (ID: ${id})`);
      return res.status(404).json(mockErrorResponse_NotFound);
    }
  }

  // 按名称查找
  const lowerIdentifier = identifier.toLowerCase();
  const skill = mockListResponse.data.find(s =>
    s.title.toLowerCase() === lowerIdentifier ||
    s.title.toLowerCase().includes(lowerIdentifier)
  );

  if (skill) {
    console.log(`→ 找到技能 (名称): ${skill.title}`);
    // 返回对应的详情
    if (skill.id === 1) {
      return res.json(mockDetailResponse_CodeReview);
    } else if (skill.id === 2) {
      return res.json(mockDetailResponse_ReactGen);
    }
  }

  console.log(`→ 未找到技能 (标识符: ${identifier})`);
  return res.status(404).json(mockErrorResponse_NotFound);
});

// ============================================================================
// 系统接口
// ============================================================================

// 路由：模拟 Zip 文件下载
app.get('/api/download/:filename', async (req: express.Request, res: express.Response) => {
  const filename = req.params.filename;
  console.log(`→ 下载请求: filename="${filename}"`);

  try {
    // 从 filename 中提取 ID (例如 "1.zip" -> "1")
    const id = filename.replace('.zip', '').replace(/\.zip$/, '');

    // 映射 ID 到实际的 zip 文件名
    const zipFileMap: Record<string, string> = {
      '1': '1-skill-v1.2.0.zip',
      '2': '2-skill-v2.0.1.zip',
      '3': '3-skill-v1.5.3.zip',
    };

    const actualZipFile = zipFileMap[id];
    if (!actualZipFile) {
      console.log(`→ 未找到 zip 文件: ${filename}`);
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        success: false,
      });
    }

    // 读取 zip 文件
    const zipPath = `./test/mocks/zips/${actualZipFile}`;
    const { createReadStream } = await import('fs');
    const { resolve } = await import('path');

    const fullPath = resolve(process.cwd(), zipPath);

    console.log(`→ 返回 zip 文件: ${actualZipFile}`);

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // 发送文件
    createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error(`→ 下载失败: ${error}`);
    res.status(500).json({
      code: 500,
      message: '下载失败',
      success: false,
    });
  }
});

// 路由：健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock 服务器运行中' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    success: false,
    data: null,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  Mock API 服务器已启动');
  console.log('========================================\n');
  console.log(`🚀 服务器地址: ${BASE_URL}`);
  console.log(`📡 技能列表接口: ${BASE_URL}/api/skills/list`);
  console.log(`📥 技能详情接口: ${BASE_URL}/resource/download/{id|name}`);
  console.log(`🔍 技能搜索接口: ${BASE_URL}/api/skills/search?q=query`);
  console.log(`🔐 登录接口: ${BASE_URL}/auth/login`);
  console.log(`\n按 Ctrl+C 停止服务器\n`);
  console.log('========================================');
  console.log('  测试账号');
  console.log('========================================\n');
  console.log('用户名: admin    密码: admin123');
  console.log('用户名: test     密码: test123');
  console.log('用户名: mock     密码: mock123');
  console.log('\n========================================');
  console.log('  可用技能 (ID 和名称都支持)');
  console.log('========================================\n');
  console.log('ID 1: Code Review');
  console.log('ID 2: React Components Generator');
  console.log('ID 3: Database Schema Designer');
  console.log('\n========================================');
  console.log('  测试命令');
  console.log('========================================\n');
  console.log('# 在另一个终端窗口运行:\n');
  console.log('# 1. 配置环境变量');
  console.log(`export PINGANCODER_API_URL=${BASE_URL}`);
  console.log('');
  console.log('# 2. 登录');
  console.log('pa-skills auth login');
  console.log('');
  console.log('# 3. 添加技能（以下方式都支持）');
  console.log('pa-skills add 1           # 使用 ID');
  console.log('pa-skills add react       # 使用名称（部分匹配）');
  console.log('');
  console.log('# 4. 测试搜索功能');
  console.log('pa-skills find react');
  console.log('');
  console.log('# 5. 测试列表功能');
  console.log('pa-skills list');
  console.log('');
  console.log('========================================\n');
});

// 导出服务器 URL 供测试使用
export { BASE_URL };
