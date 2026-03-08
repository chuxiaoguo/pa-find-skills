/**
 * VSCode 扩展入口
 */

import * as vscode from 'vscode';
import { SkillsManager } from './services/SkillsManager';
import { getWebviewContent } from './webview/content';

export function activate(context: vscode.ExtensionContext) {
  console.log('[Skills Manager] Extension is now active!');

  // 创建技能管理服务
  const skillsManager = new SkillsManager();

  // 注册侧边栏视图
  const skillsManagerView = vscode.window.createWebviewView(
    'skillsManagerView',
    'Skills Manager',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // 设置 Webview 内容
  skillsManagerView.webview.html = getWebviewContent(
    skillsManagerView.webview,
    context.extensionUri
  );

  // 监听来自 Webview 的消息
  skillsManagerView.webview.onDidReceiveMessage(async (message: any) => {
    console.log('[Extension] Received message from webview:', message);

    switch (message.type) {
      case 'skills:list': {
        const skills = await skillsManager.getSkills(true);
        skillsManagerView.webview.postMessage({
          type: 'skills:update',
          data: skills,
        });
        break;
      }

      case 'skill:details': {
        const skill = await skillsManager.getSkillDetail(message.payload.skillId);
        if (skill) {
          skillsManagerView.webview.postMessage({
            type: 'skill:details',
            data: skill,
          });
        }
        break;
      }

      case 'skill:install': {
        const success = await skillsManager.installSkill(
          message.payload.source,
          message.payload.sourceType
        );

        skillsManagerView.webview.postMessage({
          type: 'skill:install:complete',
          data: { success },
        });
        break;
      }

      case 'skill:uninstall': {
        const success = await skillsManager.uninstallSkill(message.payload.skillId);

        if (success) {
          skillsManagerView.webview.postMessage({
            type: 'skill:uninstall:complete',
            data: { skillId: message.payload.skillId },
          });
        }
        break;
      }

      case 'market:search': {
        const results = await skillsManager.searchMarket(message.payload.query);
        skillsManagerView.webview.postMessage({
          type: 'market:results',
          data: results,
        });
        break;
      }

      case 'file:open': {
        const filePath = message.payload.filePath;
        const uri = vscode.Uri.file(filePath);
        await vscode.commands.executeCommand('vscode.open', uri);
        break;
      }
    }
  });

  // 监听技能更新事件
  skillsManager.on('skillsUpdated', (skills) => {
    skillsManagerView.webview.postMessage({
      type: 'skills:update',
      data: skills,
    });
  });

  skillsManager.on('skillUninstalled', (skillId) => {
    skillsManagerView.webview.postMessage({
      type: 'skill:uninstalled',
      data: { skillId },
    });
  });

  // 注册刷新命令
  const refreshCommand = vscode.commands.registerCommand(
    'skillsManager.refresh',
    () => {
      skillsManager.getSkills(true);
    }
  );

  // 注册安装命令
  const installCommand = vscode.commands.registerCommand(
    'skillsManager.install',
    async () => {
      // 快速安装：选择文件或目录
      const uri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: true,
        canSelectMany: false,
        title: '选择技能包（Zip 或目录）',
      });

      if (uri && uri[0]) {
        await skillsManager.installSkill(uri[0].fsPath, 'local');
      }
    }
  );

  // 注册打开市场命令
  const marketCommand = vscode.commands.registerCommand(
    'skillsManager.openMarket',
    () => {
      // 通知 Webview 切换到市场视图
      skillsManagerView.webview.postMessage({
        type: 'navigate',
        data: { view: 'market' },
      });
    }
  );

  // 添加到订阅列表
  context.subscriptions.push(
    skillsManagerView,
    refreshCommand,
    installCommand,
    marketCommand
  );

  // 初始化时加载技能列表
  skillsManager.getSkills(true);
}

export function deactivate() {
  console.log('[Skills Manager] Extension is now deactivated!');
}
