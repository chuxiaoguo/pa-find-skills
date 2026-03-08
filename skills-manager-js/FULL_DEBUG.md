# 🔍 完整调试步骤 - 请逐一执行

## 准备工作
✅ 已更新代码到最简版本
✅ 移除了自定义图标，使用 VSCode 内置图标
✅ 移除了复杂依赖

---

## 步骤 1：停止所有调试

1. 在**原 VSCode 窗口**（不是扩展开发主机）
2. 按 **`Shift+F5`** 停止调试
3. 检查是否有其他标题包含 `[Extension Development Host]` 的窗口
4. **全部关闭**

---

## 步骤 2：重新启动

1. 在原 VSCode 窗口按 **`F5`**
2. 等待新窗口打开
3. 新窗口标题应该是：`[Extension Development Host] - skills-manager`
4. **等待 5 秒**让扩展完全加载

---

## 步骤 3：检查侧边栏 Activity Bar

### 位置说明
Activity Bar 在**最左侧**的垂直工具栏，通常有：
- 文件管理器图标（纸张图标）
- 搜索图标（放大镜）
- 源代码管理图标（分支图标）
- 调试图标（虫子图标）
- **扩展图标（四个方块）**

### 查找新图标
在 Activity Bar 中**向下滚动**，应该能看到：
- **一个盒子图标 📦**（这是 VSCode 的包图标）
- 图标下方/旁边显示 "Skills Manager" 或 "Skills"

### 如果看不到新图标

#### 尝试方法 A：显示/隐藏侧边栏
- 在扩展开发主机窗口中按 **`Ctrl+B`** 多次
- 侧边栏会在隐藏/显示之间切换

#### 尝试方法 B：重置窗口布局
- 按 **`Ctrl+Shift+P`**
- 输入：`View: Reset View Locations`
- 回车

#### 尝试方法 C：直接打开视图
- 按 **`Ctrl+Shift+P`**
- 输入：`View: Show Skills`
- 回车

---

## 步骤 4：确认扩展已加载

### 检查 A：查看开发者工具
1. 在扩展开发主机窗口中按 **`Ctrl+Shift+I`**
2. 切换到 **Console** 标签
3. **必须看到**：
   ```
   === Skills Manager ACTIVATED ===
   === Skills Manager READY ===
   ```

### 检查 B：查看输出面板
1. 点击底部 **"输出"** 标签
2. 在下拉菜单中选择 **"Extension Host"**
3. 应该看到相关日志

### 检查 C：查看扩展列表
1. 点击左侧的**扩展图标**（四个方块）
2. 在搜索框输入：`skills-manager`
3. 应该能看到 **Skills Manager** 扩展
4. 确认扩展已启用（不是禁用状态）

---

## 步骤 5：测试命令

### 测试 A：命令面板
1. 按 **`Ctrl+Shift+P`**
2. 输入：`Hello`
3. 应该能看到命令：`Skills Manager: Hello`
4. 执行后应该弹出通知："Hello from Skills Manager!"

### 测试 B：直接命令
在扩展开发主机窗口中按 **`Ctrl+``（Ctrl 加号/等号）打开命令面板，输入：
```
skillsManager.hello
```

---

## 🎯 如果成功

### 点击图标后应该看到：
```
┌─────────────────────────────┐
│ 🎯 Skills Manager            │
│                              │
│ 插件已加载！                │
│ 如果你看到这个，说明一切正常。 │
└─────────────────────────────┘
```

---

## ❌ 如果还是不工作

### 请提供以下信息：

1. **开发者工具 Console 的截图**
   - 按 `Ctrl+Shift+I`
   - 切换到 Console 标签
   - 截图给我

2. **输出面板的内容**
   - 点击"输出"标签
   - 选择 "Extension Host"
   - 复制所有文本给我

3. **扩展列表状态**
   - 点击扩展图标（四个方块）
   - 搜索 "skills-manager"
   - 告诉我是否显示，是否启用

4. **VSCode 版本**
   - 按 `Ctrl+Shift+P`
   - 输入 `About`
   - 查看 VSCode 版本号

---

## 💡 额外提示

### 如果看到错误信息
可能是：
- `Cannot find module 'vscode'` → 需要重新安装 npm 包
- `Extension not activated` → 激活事件问题
- `View not found` → 视图 ID 不匹配

### 如果侧边栏确实有图标但很隐蔽
尝试：
1. 在 VSCode 设置中增加侧边栏图标大小
2. 或者直接使用命令面板打开：`Ctrl+Shift+P` → `View: Show Skills`
