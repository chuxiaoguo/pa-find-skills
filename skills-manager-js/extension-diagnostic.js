/**
 * 诊断工具 - 帮助调试 VSCode 扩展
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function activate(context) {
  console.log('=== [DIAGNOSTIC] Starting... ===');

  // 创建诊断 WebView
  const diagnosticView = vscode.window.createWebviewView(
    'skillsManagerView',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  diagnosticView.title = 'Skills Manager';

  // 收集诊断信息
  const diagnosticInfo = {
    extensionPath: context.extensionUri.fsPath,
    workspacePath: vscode.workspace.rootPath || 'None',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    vscodeVersion: vscode.version,
    packageJson: readPackageJson(context.extensionUri.fsPath),
    hasExtensionJS: checkFile(context.extensionUri.fsPath, 'extension.js'),
    hasServices: checkDirectory(context.extensionUri.fsPath, 'services')
  };

  console.log('[DIAGNOSTIC] Info:', diagnosticInfo);

  diagnosticView.webview.html = getDiagnosticHtml(diagnosticInfo);

  // 测试命令
  const testCmd = vscode.commands.registerCommand('skillsManager.diagnostic', () => {
    const info = `
诊断信息：
• 扩展路径: ${diagnosticInfo.extensionPath}
• 工作空间: ${diagnosticInfo.workspacePath}
• 平台: ${diagnosticInfo.platform}
• VSCode 版本: ${diagnosticInfo.vscodeVersion}
• extension.js 存在: ${diagnosticInfo.hasExtensionJS}
• services 目录存在: ${diagnosticInfo.hasServices}
    `;

    vscode.window.showInformationMessage(info, { modal: true });
  });

  context.subscriptions.push(diagnosticView, testCmd);

  console.log('=== [DIAGNOSTIC] Ready ===');
}

function readPackageJson(extPath) {
  try {
    const content = fs.readFileSync(path.join(extPath, 'package.json'), 'utf8');
    const json = JSON.parse(content);
    return {
      name: json.name,
      version: json.version,
      hasViews: !!json.contributes?.views,
      hasContainers: !!json.contributes?.viewsContainers,
      viewCount: Object.keys(json.contributes?.views || {}).length,
      containerCount: Object.keys(json.contributes?.viewsContainers || {}).length
    };
  } catch (error) {
    return { error: error.message };
  }
}

function checkFile(extPath, fileName) {
  try {
    return fs.existsSync(path.join(extPath, fileName));
  } catch {
    return false;
  }
}

function checkDirectory(extPath, dirName) {
  try {
    const dirPath = path.join(extPath, dirName);
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function getDiagnosticHtml(info) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      padding: 20px;
      color: var(--vscode-foreground, #333);
    }
    h1 { color: var(--vscode-foreground, #333); margin-bottom: 20px; }
    h2 { color: var(--vscode-foreground, #333); margin: 20px 0 10px 0; font-size: 16px; }
    .section { margin-bottom: 20px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
      margin: 10px 0;
    }
    .info-item {
      padding: 10px;
      background: var(--vscode-editor-background, #f5f5f5);
      border-radius: 4px;
    }
    .info-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground, #666);
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 13px;
      color: var(--vscode-foreground, #333);
    }
    .status-ok { color: #4caf50; }
    .status-error { color: #f44336; }
    .button {
      padding: 10px 20px;
      background: var(--vscode-button-background, #007acc);
      color: var(--vscode-button-foreground, #fff);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <h1>🔍 Skills Manager 诊断工具</h1>

  <div class="section">
    <h2>✅ 基础信息</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">VSCode 版本</div>
        <div class="info-value">${info.vscodeVersion}</div>
      </div>
      <div class="info-item">
        <div class="info-label">平台</div>
        <div class="info-value">${info.platform} / ${info.arch}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Node 版本</div>
        <div class="info-value">${info.nodeVersion}</div>
      </div>
      <div class="info-item">
        <div class="info-label">扩展路径</div>
        <div class="info-value">${info.extensionPath}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📦 扩展配置</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">扩展名称</div>
        <div class="info-value">${info.packageJson.name || '未知'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">版本</div>
        <div class="info-value">${info.packageJson.version || '未知'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">视图容器</div>
        <div class="info-value ${info.packageJson.containerCount > 0 ? 'status-ok' : 'status-error'}">
          ${info.packageJson.containerCount || 0} 个
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">视图</div>
        <div class="info-value ${info.packageJson.viewCount > 0 ? 'status-ok' : 'status-error'}">
          ${info.packageJson.viewCount || 0} 个
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📁 文件检查</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">extension.js</div>
        <div class="info-value ${info.hasExtensionJS ? 'status-ok' : 'status-error'}">
          ${info.hasExtensionJS ? '✅ 存在' : '❌ 不存在'}
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">services 目录</div>
        <div class="info-value ${info.hasServices ? 'status-ok' : 'status-error'}">
          ${info.hasServices ? '✅ 存在' : '❌ 不存在'}
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🎯 测试</h2>
    <p style="margin-bottom: 10px;">点击下面的按钮测试扩展功能：</p>
    <button class="button" onclick="runTest()">运行诊断命令</button>
  </div>

  <div class="section">
    <h2>📋 使用说明</h2>
    <p style="line-height: 1.6;">
      <strong>如果你能看到这个页面，说明：</strong><br>
      1. ✅ 扩展已成功加载<br>
      2. ✅ WebView 正常工作<br>
      3. ✅ 侧边栏图标应该已显示
    </p>
    <p style="line-height: 1.6; margin-top: 10px;">
      <strong>如果在左侧看不到图标：</strong><br>
      1. 尝试按 Ctrl+切换侧边栏显示<br>
      2. 查看 Activity Bar（最左侧工具栏）<br>
      3. 向下滚动查找新图标<br>
      4. 或使用命令面板：Ctrl+Shift+P → 输入 "Show Skills"
    </p>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function runTest() {
      vscode.postMessage({ command: 'runDiagnostic' });
    }

    // 页面加载时通知扩展
    window.addEventListener('load', () => {
      vscode.postMessage({ command: 'pageLoaded' });
    });
  </script>
</body>
</html>
  `;
}

function deactivate() {
  console.log('[DIAGNOSTIC] Deactivated');
}

module.exports = { activate, deactivate };
