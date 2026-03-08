const vscode = require('vscode');

function activate(context) {
  console.log('=== Skills Manager ACTIVATED ===');

  // 创建 WebView
  const view = vscode.window.createWebviewView(
    'skillsManagerView',
    vscode.ViewColumn.One,
    {
      enableScripts: true
    }
  );

  view.title = 'Skills Manager';

  view.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 { color: #007acc; }
      </style>
    </head>
    <body>
      <h1>🎯 Skills Manager</h1>
      <p>插件已加载！如果你看到这个，说明一切正常。</p>
    </body>
    </html>
  `;

  // 注册命令
  const cmd = vscode.commands.registerCommand('skillsManager.hello', () => {
    vscode.window.showInformationMessage('Hello from Skills Manager!');
  });

  context.subscriptions.push(view, cmd);

  console.log('=== Skills Manager READY ===');
}

function deactivate() {}

module.exports = { activate, deactivate };
