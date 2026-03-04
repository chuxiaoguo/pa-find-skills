# Pingancoder Skills

企业内网版本的 AI 技能管理工具，基于 skills-main 改造。

## 功能特性

- **技能安装**: 从内网静态资源服务、本地路径或本地 Zip 文件安装技能
- **技能管理**: 列出、搜索、移除已安装的技能
- **更新检测**: 通过内网 API 检查并更新技能到最新版本
- **多代理支持**: 支持 gemini、opencode、openclaw、pingancoder 四种代理
- **版本锁定**: 通过锁文件追踪技能版本
- **认证管理**: 内网服务认证和 Token 自动管理

## 安装

```bash
npm install -g pingancoder-skills
```

## 使用

### 查看帮助

```bash
pa-skills --help
```

### 登录认证

```bash
pa-skills auth login
```

### 添加技能

```bash
# 从内网 API 添加
pa-skills add code-review

# 从本地路径添加
pa-skills add ./local-skills

# 从本地 Zip 文件添加
pa-skills add ./skill.zip
```

### 列出已安装技能

```bash
pa-skills list
```

### 搜索技能

```bash
pa-skills find react
```

### 移除技能

```bash
pa-skills remove code-review
```

### 更新技能

```bash
pa-skills update
```

### 查看状态

```bash
pa-skills status
```

## 支持的代理

- **Gemini CLI**: `.gemini/skills`
- **OpenCode**: `.agents/skills`
- **OpenClaw**: `skills/`
- **Pingancoder**: `.agents/skills`

## 配置

配置文件位置: `~/.pingancoder/config.json`

```json
{
  "baseUrl": "http://internal-server/api",
  "downloadBaseUrl": "http://internal-server/downloads",
  "timeout": 30000
}
```

## 环境变量

- `PINGANCODER_API_URL`: 内网 API 基础地址
- `PINGANCODER_DOWNLOAD_URL`: 下载服务基础地址
- `PINGANCODER_TIMEOUT`: 请求超时时间（毫秒）

## 技术栈

- Node.js >= 18
- TypeScript 5.9
- pnpm 10.17.1

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式
pnpm dev

# 运行测试
pnpm test
```

## 许可证

MIT

---

**基于**: [skills-main](https://github.com/vercel-labs/skills) 改造
**版本**: 1.0.0
