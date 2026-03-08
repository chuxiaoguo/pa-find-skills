# 本地技能可视化 VSCode 插件 - 需求设计方案

## 一、项目概述

**项目名称**：Skills Manager VSCode Extension

**核心目标**：为 pa-skills 提供图形化管理界面，让开发者可以在 VSCode 中便捷地查看、安装、卸载和编辑技能。

**技术栈**：
- VSCode Extension API (TypeScript)
- React 18 + WebView
- pa-skills CLI（通过子进程调用）
- TailwindCSS（样式）

---

## 二、功能需求（按优先级）

### P0 - 核心功能

#### 1. 技能总览视图
- 网格卡片布局，响应式设计（2/3/4 列自适应）
- 按代理类型分组展示（全局/本地）
- 显示技能关键信息：
  - 名称、描述、版本
  - 来源类型标签
  - 安装时间

#### 2. 技能详情视图
三个区域：
- **概览区**：技能名称、描述、图标/标签
- **元数据区**：版本、创建者、安装时间、更新时间、来源类型、是否软链接
- **文件树区**：可展开/收起的树形结构，点击文件在右侧编辑器打开

#### 3. 技能搜索与筛选
- 实时搜索（按名称/描述）
- 按代理类型筛选（全局/本地）
- 按来源类型筛选（local/local-zip/pingancoder-api）

### P1 - 管理功能

#### 4. 技能安装
- 从本地 Zip 包安装
- 从本地目录安装
- 从 Pingancoder 市场搜索并安装
- 支持选择目标代理（多选）

#### 5. 技能卸载
- 单个卸载
- 批量卸载

#### 6. 技能编辑
- 在 VSCode 中直接编辑技能文件
- 实时同步变更

### P2 - 增强功能

#### 7. 技能市场浏览
- 浏览 Pingancoder 市场技能
- 查看技能详情和热度
- 一键安装

#### 8. 状态同步
- 监听文件系统变化
- 自动刷新技能列表

---

## 三、技术架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                  VSCode Extension                    │
│  ┌───────────────────────────────────────────────┐  │
│  │          Extension Host (Node.js)             │  │
│  │  ┌─────────────┐  ┌──────────────────────┐   │  │
│  │  │ SkillsManager│  │ CLIAdapter            │   │  │
│  │  │ (Service)   │  │ (pa-skills wrapper)   │   │  │
│  │  └──────┬──────┘  └───────────┬──────────┘   │  │
│  │         │                     │                │  │
│  │  ┌──────▼─────────────────────▼──────────┐    │  │
│  │  │         FileSystemWatcher              │    │  │
│  │  └──────────────────┬────────────────────┘    │  │
│  └─────────────────────┼────────────────────────┘  │
│                        │                            │
│  ┌─────────────────────▼────────────────────────┐  │
│  │            WebView Communication             │  │
│  └─────────────────────┬────────────────────────┘  │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                  WebView (React)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              React App                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │  │
│  │  │ Skills  │  │ Skill   │  │  Market      │  │  │
│  │  │ Gallery │  │ Details │  │  Browser     │  │  │
│  │  └─────────┘  └─────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 核心模块

**Extension Host (Node.js)**：
- `SkillsManager`: 技能数据管理服务
- `CLIAdapter`: pa-skills CLI 适配器
- `FileSystemWatcher`: 文件系统监听
- `AuthManager`: 认证管理（读取 `~/.pingancoder/auth.json`）

**WebView (React)**：
- `SkillsGallery`: 技能总览组件
- `SkillDetails`: 技能详情组件
- `MarketBrowser`: 市场浏览组件
- `InstallWizard`: 安装向导组件

---

## 四、数据流设计

### 4.1 数据获取流程

```
用户操作 → WebView → Extension Host
                          ↓
                   CLIAdapter.exec()
                          ↓
                   pa-skills list --json
                          ↓
                   解析 JSON 响应
                          ↓
                   SkillsManager.normalize()
                          ↓
                   WebView (更新状态)
```

### 4.2 数据模型

```typescript
interface Skill {
  id: string;                    // 唯一标识
  name: string;                  // 技能名称
  description: string;           // 描述
  version?: string;              // 版本
  author?: string;               // 创建者
  sourceType: SourceType;        // 来源类型
  installType: 'global' | 'local'; // 安装类型
  isSymlink: boolean;            // 是否软链接
  installedAt: string;           // 安装时间
  updatedAt: string;             // 更新时间
  path: string;                  // 技能路径
  files: SkillFile[];            // 文件列表
  metadata?: Record<string, any>; // 额外元数据
}

interface SkillFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: SkillFile[];
}
```

---

## 五、UI/UX 设计

### 5.1 布局响应式规则

```css
/* 网格布局 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 侧边栏宽度适配 */
@media (min-width: 1200px) {
  .skills-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 900px) and (max-width: 1199px) {
  .skills-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 600px) and (max-width: 899px) {
  .skills-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 599px) {
  .skills-grid { grid-template-columns: 1fr; }
}
```

### 5.2 技能卡片设计

```
┌─────────────────────────────┐
│ 🏷️ 技能名称               │
│ 来源: [local] [全局] 🔗    │
│ ─────────────────────────  │
│ 技能描述预览...            │
│                            │
│ 📦 v1.0.0  👤 作者名       │
│ 📅 2024-03-06             │
└─────────────────────────────┘
```

### 5.3 详情页面布局

```
┌─────────────────────────────────────┐
│ ← 返回    技能名称        [卸载]   │
├─────────────────────────────────────┤
│ 📋 概述                            │
│ 技能描述...                         │
├─────────────────────────────────────┤
│ ℹ️  元数据                         │
│ • 版本: v1.0.0                     │
│ • 创建者: xxx                      │
│ • 来源: Pingancoder API            │
│ • 安装时间: 2024-03-06             │
│ • 类型: 软链接                     │
├─────────────────────────────────────┤
│ 📁 文件树                          │
│ 📂 skill-name                      │
│   ├─ 📄 SKILL.md                   │
│   ├─ 📄 package.json               │
│   └─ 📂 src                        │
│       └─ 📄 index.ts               │
└─────────────────────────────────────┘
```

---

## 六、CLI 适配设计

### 6.1 命令映射

| 功能 | CLI 命令 | 输出格式 |
|------|----------|----------|
| 列表 | `pa-skills list --json` | `Skill[]` |
| 安装本地 | `pa-skills add <path> --json` | `InstallResult` |
| 安装市场 | `pa-skills add <id> --from pingancoder-api --json` | `InstallResult` |
| 卸载 | `pa-skills remove <name> --json` | `RemoveResult` |
| 市场搜索 | `pa-skills find <query> --json` | `MarketSkill[]` |

### 6.2 认证处理

```typescript
class AuthManager {
  private authPath = path.join(homedir(), '.pingancoder', 'auth.json');

  async getAuth(): Promise<AuthSession | null> {
    try {
      const content = await fs.readFile(this.authPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async ensureAuth(): Promise<void> {
    const auth = await this.getAuth();
    if (!auth || this.isExpired(auth)) {
      // 提示用户通过 CLI 登录
      vscode.window.showWarningMessage(
        '请先通过 CLI 登录: pa-skills login'
      );
    }
  }
}
```

---

## 七、实现优先级

### Phase 1: 基础框架
1. VSCode 插件项目初始化
2. WebView + React 基础架构
3. CLIAdapter 基础实现
4. 技能列表获取和展示

### Phase 2: 核心功能
1. 技能卡片网格布局
2. 技能详情页面
3. 搜索和筛选功能
4. 文件树组件

### Phase 3: 管理功能
1. 技能安装（本地）
2. 技能卸载
3. 文件编辑集成

### Phase 4: 高级功能
1. Pingancoder 市场集成
2. 文件系统监听
3. 错误处理和用户反馈

---

## 八、技术细节

### 8.1 目录结构

```
vscode-skills-manager/
├── src/
│   ├── extension.ts          # 插件入口
│   ├── services/
│   │   ├── SkillsManager.ts
│   │   ├── CLIAdapter.ts
│   │   ├── AuthManager.ts
│   │   └── FileSystemWatcher.ts
│   ├── types/
│   │   └── index.ts          # 类型定义
│   └── webview/
│       ├── index.tsx         # React 入口
│       ├── components/
│       │   ├── SkillsGallery.tsx
│       │   ├── SkillCard.tsx
│       │   ├── SkillDetails.tsx
│       │   ├── FileTree.tsx
│       │   └── InstallWizard.tsx
│       ├── hooks/
│       │   └── useSkills.ts
│       └── styles/
│           └── globals.css
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### 8.2 通信协议

Extension Host ↔ WebView 使用 `vscode.postMessage`:

```typescript
// Extension → WebView
{
  type: 'skills:update',
  data: Skill[]
}

// WebView → Extension
{
  type: 'skills:list',
  payload?: { filter?: FilterOptions }
}

{
  type: 'skill:install',
  payload: { source: string, agents?: string[] }
}

{
  type: 'skill:uninstall',
  payload: { name: string }
}
```

---

## 九、依赖项

### 运行时依赖
- `pa-skills` CLI 工具
- Node.js >= 18
- VSCode >= 1.80.0

### 开发依赖
- `@types/vscode`
- `react` + `@types/react`
- `react-dom` + `@types/react-dom`
- `webpack`
- `typescript`
- `tailwindcss`
