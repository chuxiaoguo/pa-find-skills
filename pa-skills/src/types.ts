/**
 * Pingancoder Skills 类型定义
 * 基于 skills-main 改造的企业内网版本
 */

/**
 * 支持的代理类型（精简到4个）
 */
export type AgentType = 'gemini' | 'opencode' | 'openclaw' | 'pingancoder';

/**
 * 技能来源类型（精简到3个）
 */
export type SourceType = 'local' | 'local-zip' | 'pingancoder-api';

/**
 * 技能信息接口
 */
export interface Skill {
  name: string;
  description: string;
  path: string;
  /** Raw SKILL.md content for hashing */
  rawContent?: string;
  /** Name of the plugin this skill belongs to (if any) */
  pluginName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 代理配置接口
 */
export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  /** Global skills directory. Set to undefined if the agent doesn't support global installation. */
  globalSkillsDir: string | undefined;
  detectInstalled: () => Promise<boolean>;
  /** Whether to show this agent in the universal agents list. Defaults to true. */
  showInUniversalList?: boolean;
}

/**
 * 解析后的技能源
 */
export interface ParsedSource {
  type: SourceType;
  url: string;
  subpath?: string;
  localPath?: string;
  /** Skill identifier for API sources */
  identifier?: string;
  /** Skill name extracted from source */
  skillFilter?: string;
}

/**
 * 远程技能（从提供者获取）
 */
export interface RemoteSkill {
  /** Display name of the skill (from frontmatter) */
  name: string;
  /** Description of the skill (from frontmatter) */
  description: string;
  /** Full markdown content including frontmatter */
  content: string;
  /** The identifier used for installation directory name */
  installName: string;
  /** The original source URL */
  sourceUrl: string;
  /** The provider that fetched this skill */
  providerId: string;
  /** Source identifier for telemetry (e.g., "pingancoder.com") */
  sourceIdentifier: string;
  /** Any additional metadata from frontmatter */
  metadata?: Record<string, unknown>;
}

/**
 * Pingancoder 技能信息（从内网API获取）
 */
export interface PingancoderSkill {
  id: string;
  name: string;
  description: string;
  downloadUrl: string;
  version: string;
  category?: string;
  author?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 真实 API 的技能列表响应
 */
export interface MarketSkillListResponse {
  code: number;
  message: string;
  success: boolean;
  timestamp?: number;
  data: MarketSkill[];
}

/**
 * 真实 API 的技能列表项
 */
export interface MarketSkill {
  id: number;
  title: string;
  icon: string;
  logo?: string;
  description?: string;
  category?: string;
  version?: string;
  author?: string;
  authorId?: number;
  downloads?: number;
  rating?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isPublished?: boolean;
  isRecommended?: boolean;
  isFree?: boolean;
  price?: number;
  originalPrice?: number;
  fileSize?: string;
  fileType?: string;
  downloadUrl?: string;
  previewImages?: string[];
  screenshots?: string[];
  videoUrl?: string;
  documentationUrl?: string;
  sourceCodeUrl?: string;
  license?: string;
  dependencies?: string[];
  compatibility?: string[];
  platform?: string[];
  language?: string;
  framework?: string;
}

/**
 * 真实 API 的技能详情响应
 */
export interface MarketSkillDetailResponse {
  code: number;
  message: string;
  success: boolean;
  timestamp?: number;
  data: MarketSkillDetail;
  file?: MarketSkillFile;
}

/**
 * 真实 API 的技能详情
 */
export interface MarketSkillDetail {
  id: number;
  title?: string;
  description?: string;
  version?: string;
  author?: string;
  categoryId?: number;
  categoryName?: string;
  tags?: string[];
  downloadCount?: number;
  rating?: number;
  ratingCount?: number;
  isPublished?: boolean;
  isRecommended?: boolean;
  isFree?: boolean;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

/**
 * 真实 API 的文件信息
 */
export interface MarketSkillFile {
  downloadUrl: string;
  appFileName: string;
  md5?: string;
  fileSize?: number;
  fileType?: string;
  uploadTime?: string;
}

/**
 * 认证会话信息
 */
export interface AuthSession {
  token: string;
  expiresAt: number;
  username: string;
}

/**
 * Pingancoder 配置
 */
export interface PingancoderConfig {
  baseUrl: string;
  downloadBaseUrl?: string;
  username?: string;
  password?: string;
  tokenPath: string;
  timeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 提供者接口
 */
export interface Provider {
  id: string;
  displayName: string;
  match: (source: string) => boolean;
  fetchSkill: (source: ParsedSource) => Promise<RemoteSkill | null>;
  /** 搜索技能（可选） */
  searchSkills?: (query: string, options?: SearchOptions) => Promise<PingancoderSkill[]>;
  /** 获取更新信息（可选） */
  getUpdateInfo?: (skillId: string, currentVersion: string) => Promise<{ hasUpdate: boolean; latestVersion: string } | null>;
}

/**
 * 安装选项
 */
export interface InstallOptions {
  /** Target agents (default: all detected agents) */
  agents?: AgentType[];
  /** Installation mode */
  mode?: 'symlink' | 'copy';
  /** Global installation */
  global?: boolean;
  /** Force reinstall */
  force?: boolean;
  /** Working directory */
  cwd?: string;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  query: string;
  category?: string;
  limit?: number;
}

/**
 * 更新检查结果
 */
export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion?: string;
  latestVersion?: string;
  skillsWithUpdates: Array<{
    name: string;
    currentVersion: string;
    latestVersion: string;
  }>;
}
