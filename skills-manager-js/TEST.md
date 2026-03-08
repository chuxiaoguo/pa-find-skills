# 🔍 调试检查清单

## 现在请按以下步骤操作：

### 1. 完全停止调试
- 回到原 VSCode 窗口
- 按 `Shift+F5` 停止调试

### 2. 重新启动
- 按 `F5` 启动调试

### 3. 在新窗口中检查

#### A. 查看扩展是否激活
1. 打开 **开发者工具** (Ctrl+Shift+I)
2. 切换到 **Console** 标签
3. 应该看到：`[Skills Manager] Extension activating...`

#### B. 查看输出面板
1. 点击底部 **"输出"** 标签
2. 在下拉菜单选择 **"Extension Host"**
3. 查找 `[Skills Manager]` 日志

#### C. 查看侧边栏
- 在最左侧的 Activity Bar 中
- 应该能看到一个 **盒子图标** 📦
- 图标下方显示 "Skills Manager"

### 4. 如果还是看不到图标

#### 方法 A：使用命令面板
1. 按 `Ctrl+Shift+P`
2. 输入：`View: Show Skills`
3. 或输入：`skillsManager`

#### 方法 B：检查扩展列表
1. 点击左侧扩展图标（四个方块）
2. 搜索 "Skills Manager"
3. 确认已启用

### 5. 截图检查清单

请告诉我以下信息：

- [ ] 开发者工具 Console 中有 `[Skills Manager]` 日志吗？
- [ ] 输出面板中有 Extension Host 日志吗？
- [ ] 侧边栏能看到盒子图标吗？
- [ ] 扩展列表中能看到 Skills Manager 吗？

---

## 🎯 最简测试版本

我已经创建了一个最简化的版本：
- 移除了自定义图标（使用 VSCode 内置图标）
- 简化了 WebView 内容
- 移除了复杂的依赖

这个版本应该能正常显示图标。

---

## 🐛 如果还是不行

请打开 **开发者工具** (Ctrl+Shift+I)，截图并告诉我：
1. Console 标签的内容
2. 是否有任何错误信息

这样我能更准确地诊断问题。
