/**
 * Webview React 应用入口
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { SkillsGallery } from './components/SkillsGallery';
import { SkillDetails } from './components/SkillDetails';
import './styles/globals.css';

// VSCode API
declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

// 应用状态
interface AppState {
  currentView: 'gallery' | 'details' | 'market';
  selectedSkill: any;
  skills: any[];
  filter: {
    search: string;
    installType: 'all' | 'global' | 'local';
    sourceType: 'all' | 'local' | 'local-zip' | 'pingancoder-api';
  };
}

function App() {
  const [state, setState] = React.useState<AppState>({
    currentView: 'gallery',
    selectedSkill: null,
    skills: [],
    filter: {
      search: '',
      installType: 'all',
      sourceType: 'all',
    },
  });

  // 监听来自扩展的消息
  React.useEffect(() => {
    const handleMessage = (event: any) => {
      const message = event.data;

      switch (message.type) {
        case 'skills:update':
          setState((prev) => ({ ...prev, skills: message.data }));
          break;
        case 'skill:details':
          setState((prev) => ({
            ...prev,
            currentView: 'details',
            selectedSkill: message.data,
          }));
          break;
        case 'navigate':
          setState((prev) => ({ ...prev, currentView: message.data.view }));
          break;
      }
    };

    (window as any).addEventListener('message', handleMessage);

    // 请求初始技能列表
    vscode.postMessage({ type: 'skills:list' });

    return () => (window as any).removeEventListener('message', handleMessage);
  }, []);

  // 发送消息到扩展
  const sendMessage = (type: string, payload?: any) => {
    vscode.postMessage({ type, payload });
  };

  // 渲染当前视图
  const renderView = () => {
    switch (state.currentView) {
      case 'gallery':
        return (
          <SkillsGallery
            skills={state.skills}
            filter={state.filter}
            onFilterChange={(filter) => setState((prev) => ({ ...prev, filter }))}
            onSelectSkill={(skillId) => sendMessage('skill:details', { skillId })}
            onInstall={() => sendMessage('skill:install')}
          />
        );
      case 'details':
        return (
          <SkillDetails
            skill={state.selectedSkill}
            onBack={() => setState((prev) => ({ ...prev, currentView: 'gallery' }))}
            onUninstall={(skillId) => sendMessage('skill:uninstall', { skillId })}
            onOpenFile={(filePath) => sendMessage('file:open', { filePath })}
          />
        );
      default:
        return <div>Unknown view</div>;
    }
  };

  return <div className="app">{renderView()}</div>;
}

// 渲染应用
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
