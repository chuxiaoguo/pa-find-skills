# Pingancoder Skills 项目总结

## 📋 项目概述

**Pingancoder Skills** 是基于 [skills-main](https://github.com/vercel-labs/skills) 改造的企业内网版本 AI 技能管理工具。

### 主要变更

| 方面 | skills-main | Pingancoder Skills |
|------|-------------|-------------------|
| 技能来源 | 外部 GitHub API | 内网 API |
| 代理数量 | 42+ | 4 |
| 提供者数量 | 7+ | 3 |
| 认证系统 | 无 | Token 认证 |
| 下载方式 | Git clone | API 下载 + Zip |

## 🎯 核心功能

### 1. 技能管理

- ✅ **添加技能**: 支持从内网 API、本地路径、本地 Zip 安装
- ✅ **列出技能**: 显示所有已安装技能及详细信息
- ✅ **移除技能**: 从所有代理中移除技能
- ✅ **搜索技能**: 从内网 API 搜索可用技能
- ✅ **更新技能**: 检查并更新技能到最新版本

### 2. 代理支持

支持的 AI 代理：
- **Gemini CLI** (`.gemini/skills`)
- **OpenCode** (`.agents/skills`)
- **OpenClaw** (`skills/`)
- **Pingancoder** (`.agents/skills`)

### 3. 认证系统

- Token 认证
- 会话管理
- 自动刷新 Token
- 加密存储

### 4. 锁文件系统

- 全局锁文件 (`~/.agents/.skill-lock.json`)
- 本地锁文件 (`skills-lock.json`)
- 版本追踪
- 哈希验证

## 📁 项目结构

```
pa-skills/
├── src/
│   ├── 核心模块
│   │   ├── types.ts              # 类型定义
│   │   ├── constants.ts          # 常量定义
│   │   ├── agents.ts             # 代理配置（4个）
│   │   ├── config.ts             # 配置管理
│   │   ├── init.ts               # 初始化
│   │   ├── utils.ts              # 工具函数
│   │   └── logger.ts             # 日志模块
│   │
│   ├── 认证 & 安全
│   │   └── pingancoder-auth.ts   # 认证管理
│   │
│   ├── 技能处理
│   │   ├── skills.ts             # 技能发现
│   │   ├── plugin-manifest.ts    # 插件清单
│   │   ├── installer.ts          # 安装引擎
│   │   ├── source-parser.ts      # 源解析器
│   │   └── zip-handler.ts        # Zip 处理
│   │
│   ├── 锁文件系统
│   │   ├── skill-lock.ts         # 全局锁
│   │   └── local-lock.ts         # 本地锁
│   │
│   ├── 提供者系统
│   │   └── providers/
│   │       ├── index.ts          # 提供者入口
│   │       ├── registry.ts       # 提供者注册
│   │       ├── pingancoder-provider.ts    # 内网 API
│   │       ├── local-path-provider.ts     # 本地路径
│   │       └── local-zip-provider.ts      # 本地 Zip
│   │
│   └── 命令系统
│       ├── cli.ts                # CLI 入口
│       ├── add.ts                # 添加命令
│       ├── remove.ts             # 移除命令
│       ├── list.ts               # 列出命令
│       ├── find.ts               # 搜索命令
│       ├── update.ts             # 更新命令
│       ├── auth.ts               # 认证命令
│       └── status.ts             # 状态命令
│
├── bin/
│   └── cli.mjs                   # 可执行入口
│
├── examples/
│   └── example-skill/            # 示例技能
│       ├── SKILL.md
│       └── index.ts
│
├── scripts/
│   ├── build-dist.js             # 构建脚本
│   ├── dev.js                    # 开发脚本
│   └── check.js                  # 健康检查
│
└── 配置文件
    ├── package.json
    ├── tsconfig.json
    ├── .prettierrc
    ├── .gitignore
    ├── .env.example
    └── .vscode/
        ├── settings.json
        └── extensions.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd pa-skills
pnpm install
```

### 2. 运行健康检查

```bash
node scripts/check.js
```

### 3. 开发模式

```bash
pnpm dev --help
```

### 4. 构建

```bash
pnpm build
```

## 📖 命令参考

```bash
# 查看帮助
pa-skills --help

# 认证管理
pa-skills auth login              # 登录
pa-skills auth status             # 查看状态
pa-skills auth logout             # 登出

# 技能管理
pa-skills add <source>            # 添加技能
pa-skills list                    # 列出技能
pa-skills find <query>            # 搜索技能
pa-skills remove <skill>          # 移除技能
pa-skills update                  # 更新技能

# 状态
pa-skills status                  # 查看系统状态
```

## 🔧 技术栈

- **运行时**: Node.js >= 18
- **语言**: TypeScript 5.9
- **包管理**: pnpm 10.17.1
- **构建工具**: tsc
- **测试框架**: vitest
- **交互式提示**: @clack/prompts
- **Zip 处理**: extract-zip
- **YAML 解析**: gray-matter
- **彩色输出**: picocolors

## 📝 待办事项

### 短期

- [ ] 完成单元测试
- [ ] 添加集成测试
- [ ] 完善 API 文档
- [ ] 性能优化

### 中期

- [ ] Web UI 界面
- [ ] 技能依赖管理
- [ ] 技能版本化
- [ ] 企业 SSO 集成

### 长期

- [ ] 技能市场
- [ ] 技能评分系统
- [ ] 企业级权限管理
- [ ] 技能使用统计

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🔗 相关链接

- [技术文档](../plans/README.md)
- [快速开始](QUICKSTART.md)
- [完整文档](README.md)
- [贡献指南](CONTRIBUTING.md)
- [变更日志](CHANGELOG.md)

---

**版本**: 1.0.0
**基于**: skills-main
**创建时间**: 2025-03-05
**最后更新**: 2025-03-05
