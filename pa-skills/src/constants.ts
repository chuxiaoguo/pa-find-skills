/**
 * Pingancoder Skills 常量定义
 */

import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// 目录常量
// ============================================================================

export const AGENTS_DIR = '.agents';
export const SKILLS_SUBDIR = 'skills';
export const UNIVERSAL_SKILLS_DIR = '.agents/skills';
export const PINGANCODER_DIR = '.pingancoder';

// ============================================================================
// 文件名常量
// ============================================================================

export const AUTH_FILE = 'auth.json';
export const CONFIG_FILE = 'config.json';
export const SKILL_MD_FILE = 'SKILL.md';
export const LOCK_FILE = 'skills-lock.json';

// ============================================================================
// 路径常量
// ============================================================================

const home = homedir();

export const AUTH_DEFAULT_PATH = join(home, PINGANCODER_DIR, AUTH_FILE);
export const CONFIG_DEFAULT_PATH = join(home, PINGANCODER_DIR, CONFIG_FILE);

// ============================================================================
// 认证相关常量
// ============================================================================

/** Token 过期缓冲时间（5分钟） */
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

/** 默认 Token 有效期（24小时） */
export const DEFAULT_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

// ============================================================================
// API 相关常量
// ============================================================================

/** 默认内网 API 基础地址 */
export const DEFAULT_API_BASE_URL =
  process.env.PINGANCODER_API_URL || 'https://market.paic.com.cn';

/** 默认下载超时时间（30秒） */
export const DEFAULT_DOWNLOAD_TIMEOUT = 30000;

/** 默认请求超时时间（10秒） */
export const DEFAULT_REQUEST_TIMEOUT = 10000;

// ============================================================================
// 安装相关常量
// ============================================================================

/** 默认安装模式 */
export const DEFAULT_INSTALL_MODE: 'symlink' | 'copy' = 'symlink';

/** 递归搜索最大深度 */
export const MAX_SEARCH_DEPTH = 5;

/** 跳过的目录名 */
export const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '__pycache__',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj',
];

// ============================================================================
// 技能相关常量
// ============================================================================

/** 技能描述最大长度 */
export const MAX_SKILL_DESCRIPTION_LENGTH = 200;

/** 技能名称最大长度 */
export const MAX_SKILL_NAME_LENGTH = 50;

// ============================================================================
// 日志相关常量
// ============================================================================

/** 默认日志级别 */
export const DEFAULT_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' = 'info';

/** 默认日志文件路径 */
export const DEFAULT_LOG_FILE = join(home, PINGANCODER_DIR, 'skills.log');

// ============================================================================
// 更新相关常量
// ============================================================================

/** 默认更新检查间隔（天） */
export const DEFAULT_UPDATE_INTERVAL = 7;

// ============================================================================
// 错误消息常量
// ============================================================================

export const ERROR_MESSAGES = {
  TOKEN_EXPIRED: '认证已过期，请重新登录',
  TOKEN_INVALID: '认证无效，请重新登录',
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SKILL_NOT_FOUND: '未找到指定的技能',
  INVALID_SOURCE: '无效的技能来源',
  INSTALL_FAILED: '技能安装失败',
  REMOVE_FAILED: '技能移除失败',
  PERMISSION_DENIED: '权限不足',
  PATH_TRAVERSAL: '检测到路径遍历攻击，操作已拒绝',
  INVALID_ZIP: '无效的 Zip 文件',
  NO_SKILL_MD: '技能包中缺少 SKILL.md 文件',
  AGENT_NOT_DETECTED: '未检测到目标代理',
  ALREADY_INSTALLED: '技能已安装',
  NOT_INSTALLED: '技能未安装',
} as const;

// ============================================================================
// 成功消息常量
// ============================================================================

export const SUCCESS_MESSAGES = {
  INSTALL_SUCCESS: '技能安装成功',
  REMOVE_SUCCESS: '技能移除成功',
  UPDATE_SUCCESS: '技能更新成功',
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出登录成功',
  AUTH_REFRESH_SUCCESS: '认证刷新成功',
} as const;

// ============================================================================
// 提供者 ID 常量
// ============================================================================

export const PROVIDER_IDS = {
  PINGANCODER_API: 'pingancoder-api',
  LOCAL_PATH: 'local-path',
  LOCAL_ZIP: 'local-zip',
} as const;
