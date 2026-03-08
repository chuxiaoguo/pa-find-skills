# 🎯 立即执行以下步骤

## 第一步：完全停止调试
在原 VSCode 窗口中：
- 按 **`Shift+F5`** 停止调试

## 第二步：关闭所有扩展开发主机窗口
- 检查是否有其他标题包含 "[Extension Development Host]" 的窗口
- 全部关闭

## 第三步：重新启动调试
- 按 **`F5`** 启动调试

## 第四步：等待新窗口完全加载
- 等待 3-5 秒
- 新窗口标题应该是 "[Extension Development Host] - skills-manager"

## 第五步：检查侧边栏

### 应该看到：
在**最左侧**的 Activity Bar（工具栏）中：
```
┌─────┐
│ 📁  │
│ ⚙️ │
│ 📦  │  ← 新图标！盒子形状
└─────┘
```

### 如果看不到：
1. **尝试重新加载窗口**
   - 在扩展开发主机窗口中按 `Ctrl+R`

2. **尝试显示侧边栏**
   - 按 `Ctrl+B` 切换侧边栏显示

3. **尝试命令面板**
   - 按 `Ctrl+Shift+P`
   - 输入：`View: Show Skills`
   - 回车

## 第六步：检查是否成功

### 打开开发者工具查看日志
- 按 `Ctrl+Shift+I`
- 查看 **Console** 标签
- 应该看到：
  ```
  === Skills Manager ACTIVATED ===
  === Skills Manager READY ===
  ```

### 打开输出面板查看日志
- 点击底部 **"输出"** 标签
- 在下拉菜单选择 **"Extension Host"**
- 应该能看到相关日志

---

## 🔍 调试提示

### 如果图标显示了 ✅
- 点击图标应该能看到 "🎯 Skills Manager" 页面
- 说明插件正常工作！

### 如果还是看不到 ❌
请截图并提供：
1. **开发者工具 Console** 的内容（Ctrl+Shift+I → Console）
2. **输出面板** 的内容（点击"输出"标签 → 选择 "Extension Host"）
3. **扩展列表** 中是否能看到 "Skills Manager"

---

## 📋 当前配置

我已创建**最简化版本**：
- ✅ 移除了自定义图标（使用 VSCode 内置）
- ✅ 移除了复杂的依赖
- ✅ 简化了 WebView 内容
- ✅ 移除了 activationEvents（让 VSCode 自动处理）

这是**最简单、最稳定**的配置，应该能正常工作。
