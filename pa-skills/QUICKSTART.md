# 快速开始指南

欢迎使用 Pingancoder Skills！这个指南将帮助你快速上手。

## 安装

### 全局安装（推荐）

```bash
npm install -g pingancoder-skills

# 或使用 pnpm
pnpm add -g pingancoder-skills
```

### 本地安装

```bash
# 克隆仓库
git clone <repository-url>
cd pa-skills

# 安装依赖
pnpm install

# 构建
pnpm build

# 链接到全局
pnpm link
```

## 初始化

### 1. 检查安装

```bash
pa-skills --version
```

### 2. 查看帮助

```bash
pa-skills --help
```

### 3. 检查状态

```bash
pa-skills status
```

## 认证设置

在使用内网 API 之前，你需要先登录：

```bash
pa-skills auth login
```

按提示输入用户名和密码。

### 查看认证状态

```bash
pa-skills auth status
```

## 安装你的第一个技能

### 从内网 API 安装

```bash
pa-skills add code-review
```

### 从本地路径安装

```bash
# 从本地目录
pa-skills add ./my-skills/awesome-skill

# 从相对路径
pa-skills add ../shared-skills/react-helper
```

### 从 Zip 文件安装

```bash
pa-skills add ./skill-package.zip
```

## 管理技能

### 列出已安装的技能

```bash
pa-skills list

# 或使用短命令
pa-skills ls
```

### 搜索技能

```bash
# 搜索所有技能
pa-skills find react

# 搜索特定分类
pa-skills find testing
```

### 移除技能

```bash
pa-skills remove code-review

# 或使用短命令
pa-skills rm code-review
```

## 更新技能

### 检查更新

```bash
pa-skills update
```

这会检查所有已安装技能的更新。

## 常见问题

### Q: 如何查看详细的安装日志？

A: 设置环境变量 `LOG_LEVEL=debug`：

```bash
LOG_LEVEL=debug pa-skills add my-skill
```

### Q: 技能安装到哪里了？

A: 技能安装在以下位置：

- **项目级**: `.agents/skills/<skill-name>/`
- **全局级**: `~/.agents/skills/<skill-name>/`

### Q: 如何切换 API 地址？

A: 编辑配置文件 `~/.pingancoder/config.json`：

```json
{
  "baseUrl": "http://your-api-server/api"
}
```

或使用环境变量：

```bash
export PINGANCODER_API_URL=http://your-api-server/api
```

### Q: 支持哪些 AI 代理？

A: 当前支持：

- **Gemini CLI**: `.gemini/skills/`
- **OpenCode**: `.agents/skills/`
- **OpenClaw**: `skills/`
- **Pingancoder**: `.agents/skills/`

### Q: 如何创建自己的技能？

A: 参考 [示例技能](../examples/example-skill/)：

1. 创建目录结构
2. 添加 `SKILL.md` 文件
3. 添加实现代码（可选）
4. 测试技能

```bash
mkdir my-skill
cd my-skill

# 创建 SKILL.md
cat > SKILL.md << 'EOF'
---
name: my-skill
description: 我的第一技能
version: 1.0.0
---

# My Skill

这是我的第一个技能！
EOF

# 测试安装
cd ..
pa-skills add ./my-skill
```

## 下一步

- 📖 阅读 [完整文档](README.md)
- 🔍 查看 [示例技能](../examples/)
- 🤝 参与 [贡献](CONTRIBUTING.md)
- 🐛 [报告问题](../../issues)

## 获取帮助

```bash
# 查看命令帮助
pa-skills --help

# 查看特定命令帮助
pa-skills add --help

# 查看认证状态
pa-skills auth status

# 查看系统状态
pa-skills status
```

## 技巧

### 批量安装

```bash
# 从文件读取技能列表并安装
cat skills.txt | xargs -I {} pa-skills add {}
```

### 自动更新

设置定时任务（crontab）：

```bash
# 每天检查更新
0 2 * * * /usr/local/bin/pa-skills update
```

### 配置别名

在你的 shell 配置中添加：

```bash
# ~/.bashrc 或 ~/.zshrc
alias ps='pa-skills'
alias psl='pa-skills list'
alias psf='pa-skills find'
alias psa='pa-skills add'
alias psr='pa-skills remove'
```

---

祝你使用愉快！🚀
