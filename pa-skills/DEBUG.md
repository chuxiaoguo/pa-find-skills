# 调试指南

本文档介绍如何调试 Pingancoder Skills 项目。

## 🔗 全局链接

### 链接到全局

```bash
cd pa-skills
pnpm link --global
```

### 验证链接

```bash
# 查看全局链接
pnpm list --global --depth=0

# 测试命令
pa-skills --version
pa-skills --help
```

### 取消链接

```bash
pnpm unlink --global
```

## 🐛 调试方法

### 方法 1: 使用 watch 模式（推荐）

在 `pa-skills` 目录下：

```bash
npm run dev:watch
```

这会监视文件变化并自动重启。

### 方法 2: 手动重新构建

```bash
# 1. 修改代码后，在 pa-skills 目录重新构建
cd pa-skills
npm run build

# 2. 在另一个终端测试
pa-skills status
```

### 方法 3: 直接运行源码（开发时）

```bash
cd pa-skills
npx tsx src/cli.ts <command>
```

## 🧪 测试场景

### 1. 测试本地技能安装

创建一个测试技能：

```bash
mkdir /tmp/test-skill
cd /tmp/test-skill

# 创建 SKILL.md
cat > SKILL.md << 'EOF'
---
name: test-skill
description: 测试技能
version: 1.0.0
---

# Test Skill

这是一个测试技能。
EOF

# 安装测试技能
pa-skills add /tmp/test-skill

# 列出技能
pa-skills list

# 移除技能
pa-skills remove test-skill
```

### 2. 测试 Zip 安装

```bash
cd /tmp
mkdir zip-test
cd zip-test

# 创建技能
cat > SKILL.md << 'EOF'
---
name: zip-test
description: Zip 测试技能
version: 1.0.0
---

# Zip Test

测试 Zip 安装。
EOF

# 打包（Linux/Mac）
cd /tmp
zip -r zip-test.zip zip-test/

# 打包（Windows PowerShell）
Compress-Archive -Path zip-test/* -DestinationPath zip-test.zip -Force

# 安装
pa-skills add zip-test.zip

# 清理
pa-skills remove zip-test
```

### 3. 测试全局安装

```bash
# 项目级安装（默认）
pa-skills add ./test-skill
# 安装到: 当前项目/.agents/skills/

# 全局安装
pa-skills add --global ./test-skill
# 或使用简写
pa-skills add -g ./test-skill
# 安装到: ~/.config/pingancoder/skills/ (pingancoder)
# 安装到: ~/.gemini/skills/ (gemini)
# 安装到: ~/.config/opencode/skills/ (opencode)

# 验证安装位置
# 项目级
ls .agents/skills/

# 全局 - pingancoder
ls ~/.config/pingancoder/skills/

# 全局 - gemini
ls ~/.gemini/skills/

# 全局 - opencode
ls ~/.config/opencode/skills/

# 查看已安装的技能（包含全局和项目级）
pa-skills list
```

**安装位置对比**：

| 代理 | 项目级 | 全局 |
|------|--------|------|
| **Pingancoder** | `.agents/skills/` | `~/.config/pingancoder/skills/` |
| **Gemini CLI** | `.agents/skills/` | `~/.gemini/skills/` |
| **OpenCode** | `.agents/skills/` | `~/.config/opencode/skills/` |
| **OpenClaw** | `skills/` | `~/.openclaw/skills/` |

### 4. 测试认证流程

```bash
# 查看认证状态
pa-skills auth status

# 测试登录（会失败，因为没有真实的 API）
pa-skills auth login
# 输入任意用户名和密码测试
```

## 📋 调试清单

- [ ] 全局链接成功
- [ ] 命令可以正常运行
- [ ] 技能可以正常安装
- [ ] 技能可以正常移除
- [ ] 列表命令正常显示
- [ ] 状态命令正常显示

## 🔍 日志和调试信息

### 启用调试日志

```bash
LOG_LEVEL=debug pa-skills status
```

### 查看锁文件

```bash
# 全局锁文件
cat ~/.agents/.skill-lock.json

# 本地锁文件（在项目目录）
cat skills-lock.json
```

### 查看认证信息

```bash
# 认证文件
cat ~/.pingancoder/auth.json

# 配置文件
cat ~/.pingancoder/config.json
```

## 🛠️ VS Code 调试配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/cli.ts"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Add Command",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["tsx", "src/cli.ts", "add", "./test-skill"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

使用方法：
1. 按 F5 或点击"运行和调试"
2. 选择配置
3. 设置断点
4. 开始调试

## 🐛 常见问题

### 问题 1: 命令找不到

```bash
# 检查全局 bin 目录
npm config get prefix

# 确保全局 bin 目录在 PATH 中
export PATH=$PATH:$(npm config get prefix)/bin

# 重新链接
cd pa-skills
pnpm link --global
```

### 问题 2: 修改代码后没有生效

```bash
# 确保重新构建了
cd pa-skills
npm run build

# 如果使用 watch 模式，文件会自动重新编译
npm run dev:watch
```

### 问题 3: 类型错误

```bash
# 运行类型检查
npm run type-check

# 如果有错误，修复后重新构建
npm run build
```

## 📝 开发工作流

推荐的开发流程：

1. **启动 watch 模式**
   ```bash
   cd pa-skills
   npm run dev:watch
   ```

2. **在另一个终端测试**
   ```bash
   pa-skills <command>
   ```

3. **修改代码并自动重新加载**

4. **验证修改**

## 🚀 发布流程

```bash
# 1. 运行所有检查
npm run check
npm run type-check
npm run test

# 2. 构建项目
npm run build

# 3. 发布到 npm（或内部仓库）
npm publish
```

---

**提示**: 使用 `npm run dev:watch` 可以在开发时自动重新加载代码变更！
