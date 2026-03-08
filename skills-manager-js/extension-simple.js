/**
 * Skills Manager - 简化版本
 */

const vscode = require('vscode');

function activate(context) {
  console.log('[Skills Manager] Extension activating...');

  // 使用内置图标
  const view = vscode.window.createWebviewView(
    'skillsManagerView',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  view.title = 'Skills Manager';

  view.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
        }
        h1 { color: var(--vscode-foreground); }
        p { color: var(--vscode-descriptionForeground); }
      </style>
    </head>
    <body>
      <h1>🎯 Skills Manager</h1>
      <p>插件已成功加载！</p>
      <p>如果你能看到这个页面，说明插件工作正常。</p>
    </body>
    </html>
  `;

  // 注册命令
  const refreshCmd = vscode.commands.registerCommand('skillsManager.refresh', () => {
    vscode.window.showInformationMessage('刷新成功！');
  });

  context.subscriptions.push(view, refreshCmd);

  console.log('[Skills Manager] Extension activated!');
}

function deactivate() {
  console.log('[Skills Manager] Extension deactivated');
}

module.exports = {
  activate,
  deactivate
};
