# 安装交互流程测试指南

## 🎨 新增功能：PA-SKILLS 标题

在找到技能后显示标志性的 PA-SKILLS ASCII 艺术标题。

### 显示效果

```
 ██████╗██╗      ██████╗ ██╗   ██╗██████╗
██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗
███████╗██║     ██║   ██║██║   ██║██████╔╝
╚════██║██║     ██║   ██║██║   ██║██╔══██╗
███████║███████╗╚██████╔╝╚██████╔╝██████╔╝
╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝
```

---

## 📋 完整交互流程

```
┌   Pingancoder Skills
│
◇  从 local-zip 获取技能...
│
◇  发现 2 个技能
│
◇  请选择要安装的技能
│  test-skill-1 - First test skill for multi-skill selection
│  test-skill-2 - Second test skill for multi-skill selection
│
◇  找到技能: test-skill-1
│
 ██████╗██╗      ██████╗ ██╗   ██╗██████╗
██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗
███████╗██║     ██║   ██║██║   ██║██████╔╝
╚════██║██║     ██║   ██║██║   ██║██╔══██╗
███████║███████╗╚██████╔╝╚██████╔╝██████╔╝
╚══════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝
│
◇  选择要安装到的代理
│  [*] Gemini CLI
│  [*] OpenCode
│
◇  选择安装范围
│  ● 项目级 (仅当前项目可用)
│  ○ 全局 (所有项目可用)
│
◇  选择安装模式
│  ● 符号链接 (推荐，节省空间，便于更新)
│  ○ 复制 (兼容性更好，占用更多空间)
│
┌─────────────────────────────────────────────┐
│ 安装摘要                                    │
│                                             │
│ 技能名称：test-skill-1                      │
│ 描述：First test skill for multi-skill...   │
│                                             │
│ 安装范围：项目                              │
│ 安装模式：符号链接                          │
│                                             │
│ 目标代理：                                  │
│   • Gemini CLI                             │
│   • OpenCode                               │
└─────────────────────────────────────────────┘
│
◇  确认安装？Yes
│
◇  正在安装...

┌─────────────────────────────────────────────┐
│ 安装详情                                    │
│                                             │
│ ✓ Gemini CLI: 成功                         │
│   → /tmp/test-project/.agents/skills/...   │
│   → /Users/user/.gemini/skills/...         │
│                                             │
│ ✓ OpenCode: 成功                           │
│   → /tmp/test-project/.agents/skills/...   │
│   → /Users/user/.opencode/skills/...       │
└─────────────────────────────────────────────┘
│
└  ✓ 技能安装成功
```

---

## 🧪 测试准备

### 1. 测试多技能选择功能

```bash
# 测试文件
/tmp/multi-skills-test.zip
# 包含技能: test-skill-1, test-skill-2

cd /tmp/test-project
node /Users/zcg/Desktop/pa-find-skills/pa-skills/dist/cli.js add /tmp/multi-skills-test.zip
```

**预期行为：**
1. 显示 "发现 2 个技能"
2. 弹出选择列表
3. 选择技能后显示 PA-SKILLS 标题
4. 继续选择代理、范围、模式

### 2. 测试 PA-SKILLS 标题显示

标题应在以下时机显示：
- ✅ 找到技能之后
- ✅ 选择代理之前
- ✅ 使用青色 (cyan) 显示

### 3. 测试安装范围选择

**命令行未指定 --global 时：**
```
◇  选择安装范围
  ● 项目级 (仅当前项目可用) [默认]
  ○ 全局 (所有项目可用)
```

**命令行指定 --global 时：**
- 跳过安装范围选择
- 直接进入安装模式选择

### 4. 测试安装模式选择

**始终询问：**
```
◇  选择安装模式
  ● 符号链接 (推荐，节省空间，便于更新) [默认]
  ○ 复制 (兼容性更好，占用更多空间)
```

---

## 📝 功能清单

| 功能 | 状态 | 代码位置 |
|------|------|----------|
| 多技能选择 | ✅ | add.ts:22-51 |
| PA-SKILLS 标题 | ✅ | add.ts:195-207 |
| 安装范围选择 | ✅ | add.ts:209-247 |
| 安装模式选择 | ✅ | add.ts:249-268 |
| 安装摘要确认 | ✅ | add.ts:56-87 |
| 详细安装结果 | ✅ | add.ts:92-132 |

---

## 🚀 快速测试

```bash
# 1. 创建测试项目
mkdir -p /tmp/test-pa-skills
cd /tmp/test-pa-skills

# 2. 测试完整交互流程
node /Users/zcg/Desktop/pa-find-skills/pa-skills/dist/cli.js add /tmp/multi-skills-test.zip

# 3. 测试全局安装（跳过范围选择）
node /Users/zcg/Desktop/pa-find-skills/pa-skills/dist/cli.js add /tmp/multi-skills-test.zip --global
```

---

## 🎯 验证要点

- [ ] PA-SKILLS 标题正确显示（青色 ASCII 艺术）
- [ ] 多技能时显示选择列表
- [ ] 安装范围选择（无 --global 时）
- [ ] 安装模式选择（始终）
- [ ] 安装摘要显示所有选项
- [ ] 安装详情显示路径和模式
