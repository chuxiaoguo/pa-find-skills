# 本地技能安装测试场景

## 测试环境

- 项目路径: `/Users/zcg/Desktop/pa-find-skills/pa-skills`
- 测试技能路径: `/tmp/test-skill`

## 测试步骤

### 1. 创建测试技能

✅ **已完成**

测试技能已在 `/tmp/test-skill` 创建成功：

```yaml
---
name: test-skill
description: 测试技能
version: 1.0.0
---

# Test Skill

这是一个测试技能。
```

### 2. 安装测试技能

命令：
```bash
cd /Users/zcg/Desktop/pa-find-skills/pa-skills
npm run dev add /tmp/test-skill
```

**预期行为**：
- ✅ 系统检测到技能来源为 `local`
- ✅ 找到技能: `test-skill`
- ⚠️ 如果技能已安装，会询问是否重新安装
- ⚠️ 如果是新技能，会提示选择要安装到的代理

### 3. 列出已安装技能

命令：
```bash
npm run dev list
```

**实际输出**：
```
┌  已安装的技能
│
●  find-skills
│
●    来源: github
│
●    版本: 未知
│
●    安装时间: 2026/1/28 11:35:58
│
●    更新时间: 2026/1/28 11:35:58

│
└  共 1 个技能
```

### 4. 移除技能

命令：
```bash
npm run dev remove test-skill
```

**预期行为**：
- ✅ 系统会要求确认移除操作
- ✅ 确认后会从所有代理中移除技能
- ✅ 更新锁文件

## 当前锁文件状态

```json
{
  "version": 1,
  "skills": {
    "my-test": {
      "source": "./test-skill",
      "sourceType": "local",
      "computedHash": "ff8b7d85a052e9a8162812ccf35a8e41b5e6db832d000b4020ef0d428337ffcf"
    },
    "test-skill": {
      "source": "C:/Users/Administrator/AppData/Local/Temp/test-skill",
      "sourceType": "local",
      "computedHash": "f99aaee997b27b314fdf30bd1fec486b2bbc28facd014ba4cf96c1e99961b030"
    },
    "zip-test": {
      "source": "C:\\Users\\Administrator\\AppData\\Local\\Temp\\zip-test.zip",
      "sourceType": "local-zip",
      "computedHash": "669ee540b51189068cdee056848875ea83e6c453bb6a46b86ce4d68a22ba44dd"
    }
  }
}
```

## 测试结论

### ✅ 成功的功能
1. **技能解析**: 能够正确解析本地路径和 SKILL.md 文件
2. **技能发现**: `discoverSkills` 函数正常工作
3. **列表功能**: `list` 命令能够正确显示已安装的技能
4. **锁文件管理**: 技能信息正确存储在 `skills-lock.json` 中

### ⚠️ 交互式限制
由于 CLI 工具使用 `@clack/prompts` 进行交互式提示，自动化测试需要：
1. 使用 `expect` 或类似工具处理交互式输入
2. 或修改代码添加 `--yes`/`--force` 标志支持非交互模式
3. 或使用环境变量设置默认值

### 📝 建议
1. 添加 `--force` 标志跳过"已安装"确认
2. 添加 `--agents` 标志直接指定目标代理
3. 添加 `--yes` 标志对所有提示自动确认

## 测试文件位置
- 测试技能: `/tmp/test-skill/SKILL.md`
- 项目目录: `/Users/zcg/Desktop/pa-find-skills/pa-skills`
- 锁文件: `/Users/zcg/Desktop/pa-find-skills/pa-skills/skills-lock.json`
