/**
 * 类型定义
 */

/**
 * 技能来源类型
 */
export type SourceType = 'local' | 'local-zip' | 'pingancoder-api';

/**
 * 技能数据模型
 */
export interface Skill {
  id: string; // 唯一标识
  name: string; // 技能名称
  description: string; // 描述
  version?: string; // 版本
  author?: string; // 创建者
  sourceType: SourceType; // 来源类型
  installType: 'global' | 'local'; // 安装类型
  isSymlink: boolean; // 是否软链接
  installedAt: string; // 安装时间
  updatedAt: string; // 更新时间
  path: string; // 技能路径
  files: SkillFile[]; // 文件列表
  metadata?: Record<string, any>; // 额外元数据
}

/**
 * 技能文件
 */
export interface SkillFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: SkillFile[];
}

/**
 * 筛选选项
 */
export interface FilterOptions {
  search?: string;
  installType?: 'global' | 'local' | 'all';
  sourceType?: SourceType | 'all';
}

/**
 * 安装选项
 */
export interface InstallOptions {
  source: string; // 来源路径或 ID
  sourceType: SourceType;
  agents?: string[]; // 目标代理
}

/**
 * CLI 命令响应
 */
export interface CLIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * WebView 消息类型
 */
export type WebViewMessage =
  | { type: 'skills:list'; payload?: FilterOptions }
  | { type: 'skill:details'; payload: { skillId: string } }
  | { type: 'skill:install'; payload: InstallOptions }
  | { type: 'skill:uninstall'; payload: { skillId: string } }
  | { type: 'skill:search'; payload: { query: string } }
  | { type: 'market:search'; payload: { query: string } }
  | { type: 'file:open'; payload: { filePath: string } };

/**
 * Extension 消息类型
 */
export type ExtensionMessage =
  | { type: 'skills:update'; data: Skill[] }
  | { type: 'skill:details'; data: Skill }
  | { type: 'skill:install:progress'; data: { progress: number; message: string } }
  | { type: 'skill:install:complete'; data: { success: boolean; error?: string } }
  | { type: 'market:results'; data: any[] }
  | { type: 'error'; data: { message: string } };
