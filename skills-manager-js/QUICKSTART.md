# 🚀 Skills Manager - 快速开始指南

## 📍 项目位置
```
d:\pingan\pa-find-skills\skills-manager-js
```

## ✨ 已实现功能

### 核心功能
- ✅ **技能列表展示** - 卡片式布局，美观易用
- ✅ **技能详情页面** - 查看完整信息和文件树
- ✅ **安装技能** - 支持 Zip 包和目录
- ✅ **卸载技能** - 一键卸载已安装技能
- ✅ **搜索筛选** - 实时搜索，类型筛选
- ✅ **文件集成** - 点击文件在 VSCode 中打开
- ✅ **CLI 集成** - 完整集成 pa-skills 命令行工具

### UI 特性
- 🎨 现代化设计
- 📱 响应式布局
- 🌓 VSCode 主题适配
- ⚡ 流畅动画效果
- 🔔 友好的错误提示

## 🎯 如何使用

### 方法 1: 在 VSCode 中调试（推荐）

1. **打开项目**
   ```
   在 VSCode 中打开: d:\pingan\pa-find-skills\skills-manager-js
   ```

2. **启动调试**
   - 按 `F5` 键
   - 或点击菜单：`运行 > 启动调试`

3. **查看效果**
   - 会打开一个新的 VSCode 窗口（扩展开发主机）
   - 在侧边栏 Activity Bar 中找到 **Skills Manager** 图标
   - 点击图标打开插件面板

### 方法 2: 安装到 VSCode

1. **打包扩展**
   ```bash
   # 在项目目录下
   code d:\pingan\pa-find-skills\skills-manager-js
   # 然后按 Ctrl+Shift+P
   # 输入 "Extensions: Install from Location"
   # 选择项目文件夹
   ```

2. **或者创建 VSIX 包**
   ```bash
   # 安装 vsce
   npm install -g @vscode/vsce

   # 打包
   vsce package

   # 然后在 VSCode 中安装生成的 .vsix 文件
   ```

## 📖 功能演示

### 查看技能列表
```
┌─────────────────────────────────┐
│ 🎯 Skills Manager               │
│ [🔍 搜索] [➕ 安装] [🔄 刷新]   │
├─────────────────────────────────┤
│ 共 3 个技能                     │
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ find-skills        [本地] │   │
│ │ 搜索和安装 agent skills │   │
│ │ 📦 v1.0.0  👤 Author  📅 │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ frontend-design    [全局] │   │
│ │ 前端设计助手技能        │   │
│ │ 📦 v2.1.0  🔗         📅 │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

### 技能详情页面
```
┌─────────────────────────────────┐
│ [← 返回列表]      [卸载技能]    │
├─────────────────────────────────┤
│ 📋 概述                         │
│ 技能描述内容...                 │
├─────────────────────────────────┤
│ ℹ️ 元数据                       │
│ • 版本: v1.0.0                 │
│ • 创建者: xxx                  │
│ • 安装类型: 本地               │
│ • 安装时间: 2024-03-08          │
├─────────────────────────────────┤
│ 📁 文件结构                     │
│ 📁 skill-name                  │
│   ├─ 📄 SKILL.md               │
│   ├─ 📄 package.json           │
│   └─ 📁 src                    │
│       └─ 📄 index.ts           │
└─────────────────────────────────┘
```

## 🔧 开发说明

### 项目结构
```
skills-manager-js/
├── extension.js              # 主入口文件
├── services/
│   └── SkillsService.js     # CLI 服务封装
├── package.json              # 扩展配置
├── .vscode/
│   └── launch.json           # 调试配置
└── README.md                 # 项目文档
```

### 核心代码说明

**extension.js** - 扩展入口
- 创建 WebView 面板
- 处理用户命令
- 与 pa-skills CLI 交互
- 管理技能数据

**SkillsService.js** - CLI 服务
- 封装 pa-skills CLI 调用
- 规范化技能数据
- 处理文件操作

### 添加新功能

要添加新功能，修改 `extension.js`：

1. **添加新命令**
   ```javascript
   const newCmd = vscode.commands.registerCommand(
     'skillsManager.newCommand',
     async () => {
       // 你的逻辑
     }
   );
   context.subscriptions.push(newCmd);
   ```

2. **处理 WebView 消息**
   ```javascript
   case 'your:message:type':
     // 处理逻辑
     break;
   ```

3. **更新 UI**
   - 修改 `getWebviewContent()` 中的 HTML
   - 更新 `getScript()` 中的 JavaScript
   - 调整 `getStyles()` 中的 CSS

## 🐛 调试技巧

### 查看日志
1. 打开扩展开发主机窗口
2. 按 `Ctrl+Shift+I` 打开开发工具
3. 查看 Console 标签页的日志

### 常见问题

**Q: 插件不显示技能列表**
- 检查 pa-skills CLI 是否已安装
- 查看控制台错误信息
- 确认当前工作目录是否正确

**Q: 点击安装没反应**
- 检查文件选择器是否弹出
- 查看开发者工具的 Console
- 确认选择的文件格式

**Q: 无法打开文件**
- 确认文件路径正确
- 检查文件是否存在
- 查看权限设置

## 📝 待实现功能

### 高优先级
- [ ] 技能市场浏览
- [ ] 技能更新检查
- [ ] 批量操作

### 中优先级
- [ ] 技能分组管理
- [ ] 导入/导出配置
- [ ] 技能依赖关系图

### 低优先级
- [ ] 技能使用统计
- [ ] 自定义主题
- [ ] 快捷键绑定

## 🎨 UI 定制

所有样式都在 `getStyles()` 函数中，使用 VSCode CSS 变量：

```javascript
// 主要变量
var(--vscode-font-family)
var(--vscode-foreground)
var(--vscode-background)
var(--vscode-button-background)
var(--vscode-panel-border)
// ... 更多变量
```

## 📚 相关文档

- [VSCode Extension API](https://code.visualstudio.com/api)
- [pa-skills 文档](./pa-skills/README.md)
- [设计方案](./plans/vscode-skills-manager-design.md)

## 💡 提示

- 修改代码后按 `Ctrl+R` 重新加载扩展开发主机窗口
- 使用 `console.log()` 输出调试信息
- WebView 中的错误会显示在开发者工具的 Console 中

---

**享受使用 Skills Manager! 🎉**
