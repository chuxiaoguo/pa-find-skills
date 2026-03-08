/**
 * 技能管理服务
 * 负责技能数据的获取、缓存和更新
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { CLIAdapter } from './CLIAdapter';
import { Skill, FilterOptions } from '../types/index';

export class SkillsManager extends EventEmitter {
  private cliAdapter: CLIAdapter;
  private skillsCache: Map<string, Skill> = new Map();
  private isRefreshing = false;

  constructor() {
    super();
    this.cliAdapter = new CLIAdapter();
  }

  /**
   * 获取所有技能
   */
  async getSkills(refresh = false): Promise<Skill[]> {
    if (refresh || this.skillsCache.size === 0) {
      await this.refreshSkills();
    }

    return Array.from(this.skillsCache.values());
  }

  /**
   * 刷新技能列表
   */
  async refreshSkills(): Promise<void> {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      const response = await this.cliAdapter.listSkills();

      if (response.success && response.data) {
        // 处理技能数据
        const skills = this.normalizeSkills(response.data);

        // 更新缓存
        this.skillsCache.clear();
        for (const skill of skills) {
          this.skillsCache.set(skill.id, skill);
        }

        this.emit('skillsUpdated', skills);
      } else {
        vscode.window.showErrorMessage(
          `获取技能列表失败: ${response.error || '未知错误'}`
        );
      }
    } catch (error) {
      console.error('[SkillsManager] Error refreshing skills:', error);
      vscode.window.showErrorMessage(
        `获取技能列表失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 规范化技能数据
   */
  private normalizeSkills(rawSkills: any[]): Skill[] {
    return rawSkills.map((skill, index) => {
      // 这里需要根据实际 pa-skills list --json 的输出格式进行调整
      return {
        id: skill.id || skill.name || `skill-${index}`,
        name: skill.name || 'Unknown',
        description: skill.description || '',
        version: skill.version,
        author: skill.author,
        sourceType: skill.sourceType || 'local',
        installType: skill.installType || 'local',
        isSymlink: skill.isSymlink || false,
        installedAt: skill.installedAt || new Date().toISOString(),
        updatedAt: skill.updatedAt || new Date().toISOString(),
        path: skill.path || '',
        files: [], // 稍后加载
        metadata: skill.metadata,
      };
    });
  }

  /**
   * 筛选技能
   */
  filterSkills(skills: Skill[], options: FilterOptions): Skill[] {
    let filtered = skills;

    // 搜索过滤
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description.toLowerCase().includes(searchLower)
      );
    }

    // 安装类型过滤
    if (options.installType && options.installType !== 'all') {
      filtered = filtered.filter((skill) => skill.installType === options.installType);
    }

    // 来源类型过滤
    if (options.sourceType && options.sourceType !== 'all') {
      filtered = filtered.filter((skill) => skill.sourceType === options.sourceType);
    }

    return filtered;
  }

  /**
   * 获取单个技能详情
   */
  async getSkillDetail(skillId: string): Promise<Skill | null> {
    const skill = this.skillsCache.get(skillId);

    if (!skill) {
      return null;
    }

    // 如果还没有加载文件列表，则加载
    if (!skill.files || skill.files.length === 0) {
      skill.files = await this.cliAdapter.getSkillFiles(skill.path);
    }

    return skill;
  }

  /**
   * 安装技能
   */
  async installSkill(source: string, sourceType: string): Promise<boolean> {
    try {
      const response = await this.cliAdapter.installSkill({
        source,
        sourceType: sourceType as any,
      });

      if (response.success) {
        await this.refreshSkills();
        return true;
      } else {
        vscode.window.showErrorMessage(`安装失败: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error('[SkillsManager] Error installing skill:', error);
      vscode.window.showErrorMessage(
        `安装失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return false;
    }
  }

  /**
   * 卸载技能
   */
  async uninstallSkill(skillId: string): Promise<boolean> {
    const skill = this.skillsCache.get(skillId);

    if (!skill) {
      vscode.window.showErrorMessage('技能不存在');
      return false;
    }

    try {
      const response = await this.cliAdapter.uninstallSkill(skill.name);

      if (response.success) {
        this.skillsCache.delete(skillId);
        this.emit('skillUninstalled', skillId);
        return true;
      } else {
        vscode.window.showErrorMessage(`卸载失败: ${response.error}`);
        return false;
      }
    } catch (error) {
      console.error('[SkillsManager] Error uninstalling skill:', error);
      vscode.window.showErrorMessage(
        `卸载失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
      return false;
    }
  }

  /**
   * 搜索市场技能
   */
  async searchMarket(query: string): Promise<any[]> {
    try {
      const response = await this.cliAdapter.searchMarket(query);

      if (response.success && response.data) {
        return response.data;
      } else {
        vscode.window.showErrorMessage(`搜索失败: ${response.error}`);
        return [];
      }
    } catch (error) {
      console.error('[SkillsManager] Error searching market:', error);
      return [];
    }
  }
}
