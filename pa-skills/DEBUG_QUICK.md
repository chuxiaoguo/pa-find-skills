# 🐛 快速调试指南

## 方法 1: 直接运行（开发推荐）

```bash
cd pa-skills

# 运行任意命令
npx tsx src/cli.ts <command>

# 示例
npx tsx src/cli.ts --help
npx tsx src/cli.ts status
npx tsx src/cli.ts list
```

## 方法 2: 使用 watch 模式

```bash
cd pa-skills

# 启动监视模式（自动重新加载）
npm run dev:watch

# 在另一个终端测试命令
pa-skills status
```

## 方法 3: 构建后运行

```bash
cd pa-skills

# 1. 构建项目
npm run build

# 2. 运行构建后的命令
node bin/cli.mjs <command>

# 示例
node bin/cli.mjs --help
node bin/cli.mjs status
```

## 方法 4: 全局链接

```bash
# 1. 链接到全局
cd pa-skills
npm link

# 2. 在任何地方使用
pa-skills <command>

# 示例
pa-skills --help
pa-skills status
pa-skills list

# 3. 修改代码后重新构建
cd pa-skills
npm run build
```

## 🧪 测试本地技能

```bash
# 1. 创建测试技能
mkdir /tmp/test-skill
cat > /tmp/test-skill/SKILL.md << 'EOF'
---
name: my-test
description: 我的测试技能
version: 1.0.0
---

# My Test Skill

这是一个测试技能！
EOF

# 2. 安装测试技能
pa-skills add /tmp/test-skill

# 3. 查看已安装技能
pa-skills list

# 4. 移除测试技能
pa-skills remove my-test
```

## 📝 调试技巧

### 查看日志

```bash
# 启用调试日志
LOG_LEVEL=debug pa-skills status
```

### 查看锁文件

```bash
# 全局锁
cat ~/.agents/.skill-lock.json

# 本地锁
cat skills-lock.json
```

### 修改代码后

```bash
# 如果使用 watch 模式，自动重新加载
npm run dev:watch

# 否则重新构建
npm run build
```

## 🎯 推荐工作流

```bash
# 终端 1: 启动 watch 模式
cd pa-skills
npm run dev:watch

# 终端 2: 测试命令
pa-skills status
pa-skills list

# 修改代码后自动重新加载
```

---

**提示**: 使用 `npm run dev:watch` 可以自动重新加载代码变更！
