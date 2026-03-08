# 🔧 技能管理器插件调试指南

## 问题：侧边栏没有显示插件图标

### 可能的原因和解决方案

#### 1. 扩展没有正确激活

**检查方法**：
1. 打开扩展开发主机窗口
2. 按 `Ctrl+Shift+P` 打开命令面板
3. 输入 "Developer: Reload Window"
4. 重新加载窗口

#### 2. 需要重新安装扩展

**解决步骤**：
```bash
# 1. 关闭所有扩展开发主机窗口
# 2. 在原 VSCode 窗口中按 Ctrl+Shift+P
# 3. 输入 "Extensions: Show Installed Extensions"
# 4. 找到 "Skills Manager" 并禁用/重新启用
# 5. 重新按 F5 启动调试
```

#### 3. 检查输出面板

1. 查看 "输出" 标签页
2. 在下拉菜单中选择 "Extension Host"
3. 查找 `[Skills Manager]` 日志

#### 4. 确认 package.json 配置

检查 `contributes` 部分：
- `viewsContainers.activitybar` 是否存在
- `views` 是否正确配置
- `icon` 路径是否正确

### 快速修复

#### 方案 1：使用命令面板打开

如果图标不显示，可以通过命令打开：
1. 按 `Ctrl+Shift+P`
2. 输入 "Skills Manager: Show"
3. 或输入 "View: Show Skills Manager"

#### 方案 2：检查图标文件

确保图标文件存在：
```bash
ls -la resources/icon.svg
```

如果不存在，创建一个简单的图标。

#### 方案 3：简化配置

尝试最简化的配置：

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "skillsManagerContainer",
          "title": "Skills Manager",
          "icon": "$(package)"
        }
      ]
    },
    "views": {
      "skillsManagerContainer": [
        {
          "id": "skillsManagerView",
          "name": "Skills",
          "type": "webview"
        }
      ]
    }
  }
}
```

使用 VSCode 内置图标 `$(package)` 而不是自定义图标。

### 调试步骤

#### 步骤 1：检查日志
打开扩展开发主机窗口后：
1. 按 `Ctrl+Shift+I` 打开开发者工具
2. 查看 Console 标签页
3. 应该能看到 `[Skills Manager] Extension is now active!`

#### 步骤 2：检查扩展列表
1. 在扩展开发主机窗口中
2. 点击左侧扩展图标（四个方块）
3. 搜索 "Skills Manager"
4. 确认已启用

#### 步骤 3：手动触发视图
如果图标不显示，可以手动创建一个命令来显示：
```javascript
vscode.commands.registerCommand('skillsManager.show', () => {
  vscode.window.showInformationMessage('Skills Manager is active!');
});
```

然后在命令面板中运行此命令。

### 最可能的问题

根据截图，最可能的问题是：
1. **图标文件缺失** - SVG 文件不存在或路径错误
2. **扩展未激活** - activationEvents 配置问题
3. **需要重新加载** - 扩展代码修改后需要重启

### 立即尝试

```bash
# 1. 完全停止调试
# 在原 VSCode 窗口中按 Shift+F5

# 2. 检查图标文件
ls resources/icon.svg

# 3. 重新启动调试
按 F5

# 4. 在新窗口中
按 Ctrl+R 重新加载
```

### 如果仍然不显示

请检查：
1. 输出面板的日志
2. 开发者工具的控制台
3. 扩展列表中是否有 Skills Manager

然后告诉我具体的错误信息。
