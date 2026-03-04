# Examples

本目录包含示例技能，帮助你快速了解如何创建和使用技能。

## 示例技能

### example-skill

一个基础的示例技能，展示了：

- SKILL.md 文件格式
- 技能元数据
- TypeScript 实现代码
- 最佳实践

## 安装示例技能

```bash
# 从本地路径安装
pa-skills add ./examples/example-skill

# 或者先打包成 Zip
cd examples
zip -r example-skill.zip example-skill/
pa-skills add example-skill.zip
```

## 创建自己的技能

1. 创建新目录
2. 添加 SKILL.md 文件（必需）
3. 添加实现代码（可选）
4. 测试技能
5. 分享技能

## SKILL.md 格式

```markdown
---
name: your-skill-name
description: 技能描述
version: 1.0.0
category: tools
author: Your Name
tags:
  - tag1
  - tag2
---

# 技能标题

技能的详细说明...

## 功能

列出技能的功能

## 使用方法

说明如何使用这个技能
```

## 更多信息

查看 [项目文档](../README.md) 了解更多。
