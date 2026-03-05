/**
 * Skills API Mock 数据
 * 模拟真实 API 的响应格式
 */

import type { MarketSkillListResponse, MarketSkillDetailResponse } from '../../src/types.js';

/**
 * Mock: 获取技能列表响应
 */
export const mockListResponse: MarketSkillListResponse = {
  code: 200,
  message: 'success',
  success: true,
  timestamp: Date.now(),
  data: [
    {
      id: 1,
      title: 'Code Review',
      icon: '/icons/code-review.png',
      logo: '/logos/code-review.png',
      description: '智能代码审查技能，帮助识别代码问题并提供改进建议',
      category: '代码质量',
      version: '1.2.0',
      author: 'Pingancoder Team',
      authorId: 1,
      downloads: 15234,
      rating: 4.8,
      tags: ['code-review', 'quality', 'analysis'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-03-01T15:30:00Z',
      isPublished: true,
      isRecommended: true,
      isFree: true,
      fileSize: '256KB',
      fileType: 'zip',
      downloadUrl: 'http://localhost:3000/api/download/1.zip',
      previewImages: [
        '/preview/code-review-1.png',
        '/preview/code-review-2.png'
      ],
      screenshots: [],
      documentationUrl: 'https://docs.example.com/code-review',
      license: 'MIT',
      dependencies: [],
      compatibility: ['gemini', 'opencode', 'openclaw', 'pingancoder'],
      platform: ['web', 'cli'],
      language: 'TypeScript',
      framework: 'Node.js',
    },
    {
      id: 2,
      title: 'React Components Generator',
      icon: '/icons/react-gen.png',
      logo: '/logos/react-gen.png',
      description: '基于描述生成 React 组件代码，支持 TypeScript 和样式',
      category: '代码生成',
      version: '2.0.1',
      author: 'Frontend Team',
      authorId: 2,
      downloads: 8932,
      rating: 4.6,
      tags: ['react', 'generator', 'components', 'typescript'],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-28T14:20:00Z',
      isPublished: true,
      isRecommended: false,
      isFree: true,
      fileSize: '512KB',
      fileType: 'zip',
      downloadUrl: 'http://localhost:3000/api/download/2.zip',
      previewImages: [],
      screenshots: [
        '/screenshots/react-gen-1.png',
        '/screenshots/react-gen-2.png'
      ],
      documentationUrl: 'https://docs.example.com/react-gen',
      license: 'Apache-2.0',
      dependencies: ['react', 'typescript'],
      compatibility: ['gemini', 'opencode', 'pingancoder'],
      platform: ['web', 'cli'],
      language: 'TypeScript',
      framework: 'React',
    },
    {
      id: 3,
      title: 'Database Schema Designer',
      icon: '/icons/db-designer.png',
      logo: '/logos/db-designer.png',
      description: '数据库表结构设计工具，支持 ER 图生成和 SQL 导出',
      category: '数据库',
      version: '1.5.3',
      author: 'DBA Team',
      authorId: 3,
      downloads: 5621,
      rating: 4.9,
      tags: ['database', 'schema', 'sql', 'er-diagram'],
      createdAt: '2024-01-20T12:00:00Z',
      updatedAt: '2024-03-05T09:45:00Z',
      isPublished: true,
      isRecommended: true,
      isFree: false,
      price: 9.99,
      originalPrice: 19.99,
      fileSize: '1.2MB',
      fileType: 'zip',
      downloadUrl: 'http://localhost:3000/api/download/3.zip',
      previewImages: [
        '/preview/db-designer-1.png'
      ],
      documentationUrl: 'https://docs.example.com/db-designer',
      license: 'Proprietary',
      dependencies: [],
      compatibility: ['gemini', 'openclaw', 'pingancoder'],
      platform: ['web'],
      language: 'Python',
      framework: 'Flask',
    },
  ],
};

/**
 * Mock: 获取技能详情响应 - Code Review
 */
export const mockDetailResponse_CodeReview: MarketSkillDetailResponse = {
  code: 200,
  message: 'success',
  success: true,
  timestamp: Date.now(),
  data: {
    id: 1,
    title: 'Code Review',
    description: '智能代码审查技能，帮助识别代码问题并提供改进建议。支持多种编程语言，包括 JavaScript、TypeScript、Python、Java 等。',
    version: '1.2.0',
    author: 'Pingancoder Team',
    categoryId: 1,
    categoryName: '代码质量',
    tags: ['code-review', 'quality', 'analysis', 'best-practices'],
    downloadCount: 15234,
    rating: 4.8,
    ratingCount: 342,
    isPublished: true,
    isRecommended: true,
    isFree: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-01T15:30:00Z',
    publishedAt: '2024-01-20T10:00:00Z',
  },
  file: {
    downloadUrl: 'http://localhost:3000/api/download/1.zip',
    appFileName: 'code-review-skill-v1.2.0.zip',
    md5: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    fileSize: 262144,
    fileType: 'zip',
    uploadTime: '2024-03-01T15:30:00Z',
  },
};

/**
 * Mock: 获取技能详情响应 - React Generator
 */
export const mockDetailResponse_ReactGen: MarketSkillDetailResponse = {
  code: 200,
  message: 'success',
  success: true,
  timestamp: Date.now(),
  data: {
    id: 2,
    title: 'React Components Generator',
    description: '基于自然语言描述生成 React 组件代码。支持 TypeScript、Hooks、Styled Components 等现代 React 开发技术栈。',
    version: '2.0.1',
    author: 'Frontend Team',
    categoryId: 2,
    categoryName: '代码生成',
    tags: ['react', 'generator', 'components', 'typescript', 'hooks'],
    downloadCount: 8932,
    rating: 4.6,
    ratingCount: 218,
    isPublished: true,
    isRecommended: false,
    isFree: true,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-28T14:20:00Z',
    publishedAt: '2024-02-05T08:00:00Z',
  },
  file: {
    downloadUrl: 'http://localhost:3000/api/download/2.zip',
    appFileName: 'react-gen-skill-v2.0.1.zip',
    md5: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
    fileSize: 524288,
    fileType: 'zip',
    uploadTime: '2024-02-28T14:20:00Z',
  },
};

/**
 * Mock: 错误响应 - 技能不存在
 */
export const mockErrorResponse_NotFound = {
  code: 404,
  message: '技能不存在',
  success: false,
  timestamp: Date.now(),
  data: null as any,
};

/**
 * Mock: 错误响应 - 未授权
 */
export const mockErrorResponse_Unauthorized = {
  code: 401,
  message: '未授权，请先登录',
  success: false,
  timestamp: Date.now(),
  data: null as any,
};

/**
 * Mock: 空列表响应
 */
export const mockListResponse_Empty: MarketSkillListResponse = {
  code: 200,
  message: 'success',
  success: true,
  timestamp: Date.now(),
  data: [],
};

/**
 * 获取 Mock 详情响应的辅助函数
 */
export function getMockDetailResponse(skillId: number): MarketSkillDetailResponse {
  switch (skillId) {
    case 1:
      return mockDetailResponse_CodeReview;
    case 2:
      return mockDetailResponse_ReactGen;
    default:
      return mockErrorResponse_NotFound as any;
  }
}

/**
 * 模拟网络延迟
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 模拟网络错误
 */
export class MockNetworkError extends Error {
  constructor(message: string = '模拟网络错误') {
    super(message);
    this.name = 'MockNetworkError';
  }
}
