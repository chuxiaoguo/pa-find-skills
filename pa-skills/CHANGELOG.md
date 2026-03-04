# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-05

### Added
- 🎉 初始版本发布
- ✨ 支持从内网 API 安装技能
- ✨ 支持从本地路径安装技能
- ✨ 支持从本地 Zip 文件安装技能
- ✨ 支持 gemini、opencode、openclaw、pingancoder 四种代理
- ✨ 完整的认证系统和会话管理
- ✨ 技能锁文件系统
- ✨ 命令行接口 (CLI)
  - `pa-skills add` - 添加技能
  - `pa-skills remove` - 移除技能
  - `pa-skills list` - 列出技能
  - `pa-skills find` - 搜索技能
  - `pa-skills update` - 更新技能
  - `pa-skills auth` - 认证管理
  - `pa-skills status` - 查看状态

### Changed
- 🔄 从 skills-main 改造为企业内网版本
- 🔄 精简代理支持（从 42+ 减少到 4 个）
- 🔄 移除外部 API 依赖，使用内网 API

### Security
- 🔒 添加路径遍历防护
- 🔒 Token 加密存储
- 🔒 权限隔离

---

## 计划中的功能

### [1.1.0] - 计划中
- [ ] Web UI 界面
- [ ] 技能依赖管理
- [ ] 技能版本化
- [ ] 企业 SSO 集成
- [ ] 技能审核工作流

### [1.2.0] - 计划中
- [ ] 技能市场
- [ ] 技能评分和评论
- [ ] 企业级权限管理
- [ ] 技能使用统计
