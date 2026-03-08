/**
 * VSCode 插件入口 - Skills Manager
 * 完整功能版本
 */

const vscode = require('vscode');
const SkillsService = require('./services/SkillsService');

function activate(context) {
  console.log('[Skills Manager] Extension is now active!');

  // 创建技能服务
  const skillsService = new SkillsService();

  // 创建 WebviewViewProvider
  const provider = {
    resolveWebviewView(webviewView) {
      console.log('[Skills Manager] Resolving webview view');

      webviewView.title = 'Skills Manager';

      // 配置 webview
      webviewView.webview.options = {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'resources')
        ]
      };

      // 设置 HTML 内容
      webviewView.webview.html = getWebviewContent(webviewView.webview, context.extensionUri);

      // 监听来自 WebView 的消息
      webviewView.webview.onDidReceiveMessage(async (message) => {
        console.log('[Extension] Received message:', message);

        switch (message.type) {
          case 'skills:list': {
            await loadSkills(webviewView, skillsService);
            break;
          }

          case 'skill:details': {
            const skill = message.skill;
            if (skill && skill.path) {
              const files = await skillsService.getSkillFiles(skill.path);
              webviewView.webview.postMessage({
                type: 'skill:details',
                data: { ...skill, files }
              });
            }
            break;
          }

          case 'skill:install': {
            const result = await vscode.window.showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: true,
              canSelectMany: false,
              title: '选择技能包（Zip 或目录）',
              filters: {
                'Zip Files': ['zip']
              }
            });

            if (result && result[0]) {
              const source = result[0].fsPath;
              const sourceType = source.endsWith('.zip') ? 'local-zip' : 'local';

              await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '安装技能中...',
                cancellable: false
              }, async () => {
                const installResult = await skillsService.installSkill(source, sourceType);

                if (installResult.success) {
                  vscode.window.showInformationMessage('✅ 技能安装成功！');
                  await loadSkills(webviewView, skillsService);
                } else {
                  vscode.window.showErrorMessage(`❌ 安装失败: ${installResult.error}`);
                }
              });
            }
            break;
          }

          case 'skill:uninstall': {
            const skillName = message.skillName;
            const confirmed = await vscode.window.showWarningMessage(
              `⚠️ 确定要卸载 "${skillName}" 吗？`,
              { modal: true },
              '卸载',
              '取消'
            );

            if (confirmed === '卸载') {
              const result = await skillsService.uninstallSkill(skillName);

              if (result.success) {
                vscode.window.showInformationMessage('✅ 技能卸载成功！');
                await loadSkills(webviewView, skillsService);
              } else {
                vscode.window.showErrorMessage(`❌ 卸载失败: ${result.error}`);
              }
            }
            break;
          }

          case 'file:open': {
            const filePath = message.filePath;
            const uri = vscode.Uri.file(filePath);
            await vscode.commands.executeCommand('vscode.open', uri);
            break;
          }

          case 'skill:search': {
            const query = await vscode.window.showInputBox({
              prompt: '🔍 搜索市场技能',
              placeHolder: '输入关键词...'
            });

            if (query) {
              const result = await skillsService.searchMarket(query);
              webviewView.webview.postMessage({
                type: 'market:results',
                data: result.success ? result.data : []
              });
            }
            break;
          }
        }
      }, undefined, context.subscriptions);

      // 初始加载技能
      loadSkills(webviewView, skillsService);
    }
  };

  // 注册 WebviewViewProvider
  const registration = vscode.window.registerWebviewViewProvider(
    'skillsManagerView',
    provider
  );

  // 注册刷新命令
  const refreshCmd = vscode.commands.registerCommand('skillsManager.refresh', async () => {
    vscode.window.showInformationMessage('🔄 刷新技能列表...');
    // 触发刷新
  });

  // 注册显示面板命令
  const showCmd = vscode.commands.registerCommand('skillsManager.show', () => {
    vscode.commands.executeCommand('workbench.view.explorer');
    vscode.window.showInformationMessage('📍 请在左侧资源管理器底部点击 "🎯 Skills Manager"');
  });

  // 添加到订阅列表
  context.subscriptions.push(registration, refreshCmd, showCmd);

  console.log('[Skills Manager] Ready!');

  // 欢迎消息
  setTimeout(() => {
    vscode.window.showInformationMessage(
      '🎯 Skills Manager 已加载！\n\n访问方式：\n• 左侧资源管理器底部：🎯 Skills Manager\n• 快捷键：Ctrl+Shift+S\n• 命令面板：Ctrl+Shift+P → "打开管理面板"',
      '知道了'
    );
  }, 1000);
}

/**
 * 加载技能列表
 */
async function loadSkills(webviewView, skillsService) {
  try {
    const result = await skillsService.listSkills();

    if (result.success) {
      webviewView.webview.postMessage({
        type: 'skills:update',
        data: result.data
      });
    } else {
      webviewView.webview.postMessage({
        type: 'skills:error',
        error: result.error || '获取技能列表失败'
      });
    }
  } catch (error) {
    console.error('[Extension] Error loading skills:', error);
    webviewView.webview.postMessage({
      type: 'skills:error',
      error: error.message
    });
  }
}

/**
 * 生成 WebView HTML 内容
 */
function getWebviewContent(webview, extensionUri) {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'nonce-${nonce}';
    style-src 'unsafe-inline' ${webview.cspSource};
  ">
  <title>Skills Manager</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div id="app">
    <div class="header">
      <h1>🎯 Skills Manager</h1>
      <div class="actions">
        <button class="btn btn-primary" id="installBtn">+ 安装技能</button>
        <button class="btn btn-secondary" id="refreshBtn">🔄 刷新</button>
      </div>
    </div>

    <div id="content">
      <div class="loading">⏳ 加载中...</div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // 页面加载时请求技能列表
    window.addEventListener('load', () => {
      sendMessage({ type: 'skills:list' });

      // 绑定按钮事件
      document.getElementById('refreshBtn').addEventListener('click', refreshList);
      document.getElementById('installBtn').addEventListener('click', installSkill);
    });

    // 发送消息到扩展
    function sendMessage(message) {
      vscode.postMessage(message);
    }

    // 刷新列表
    function refreshList() {
      document.getElementById('content').innerHTML = '<div class="loading">🔄 刷新中...</div>';
      sendMessage({ type: 'skills:list' });
    }

    // 安装技能
    function installSkill() {
      sendMessage({ type: 'skill:install' });
    }

    // 显示技能详情
    function showDetails(skillId) {
      const skill = currentSkills.find(s => s.id === skillId);
      if (skill) {
        sendMessage({ type: 'skill:details', skill });
      }
    }

    // 打开文件
    function openFile(filePath) {
      sendMessage({ type: 'file:open', filePath });
    }

    // 卸载技能
    function uninstallSkill(skillName) {
      sendMessage({ type: 'skill:uninstall', skillName });
    }

    let currentSkills = [];

    // 监听来自扩展的消息
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'skills:update':
          currentSkills = message.data;
          renderSkillsList(message.data);
          break;

        case 'skills:error':
          renderError(message.error);
          break;

        case 'skill:details':
          renderSkillDetails(message.data);
          break;
      }
    });

    // 渲染技能列表
    function renderSkillsList(skills) {
      const content = document.getElementById('content');

      if (!skills || skills.length === 0) {
        content.innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div class="empty-title">暂无技能</div>
            <div class="empty-description">
              点击"安装技能"开始添加<br>
              或者检查 pa-skills CLI 是否正确安装
            </div>
            <div class="help-text">
              <strong>调试提示：</strong><br>
              1. 打开开发者工具查看错误：Ctrl+Shift+I<br>
              2. 确保工作区已打开（不是 NO FOLDER OPENED）<br>
              3. 运行命令测试：pa-skills list
            </div>
            <button class="btn btn-primary" onclick="refreshList()">🔄 重试</button>
          </div>
        \`;
        return;
      }

      let html = '<div class="skills-grid">';
      skills.forEach(skill => {
        html += \`
          <div class="skill-card" data-skill-id="\${skill.id}">
            <div class="skill-header">
              <div class="skill-name">\${skill.name}</div>
              \${skill.version ? \`<div class="skill-version">v\${skill.version}</div>\` : ''}
            </div>
            \${skill.description ? \`<div class="skill-description">\${skill.description}</div>\` : ''}
            <div class="skill-meta">
              \${skill.author ? \`<span class="skill-author">👤 \${skill.author}</span>\` : ''}
              \${skill.isSymlink ? '<span class="skill-symlink">🔗 软链接</span>' : '<span class="skill-type">📦 本地</span>'}
            </div>
          </div>
        \`;
      });

      content.innerHTML = html;

      // 绑定卡片点击事件
      content.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('click', () => {
          const skillId = card.getAttribute('data-skill-id');
          showDetails(skillId);
        });
      });
      html += '</div>';

      content.innerHTML = html;
    }

    // 渲染技能详情
    function renderSkillDetails(skill) {
      const content = document.getElementById('content');

      let html = \`
        <div class="skill-details">
          <button class="btn-back" id="backBtn">← 返回列表</button>
          <div class="details-header">
            <h2>\${skill.name}</h2>
            \${skill.version ? \`<span class="version-badge">v\${skill.version}</span>\` : ''}
          </div>
          \${skill.description ? \`<p class="details-description">\${skill.description}</p>\` : ''}
          <div class="details-meta">
            \${skill.author ? \`<div><strong>作者:</strong> \${skill.author}</div>\` : ''}
            \${skill.path ? \`<div><strong>路径:</strong> \${skill.path}</div>\` : ''}
            \${skill.sourceType ? \`<div><strong>来源:</strong> \${skill.sourceType}</div>\` : ''}
          </div>
          <div class="details-actions">
            <button class="btn btn-danger" data-skill-name="\${skill.name}">🗑️ 卸载</button>
          </div>
          \${skill.files ? renderFileTree(skill.files) : ''}
        </div>
      \`;

      content.innerHTML = html;

      // 绑定返回按钮
      document.getElementById('backBtn').addEventListener('click', refreshList);

      // 绑定卸载按钮
      content.querySelector('.btn-danger').addEventListener('click', () => {
        uninstallSkill(skill.name);
      });
    }

    // 渲染文件树
    function renderFileTree(files, depth = 0) {
      if (!files || files.length === 0) return '';

      let html = '<div class="file-tree">';
      files.forEach(file => {
        const indent = depth * 16;
        if (file.type === 'directory') {
          html += \`
            <div class="file-item directory" style="padding-left: \${indent}px">
              <span class="file-icon">📁</span>
              <span class="file-name">\${file.name}</span>
            </div>
            \${renderFileTree(file.children, depth + 1)}
          \`;
        } else {
          html += \`
            <div class="file-item file" data-file-path="\${file.path}" style="padding-left: \${indent}px">
              <span class="file-icon">📄</span>
              <span class="file-name">\${file.name}</span>
            </div>
          \`;
        }
      });
      html += '</div>';

      // 延迟绑定文件点击事件
      setTimeout(() => {
        content.querySelectorAll('.file-item.file').forEach(item => {
          item.addEventListener('click', () => {
            const filePath = item.getAttribute('data-file-path');
            openFile(filePath);
          });
        });
      }, 0);

      return html;
    }

    // 渲染错误
    function renderError(error) {
      const content = document.getElementById('content');

      let errorMessage = error;
      let details = '';

      if (typeof error === 'object') {
        errorMessage = error.error || '未知错误';
        if (error.details) {
          details = \`
            <div class="error-details">
              <strong>详细信息：</strong><br>
              CLI 路径: \${error.details.cliPath || 'N/A'}<br>
              工作区: \${error.details.workspace || 'N/A'}<br>
              错误代码: \${error.details.code || 'N/A'}
            </div>
          \`;
        }
      }

      content.innerHTML = \`
        <div class="error-state">
          <div class="error-icon">❌</div>
          <div class="error-title">加载失败</div>
          <div class="error-message">\${errorMessage}</div>
          \${details}
          <div class="help-section">
            <strong>可能的原因：</strong>
            <ul>
              <li>pa-skills CLI 未安装或不在 PATH 中</li>
              <li>工作区未打开（显示 NO FOLDER OPENED）</li>
              <li>pa-skills 命令执行失败</li>
            </ul>
            <strong>解决方案：</strong>
            <ul>
              <li>按 Ctrl+Shift+I 打开开发者工具查看详细错误</li>
              <li>在终端运行：pa-skills list 测试 CLI</li>
              <li>确保打开了一个工作区文件夹</li>
            </ul>
          </div>
          <button class="btn btn-primary" id="retryBtn">🔄 重试</button>
        </div>
      \`;

      content.innerHTML = html;

      // 绑定重试按钮
      document.getElementById('retryBtn').addEventListener('click', refreshList);
    }
  </script>
</body>
</html>`;
}

/**
 * 生成随机 nonce
 */
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * 获取样式
 */
function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      font-size: 13px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }

    .header {
      padding: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      font-size: 18px;
      font-weight: 600;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .btn-primary {
      background: var(--vscode-button-background, #007acc);
      color: var(--vscode-button-foreground, #ffffff);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #ffffff);
    }

    .btn-danger {
      background: #d32f2f;
      color: #ffffff;
    }

    .btn-back {
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-panel-border);
      margin-bottom: 16px;
    }

    #content {
      padding: 16px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }

    .skill-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .skill-card:hover {
      border-color: var(--vscode-button-background, #007acc);
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }

    .skill-name {
      font-weight: 600;
      font-size: 14px;
    }

    .skill-version {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-editor-selectionBackground);
      padding: 2px 6px;
      border-radius: 3px;
    }

    .skill-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .skill-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .skill-author,
    .skill-type,
    .skill-symlink {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .skill-symlink {
      color: var(--vscode-textLink-foreground, #3794ff);
    }

    .skill-details {
      max-width: 800px;
    }

    .details-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .details-header h2 {
      font-size: 20px;
      font-weight: 600;
    }

    .version-badge {
      background: var(--vscode-editor-selectionBackground);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .details-description {
      color: var(--vscode-descriptionForeground);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .details-meta {
      background: var(--vscode-textBlockQuote-background);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .details-meta > div {
      margin-bottom: 4px;
    }

    .details-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .file-tree {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      overflow: hidden;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .file-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .file-item.file {
      cursor: pointer;
    }

    .file-icon {
      font-size: 14px;
    }

    .file-name {
      font-size: 13px;
    }

    .empty-state,
    .error-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon,
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-title,
    .error-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .empty-description,
    .error-message {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 16px;
    }

    .error-details {
      background: var(--vscode-editor-background);
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
      font-size: 12px;
      font-family: monospace;
    }

    .help-section {
      text-align: left;
      background: var(--vscode-textBlockQuote-background);
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
      font-size: 12px;
    }

    .help-section ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .help-section li {
      margin: 4px 0;
    }

    .help-text {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      margin-top: 16px;
      line-height: 1.6;
    }
  `;
}

function deactivate() {
  console.log('[Skills Manager] Deactivated');
}

module.exports = { activate, deactivate };
