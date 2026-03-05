# Pingancoder Skills API 集成方案

## 📋 概述

本文档描述了如何将真实的 Skills API 接口集成到 pa-skills 项目中。

**创建时间：** 2026-03-05
**状态：** ✅ Mock 测试通过，准备实施

---

## 🎯 已完成的工作

### 1. API 接口分析

**真实 API 接口：**

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **列表接口** | GET | `/api/skills/list` | 获取所有技能列表 |
| **详情接口** | GET | `/resource/download/{id}` | 获取单个技能详情和下载信息 |

**响应格式：**
```typescript
{
  code: number;           // 状态码
  message: string;        // 消息
  success: boolean;       // 是否成功
  timestamp?: number;     // 时间戳
  data: any;             // 数据
}
```

### 2. 差异分析

| 对比项 | 现有代码 | 真实 API | 需要修改 |
|--------|---------|---------|---------|
| 认证方式 | Bearer token | 无需认证 | ✅ |
| 列表接口 | `/skills/search` | `/api/skills/list` | ✅ |
| 详情接口 | `/skills/{id}` | `/resource/download/{id}` | ✅ |
| 响应包装 | 直接返回 | `{code, message, success, data}` | ✅ |
| 字段名称 | `name` | `title` | ✅ |
| 下载地址 | `downloadUrl` | `file.downloadUrl` | ✅ |
| ID 类型 | `string` | `number` | ✅ |

### 3. Mock 测试验证

**测试覆盖率：100% (6/6 通过)**

✅ 获取技能列表
✅ 获取技能详情
✅ 处理不存在的技能
✅ 数据映射验证
✅ 默认内容生成
✅ 网络错误处理

**测试命令：**
```bash
cd /d/pingan/pa-find-skills/pa-skills
npx tsx test/provider-api.test.ts
```

---

## 📁 创建的文件

### 1. Mock 数据文件
**路径：** `test/mocks/skills-api.mock.ts`

**内容：**
- `mockListResponse` - 技能列表 Mock 数据（包含 3 个技能）
- `mockDetailResponse_CodeReview` - Code Review 技能详情
- `mockDetailResponse_ReactGen` - React Generator 技能详情
- `mockErrorResponse_NotFound` - 404 错误响应
- `mockErrorResponse_Unauthorized` - 401 错误响应
- `mockListResponse_Empty` - 空列表响应
- 辅助函数：`getMockDetailResponse()`, `mockDelay()`, `MockNetworkError`

### 2. 测试文件
**路径：** `test/provider-api.test.ts`

**功能：**
- Mock 全局 fetch 函数
- 6 个自动化测试用例
- 测试结果汇总和报告

### 3. 类型定义
**路径：** `src/types.ts`

**新增类型：**
- `MarketSkillListResponse` - 列表响应类型
- `MarketSkill` - 技能列表项类型
- `MarketSkillDetailResponse` - 详情响应类型
- `MarketSkillDetail` - 技能详情类型
- `MarketSkillFile` - 文件信息类型

---

## 🔧 实施方案

### 需要修改的文件（3 个）

| 文件 | 修改内容 | 预估工作量 |
|------|---------|-----------|
| `src/config.ts` | 更新默认 API 地址 | ~1 行 |
| `src/providers/pingancoder-provider.ts` | 重写 API 调用逻辑 | ~80 行 |
| `src/types.ts` | ✅ 已完成 - 添加新类型 | 已完成 |

### 详细修改方案

#### 1. 修改 `src/config.ts`

```typescript
// 修改前
export const DEFAULT_API_BASE_URL =
  process.env.PINGANCODER_API_URL || 'http://internal-server/api';

// 修改后
export const DEFAULT_API_BASE_URL =
  process.env.PINGANCODER_API_URL || 'https://market.paic.com.cn';
```

#### 2. 修改 `src/providers/pingancoder-provider.ts`

**修改 `fetchSkill` 方法：**

```typescript
// 新的 API 调用逻辑
const response = await fetch(`${baseUrl}/resource/download/${identifier}`, {
  headers: {
    'accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
  signal: AbortSignal.timeout(timeout),
});

const response_data = await response.json() as MarketSkillDetailResponse;

// 检查响应状态
if (!response_data.success || response_data.code !== 200) {
  throw new Error(response_data.message || '获取技能失败');
}

const skillDetail = response_data.data;
const file = response_data.file;

// 数据转换
const skill: PingancoderSkill = {
  id: String(skillDetail.id),
  name: skillDetail.title || skillDetail.description || 'Unknown',
  description: skillDetail.description || '',
  downloadUrl: file?.downloadUrl || '',
  version: skillDetail.version || '1.0.0',
  category: skillDetail.categoryName,
  author: skillDetail.author,
  metadata: {
    ...skillDetail,
    originalId: skillDetail.id,
  },
};
```

**修改 `searchSkills` 方法：**

```typescript
// 新的 API 调用逻辑
const response = await fetch(`${baseUrl}/api/skills/list`, {
  headers: {
    'accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
  signal: AbortSignal.timeout(timeout),
});

if (!response.ok) {
  throw new Error(`获取技能列表失败: ${response.statusText}`);
}

const responseData = await response.json() as MarketSkillListResponse;

// 检查响应状态
if (!responseData.success || responseData.code !== 200) {
  throw new Error(responseData.message || '获取技能列表失败');
}

// 数据转换
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
})) as PingancoderSkill[];
```

---

## ✅ 验证清单

在实施修改后，请按以下步骤验证：

### 1. 编译检查
```bash
pnpm build
```
- [ ] 编译无错误
- [ ] 无 TypeScript 类型错误

### 2. 运行 Mock 测试
```bash
npx tsx test/provider-api.test.ts
```
- [ ] 所有 6 个测试通过
- [ ] 成功率 100%

### 3. CLI 功能测试
```bash
# 测试搜索功能
pa-skills find react

# 测试添加功能（使用真实 ID）
pa-skills add 1

# 测试列表功能
pa-skills list
```
- [ ] 搜索功能正常
- [ ] 添加功能正常
- [ ] 列表功能正常

### 4. 数据验证
- [ ] 技能 ID 正确转换（number → string）
- [ ] 技能名称正确映射（title → name）
- [ ] 下载地址正确提取（file.downloadUrl）
- [ ] 错误处理正常工作

---

## 📊 测试结果

**最新测试运行：** 2026-03-05

```
========================================
  测试结果汇总
========================================

1. ✅ 获取技能列表 (24ms)
2. ✅ 获取技能详情
3. ✅ 处理不存在的技能
4. ✅ 数据映射验证
5. ✅ 默认内容生成
6. ✅ 网络错误处理

========================================
  总计: 6 个测试
  通过: 6 个
  失败: 0 个
  成功率: 100.0%
========================================
```

---

## 🚀 下一步行动

### 立即可执行：

1. **应用代码修改**
   - 修改 `src/config.ts`（1 行）
   - 修改 `src/providers/pingancoder-provider.ts`（~80 行）

2. **重新构建**
   ```bash
   pnpm build
   ```

3. **运行测试验证**
   ```bash
   npx tsx test/provider-api.test.ts
   ```

4. **真实 API 测试**
   - 配置真实 API 地址
   - 测试实际接口调用
   - 验证数据返回

### 后续优化：

- [ ] 添加缓存机制
- [ ] 添加分页支持
- [ ] 添加搜索过滤功能
- [ ] 添加更多错误场景测试
- [ ] 添加性能监控

---

## 📝 相关文件

- [API Mock 数据](./test/mocks/skills-api.mock.ts)
- [API 测试文件](./test/provider-api.test.ts)
- [类型定义](./src/types.ts)
- [Provider 实现](./src/providers/pingancoder-provider.ts)
- [配置管理](./src/config.ts)

---

**文档版本：** 1.0
**最后更新：** 2026-03-05
**状态：** ✅ 准备实施
