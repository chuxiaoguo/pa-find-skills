# Skills Manager VSCode Extension

一个用于管理 pa-skills 的 Visual Studio Code 扩展。

## 功能特性

- ✅ 查看已安装的技能（全局/本地）
- ✅ 技能卡片网格布局，响应式设计
- ✅ 技能详情查看（概述、元数据、文件树）
- ✅ 搜索和筛选技能
- ✅ 安装/卸载技能
- ✅ 在 VSCode 中直接编辑技能文件

## 开发

### 安装依赖

```bash
npm install
```

### 编译

```bash
npm run compile
```

### 监听模式

```bash
npm run watch
```

### 在 VSCode 中调试

1. 按 F5 启动扩展开发宿主
2. 在新窗口中，侧边栏会出现 "Skills Manager" 面板
3. 进行开发和调试

## 技术栈

- VSCode Extension API
- React 18
- TypeScript
- Webpack

## 依赖

- Node.js >= 18
- pa-skills CLI 工具

## 项目结构

```
vscode-skills-manager/
├── src/
│   ├── extension.ts          # 扩展入口
│   ├── services/
│   │   ├── CLIAdapter.ts     # CLI 适配器
│   │   └── SkillsManager.ts  # 技能管理服务
│   ├── types/
│   │   └── index.ts          # 类型定义
│   └── webview/
│       ├── index.tsx         # React 应用入口
│       ├── components/       # React 组件
│       └── styles/           # 样式文件
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## 开发计划

- [x] 基础框架搭建
- [x] 技能列表展示
- [x] 技能详情页面
- [x] 搜索和筛选
- [x] 文件树组件
- [ ] Pingancoder 市场集成
- [ ] 文件系统监听
- [ ] 错误处理优化

## 许可证

MIT
