/**
 * VSCode 插件入口 - Skills Manager
 */

const vscode = require('vscode');
const SkillsService = require('./services/SkillsService');

function activate(context) {
  console.log('[Skills Manager] Extension is now active!');

  // 创建技能服务
  const skillsService = new SkillsService();

  // 创建 WebView - 修正参数
  const view = vscode.window.createWebviewView(
    'skillsManagerView',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'resources')
      ]
    }
  );

  // 设置 WebView 内容
  view.webview.html = getWebviewContent(view.webview, context.extensionUri);

  // 监听来自 WebView 的消息
  view.webview.onDidReceiveMessage(async (message) => {
    console.log('[Extension] Received message:', message);

    switch (message.type) {
      case 'skills:list': {
        await loadSkills(view, skillsService);
        break;
      }

      case 'skill:details': {
        const skill = message.skill;
        if (skill && skill.path) {
          const files = await skillsService.getSkillFiles(skill.path);
          view.webview.postMessage({
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
              vscode.window.showInformationMessage('技能安装成功！');
              await loadSkills(view, skillsService);
            } else {
              vscode.window.showErrorMessage(`安装失败: ${installResult.error}`);
            }
          });
        }
        break;
      }

      case 'skill:uninstall': {
        const skillName = message.skillName;
        const confirmed = await vscode.window.showWarningMessage(
          `确定要卸载 "${skillName}" 吗？`,
          { modal: true },
          '卸载',
          '取消'
        );

        if (confirmed === '卸载') {
          const result = await skillsService.uninstallSkill(skillName);

          if (result.success) {
            vscode.window.showInformationMessage('技能卸载成功！');
            await loadSkills(view, skillsService);
          } else {
            vscode.window.showErrorMessage(`卸载失败: ${result.error}`);
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
          prompt: '搜索市场技能',
          placeHolder: '输入关键词...'
        });

        if (query) {
          const result = await skillsService.searchMarket(query);
          view.webview.postMessage({
            type: 'market:results',
            data: result.success ? result.data : []
          });
        }
        break;
      }
    }
  });

  // 注册刷新命令
  const refreshCmd = vscode.commands.registerCommand('skillsManager.refresh', async () => {
    await loadSkills(view, skillsService);
  });

  // 注册安装命令
  const installCmd = vscode.commands.registerCommand('skillsManager.install', async () => {
    view.webview.postMessage({ type: 'navigate', view: 'install' });
  });

  // 添加到订阅列表
  context.subscriptions.push(view, refreshCmd, installCmd);

  // 初始加载技能
  loadSkills(view, skillsService);
}

/**
 * 加载技能列表
 */
async function loadSkills(view, skillsService) {
  try {
    const result = await skillsService.listSkills();

    if (result.success) {
      view.webview.postMessage({
        type: 'skills:update',
        data: result.data
      });
    } else {
      view.webview.postMessage({
        type: 'skills:error',
        error: result.error || '获取技能列表失败'
      });
    }
  } catch (error) {
    console.error('[Extension] Error loading skills:', error);
    view.webview.postMessage({
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
      <div class="header-actions">
        <button class="btn btn-secondary" id="searchBtn">🔍 搜索</button>
        <button class="btn btn-primary" id="installBtn">➕ 安装技能</button>
        <button class="btn btn-secondary" id="refreshBtn">🔄 刷新</button>
      </div>
    </div>

    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="搜索技能..." />
      <select id="filterType">
        <option value="all">全部</option>
        <option value="global">全局</option>
        <option value="local">本地</option>
      </select>
    </div>

    <div class="stats" id="stats"></div>

    <div id="content">
      <div class="loading">加载中...</div>
    </div>
  </div>

  <script nonce="${nonce}">
    ${getScript()}
  </script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 0;
      overflow-x: hidden;
    }

    #app {
      padding: 16px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .header h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    #searchInput {
      flex: 1;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 13px;
    }

    #filterType {
      padding: 8px 12px;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }

    .stats {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    .skill-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skill-card {
      padding: 16px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .skill-card:hover {
      border-color: var(--vscode-focusBorder);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .skill-name {
      font-weight: 600;
      font-size: 15px;
      color: var(--vscode-foreground);
      flex: 1;
    }

    .skill-badges {
      display: flex;
      gap: 4px;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .badge-global {
      background: var(--vscode-textBlockQuote-background);
      color: var(--vscode-textBlockQuote-foreground);
    }

    .badge-local {
      background: var(--vscode-textCodeBlock-background);
      color: var(--vscode-textCodeBlock-foreground);
    }

    .badge-symlink {
      background: var(--vscode-editorInfo-background);
      color: var(--vscode-editorInfo-foreground);
    }

    .skill-description {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .skill-meta {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--vscode-panel-border);
    }

    .skill-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }

    .error {
      text-align: center;
      padding: 40px;
      color: var(--vscode-errorForeground);
    }

    /* 详情页样式 */
    .detail-view {
      padding: 16px 0;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .back-btn {
      padding: 6px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section h2 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
    }

    .detail-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: var(--vscode-editor-background);
      border-radius: 4px;
    }

    .meta-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }

    .meta-value {
      font-size: 13px;
      color: var(--vscode-foreground);
    }

    .file-tree {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 8px;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.1s;
    }

    .file-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .file-icon {
      flex-shrink: 0;
    }

    .file-name {
      flex: 1;
      font-size: 13px;
    }

    .btn-danger {
      background: var(--vscode-errorBackground);
      color: var(--vscode-errorForeground);
    }

    .btn-danger:hover {
      opacity: 0.9;
    }
  `;
}

function getScript() {
  return `
    const vscode = acquireVsCodeApi();
    let allSkills = [];
    let currentView = 'list';

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      // 请求技能列表
      vscode.postMessage({ type: 'skills:list' });

      // 绑定事件
      document.getElementById('refreshBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'skills:list' });
      });

      document.getElementById('installBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'skill:install' });
      });

      document.getElementById('searchBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'skill:search' });
      });

      document.getElementById('searchInput').addEventListener('input', (e) => {
        filterSkills(e.target.value);
      });

      document.getElementById('filterType').addEventListener('change', () => {
        filterSkills(document.getElementById('searchInput').value);
      });
    });

    // 监听来自扩展的消息
    window.addEventListener('message', (event) => {
      const message = event.data;

      switch (message.type) {
        case 'skills:update':
          allSkills = message.data || [];
          renderSkills(allSkills);
          updateStats();
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
    function renderSkills(skills) {
      const contentDiv = document.getElementById('content');

      if (!skills || skills.length === 0) {
        contentDiv.innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div style="font-size: 16px; margin-bottom: 8px;">暂无技能</div>
            <div style="font-size: 13px; opacity: 0.8;">点击"安装技能"添加新技能</div>
          </div>
        \`;
        return;
      }

      contentDiv.innerHTML = '<div class="skill-list">' +
        skills.map(skill => createSkillCard(skill)).join('') +
      '</div>';

      // 绑定点击事件
      document.querySelectorAll('.skill-card').forEach(card => {
        card.addEventListener('click', () => {
          const skillId = card.getAttribute('data-skill-id');
          const skill = allSkills.find(s => s.id === skillId);
          if (skill) {
            showSkillDetails(skill);
          }
        });
      });
    }

    // 创建技能卡片 HTML
    function createSkillCard(skill) {
      const installTypeLabel = skill.installType === 'global' ? '全局' : '本地';
      const badgeClass = skill.installType === 'global' ? 'badge-global' : 'badge-local';
      const symlinkBadge = skill.isSymlink ? '<span class="badge badge-symlink">🔗</span>' : '';
      const date = new Date(skill.installedAt).toLocaleDateString('zh-CN');

      return \`
        <div class="skill-card" data-skill-id="\${skill.id}">
          <div class="skill-header">
            <div class="skill-name">\${skill.name}</div>
            <div class="skill-badges">
              <span class="badge \${badgeClass}">\${installTypeLabel}</span>
              \${symlinkBadge}
            </div>
          </div>
          <p class="skill-description">\${skill.description || '暂无描述'}</p>
          <div class="skill-meta">
            \${skill.version ? '<div class="skill-meta-item">📦 ' + skill.version + '</div>' : ''}
            \${skill.author ? '<div class="skill-meta-item">👤 ' + skill.author + '</div>' : ''}
            <div class="skill-meta-item">📅 \${date}</div>
          </div>
        </div>
      \`;
    }

    // 筛选技能
    function filterSkills(searchTerm) {
      const filterType = document.getElementById('filterType').value;

      const filtered = allSkills.filter(skill => {
        const matchesSearch = !searchTerm ||
          skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesType = filterType === 'all' || skill.installType === filterType;

        return matchesSearch && matchesType;
      });

      renderSkills(filtered);
      updateStats(filtered.length);
    }

    // 更新统计信息
    function updateStats(count = allSkills.length) {
      const statsDiv = document.getElementById('stats');
      statsDiv.textContent = \`共 \${count} 个技能\`;
    }

    // 显示技能详情
    function showSkillDetails(skill) {
      vscode.postMessage({
        type: 'skill:details',
        skill: skill
      });
    }

    // 渲染技能详情
    function renderSkillDetails(skill) {
      const contentDiv = document.getElementById('content');

      if (!skill) {
        contentDiv.innerHTML = '<div class="error">未找到技能信息</div>';
        return;
      }

      const date = new Date(skill.installedAt).toLocaleString('zh-CN');
      const filesHtml = renderFileTree(skill.files || []);

      contentDiv.innerHTML = \`
        <div class="detail-view">
          <div class="detail-header">
            <button class="back-btn" id="backBtn">← 返回列表</button>
            <button class="btn btn-danger" id="uninstallBtn">卸载技能</button>
          </div>

          <div class="detail-section">
            <h2>📋 概述</h2>
            <p style="line-height: 1.6;">\${skill.description || '暂无描述'}</p>
          </div>

          <div class="detail-section">
            <h2>ℹ️ 元数据</h2>
            <div class="detail-meta-grid">
              \${skill.version ? '<div class="meta-item"><span class="meta-label">版本</span><span class="meta-value">' + skill.version + '</span></div>' : ''}
              \${skill.author ? '<div class="meta-item"><span class="meta-label">创建者</span><span class="meta-value">' + skill.author + '</span></div>' : ''}
              <div class="meta-item"><span class="meta-label">安装类型</span><span class="meta-value">\${skill.installType === 'global' ? '全局' : '本地'}</span></div>}
              \${skill.isSymlink ? '<div class="meta-item"><span class="meta-label">类型</span><span class="meta-value">🔗 软链接</span></div>' : ''}
              <div class="meta-item"><span class="meta-label">安装时间</span><span class="meta-value">\${date}</span></div>}
              <div class="meta-item"><span class="meta-label">路径</span><span class="meta-value" style="font-family: monospace; font-size: 11px;">\${skill.path || ''}</span></div>}
            </div>
          </div>

          <div class="detail-section">
            <h2>📁 文件结构</h2>
            <div class="file-tree">
              \${filesHtml}
            </div>
          </div>
        </div>
      \`;

      // 绑定返回按钮
      document.getElementById('backBtn').addEventListener('click', () => {
        renderSkills(allSkills);
      });

      // 绑定卸载按钮
      document.getElementById('uninstallBtn').addEventListener('click', () => {
        vscode.postMessage({
          type: 'skill:uninstall',
          skillName: skill.name
        });
      });

      // 绑定文件点击事件
      document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', () => {
          const filePath = item.getAttribute('data-file-path');
          vscode.postMessage({
            type: 'file:open',
            filePath: filePath
          });
        });
      });
    }

    // 渲染文件树
    function renderFileTree(files, level = 0) {
      if (!files || files.length === 0) {
        return '<div style="padding: 12px; color: var(--vscode-descriptionForeground);">暂无文件</div>';
      }

      return files.map(file => {
        const indent = level * 16;
        const icon = getFileIcon(file);
        const clickHandler = file.type === 'file' ? \`data-file-path="\${file.path}"\` : '';

        let html = \`
          <div class="file-item" \${clickHandler} style="padding-left: \${8 + indent}px;">
            <span class="file-icon">\${icon}</span>
            <span class="file-name">\${file.name}</span>
          </div>
        \`;

        if (file.type === 'directory' && file.children) {
          html += renderFileTree(file.children, level + 1);
        }

        return html;
      }).join('');
    }

    // 获取文件图标
    function getFileIcon(file) {
      if (file.type === 'directory') {
        return '📁';
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      const icons = {
        'ts': '📘',
        'tsx': '📘',
        'js': '📒',
        'jsx': '📒',
        'json': '📋',
        'md': '📝',
        'css': '🎨',
        'html': '🌐',
        'py': '🐍'
      };

      return icons[ext] || '📄';
    }

    // 渲染错误
    function renderError(error) {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = \`
        <div class="error">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <div style="font-size: 16px; margin-bottom: 8px;">加载失败</div>
          <div style="font-size: 13px; opacity: 0.8;">\${error}</div>
        </div>
      \`;
    }
  `;
}

function deactivate() {
  console.log('[Skills Manager] Extension is now deactivated!');
}

module.exports = {
  activate,
  deactivate
};
