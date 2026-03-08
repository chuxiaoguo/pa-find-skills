# 🔍 诊断 Skills Manager

## 问题：扫描不出本地技能

可能的原因：
1. pa-skills CLI 未安装
2. 工作区未打开
3. CLI 路径查找失败

## 测试步骤

### 1. 测试 pa-skills CLI

在终端中运行：
```bash
# 检查 pa-skills 是否安装
pa-skills --version

# 列出已安装的技能
pa-skills list

# 使用 JSON 格式
pa-skills list --json
```

### 2. 检查工作区

确保 VSCode 打开了一个文件夹（工作区），而不是单独的文件。

### 3. 打开开发者工具查看错误

1. 按 `Ctrl+Shift+I` 打开开发者工具
2. 切换到 Console 标签
3. 查找红色错误信息
4. 截图发给我

### 4. 查看 Extension Host 输出

1. 点击底部 "输出" 标签
2. 在下拉菜单选择 "Extension Host"
3. 查看日志信息
4. 复制所有文本给我

## 临时解决方案

如果 pa-skills 未安装，我可以：
1. 修改代码，不依赖 CLI，直接扫描技能目录
2. 使用文件系统 API 直接读取技能信息

请告诉我您希望如何处理。
