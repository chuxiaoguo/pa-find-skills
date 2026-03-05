# Mock 服务器使用指南

## 🚀 快速开始

### 第一步：启动 Mock 服务器

**方式 1：使用 pnpm 命令（推荐）**
```bash
cd /d/pingan/pa-find-skills/pa-skills
pnpm mock-server
```

**方式 2：使用脚本**

Windows:
```bash
cd test
setup-mock-env.bat
```

Linux/Mac:
```bash
cd test
chmod +x setup-mock-env.sh
./setup-mock-env.sh
```

### 第二步：配置环境变量

**新开一个终端窗口**，然后：

```bash
# 配置 API 地址指向本地 Mock 服务器
export PINGANCODER_API_URL=http://localhost:3000
```

Windows (PowerShell):
```powershell
$env:PINGANCODER_API_URL="http://localhost:3000"
```

Windows (CMD):
```cmd
set PINGANCODER_API_URL=http://localhost:3000
```

### 第三步：测试 CLI 命令

```bash
# 1. 测试搜索功能
pa-skills find react

# 2. 测试添加功能
pa-skills add 1

# 3. 测试列表功能
pa-skills list

# 4. 测试移除功能
pa-skills remove code-review
```

---

## 📡 Mock 服务器信息

- **地址**: `http://localhost:3000`
- **端口**: `3000`
- **协议**: HTTP

### 可用接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 技能列表 | GET | `/api/skills/list` | 返回 3 个技能 |
| 技能详情 | GET | `/resource/download/{id}` | ID=1,2 有效 |
| 健康检查 | GET | `/health` | 检查服务器状态 |

---

## 🎭 Mock 数据

### 可用的技能 ID

| ID | 名称 | 分类 | 版本 |
|----|------|------|------|
| 1 | Code Review | 代码质量 | 1.2.0 |
| 2 | React Components Generator | 代码生成 | 2.0.1 |
| 3 | Database Schema Designer | 数据库 | 1.5.3 |

### 测试场景

#### ✅ 正常场景

```bash
# 搜索所有技能
pa-skills find ""

# 添加存在的技能
pa-skills add 1
pa-skills add 2
pa-skills add 3
```

#### ❌ 错误场景

```bash
# 获取不存在的技能
pa-skills add 999
# 预期输出：错误 "技能不存在"
```

---

## 🧪 完整测试流程

### 测试 1：搜索功能

```bash
pa-skills find react
```

**预期输出：**
```
┌──────────────────────────────────────┐
│                                      │
│  ┌─┐┌─┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │
│  │P││A││- ││S ││K ││I ││L ││L ││S │  │
│  └─┘└─┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘  │
│                                      │
│     PA - SKILLS                      │
│                                      │
└──────────────────────────────────────┘

欢迎使用 Pingancoder Skills

✓ 找到 3 个技能

1. Code Review
   智能代码审查技能，帮助识别代码问题并提供改进建议

2. React Components Generator
   基于描述生成 React 组件代码，支持 TypeScript 和样式

3. Database Schema Designer
   数据库表结构设计工具，支持 ER 图生成和 SQL 导出
```

### 测试 2：添加技能

```bash
pa-skills add 1
```

**预期输出：**
```
┌──────────────────────────────────────┐
│                                      │
│  ┌─┐┌─┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │
│  │P││A││- ││S ││K ││I ││L ││L ││S │  │
│  └─┘└─┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘  │
│                                      │
│     PA - SKILLS                      │
│                                      │
└──────────────────────────────────────┘

欢迎使用 Pingancoder Skills

从 pingancoder-api 获取技能...
✓ 找到技能: Code Review

? 选择要安装到的代理 …
❯ gemini
  opencode
  openclaw
  pingancoder

? 选择安装范围 …
❯ 项目级 (仅当前项目可用)
  全局 (所有项目可用)

? 选择安装模式 …
❯ 符号链接 (推荐，节省空间，便于更新)
  复制 (兼容性更好，占用更多空间)

┌─────────────────┐
│ 安装摘要        │
└─────────────────┘

技能名称：Code Review
描述：智能代码审查技能，帮助识别代码问题并提供改进建议

安装范围：项目级
安装模式：符号链接

目标代理：
  • Pingancoder

? 确认安装？ (Y/n)
```

### 测试 3：列出已安装技能

```bash
pa-skills list
```

**预期输出：**
```
┌──────────────────────────────────────┐
│                                      │
│  ┌─┐┌─┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │
│  │P││A││- ││S ││K ││I ││L ││L ││S │  │
│  └─┘└─┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘  │
│                                      │
│     PA - SKILLS                      │
│                                      │
└──────────────────────────────────────┘

已安装的技能 (1)

✓ code-review (Code Review)
  版本: 1.2.0
  来源: pingancoder-api://1
  位置: .pingancoder/skills/code-review
```

---

## 🔍 调试技巧

### 查看 Mock 服务器日志

Mock 服务器会显示所有请求日志：

```
2026-03-06T10:30:45.123Z GET /api/skills/list
→ 返回技能列表 (3 个技能)

2026-03-06T10:30:52.456Z GET /resource/download/1
→ 获取技能详情 (ID: 1)
```

### 测试 API 响应

使用 curl 测试 Mock 服务器：

```bash
# 测试列表接口
curl http://localhost:3000/api/skills/list

# 测试详情接口
curl http://localhost:3000/resource/download/1

# 测试健康检查
curl http://localhost:3000/health
```

### 检查 CLI 配置

```bash
# 查看当前配置
cat ~/.pingancoder/config.json

# 查看状态
pa-skills status
```

---

## ❓ 常见问题

### Q1: 端口 3000 被占用怎么办？

**A:** 修改 Mock 服务器端口：

编辑 `test/mock-server.ts`，修改 `PORT` 常量：

```typescript
const PORT = 3001; // 改为其他端口
```

然后更新环境变量：

```bash
export PINGANCODER_API_URL=http://localhost:3001
```

### Q2: CLI 还是连接到真实 API 怎么办？

**A:** 确保环境变量设置正确：

```bash
# 检查环境变量
echo $PINGANCODER_API_URL

# 应该输出: http://localhost:3000

# 如果不对，重新设置
export PINGANCODER_API_URL=http://localhost:3000
```

### Q3: Mock 数据可以修改吗？

**A:** 可以！编辑 `test/mocks/skills-api.mock.ts`：

```typescript
export const mockListResponse: MarketSkillListResponse = {
  code: 200,
  message: 'success',
  success: true,
  timestamp: Date.now(),
  data: [
    // 在这里添加或修改技能
    {
      id: 1,
      title: '你的自定义技能',
      // ...
    },
  ],
};
```

修改后重启 Mock 服务器。

### Q4: 如何停止 Mock 服务器？

**A:** 在运行 Mock 服务器的终端按 `Ctrl+C`

---

## 📂 文件结构

```
pa-skills/
├── test/
│   ├── mocks/
│   │   └── skills-api.mock.ts     # Mock 数据定义
│   ├── mock-server.ts              # Mock 服务器
│   ├── integration-test.ts         # 集成测试
│   ├── provider-api.test.ts        # 单元测试
│   ├── setup-mock-env.sh           # Linux/Mac 启动脚本
│   └── setup-mock-env.bat          # Windows 启动脚本
├── src/
│   ├── providers/
│   │   └── pingancoder-provider.ts # Provider 实现
│   └── ...
└── package.json
```

---

## 🎯 验证清单

使用 Mock 服务器测试以下功能：

- [ ] 搜索技能 (`pa-skills find`)
- [ ] 添加技能 (`pa-skills add`)
- [ ] 列出技能 (`pa-skills list`)
- [ ] 移除技能 (`pa-skills remove`)
- [ ] 更新技能 (`pa-skills update`)
- [ ] 查看状态 (`pa-skills status`)
- [ ] 错误处理 (添加不存在的技能)

---

## 📚 相关文档

- [API 集成方案](./API_INTEGRATION_PLAN.md)
- [Mock 验证报告](./MOCK_VALIDATION_REPORT.md)
- [README](./README.md)

---

**提示**: Mock 服务器只用于本地开发和测试，生产环境请使用真实的 API 服务器。
