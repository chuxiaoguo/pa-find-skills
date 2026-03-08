/**
 * pa-skills CLI 服务
 * 负责与 pa-skills CLI 进行交互
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SkillsService {
  constructor() {
    // 优先使用项目中的 pa-skills
    this.cliPath = this.findCLI();
  }

  /**
   * 查找 pa-skills CLI 路径
   */
  findCLI() {
    const vscode = require('vscode');
    const workspacePath = vscode.workspace.rootPath;

    if (workspacePath) {
      const projectCLI = require('path').join(workspacePath, 'pa-skills', 'bin', 'cli.mjs');
      const fs = require('fs');
      if (fs.existsSync(projectCLI)) {
        return projectCLI;
      }
    }

    return 'pa-skills';
  }

  /**
   * 执行 CLI 命令
   */
  async execCommand(args, useJson = false) {
    const vscode = require('vscode');
    const workspacePath = vscode.workspace.rootPath;

    const jsonFlag = useJson ? '--json' : '';
    console.log('[SkillsService] Executing:', `"${this.cliPath}" ${args} ${jsonFlag}`);
    console.log('[SkillsService] CLI path:', this.cliPath);
    console.log('[SkillsService] Workspace:', workspacePath);

    try {
      const { stdout, stderr } = await execAsync(`"${this.cliPath}" ${args} ${jsonFlag}`, {
        cwd: workspacePath || undefined,
        shell: true,
        timeout: 30000
      });

      console.log('[SkillsService] STDOUT:', stdout?.substring(0, 300));
      console.log('[SkillsService] STDERR:', stderr?.substring(0, 200));

      if (stdout) {
        // 如果是 JSON 模式，尝试解析
        if (useJson) {
          try {
            return { success: true, data: JSON.parse(stdout) };
          } catch (e) {
            console.log('[SkillsService] JSON parse error:', e.message);
            // JSON 解析失败，尝试解析文本格式
            return { success: true, data: this.parseTextOutput(stdout) };
          }
        } else {
          // 文本模式，直接解析
          return { success: true, data: this.parseTextOutput(stdout) };
        }
      }

      return { success: false, error: stderr || '无输出' };
    } catch (error) {
      console.error('[SkillsService] CLI Error:', error);
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          cliPath: this.cliPath,
          workspace: workspacePath
        }
      };
    }
  }

  /**
   * 解析文本格式的输出
   */
  parseTextOutput(stdout) {
    const skills = [];
    const lines = stdout.split('\n');
    let currentSkill = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      // 移除 ANSI 颜色代码
      const cleanLine = trimmedLine.replace(/\x1b\[[0-9;]*m/g, '');

      // 匹配技能名称：• skill-name
      if (cleanLine.match(/^•\s+[\w-]+$/)) {
        if (currentSkill) {
          skills.push(currentSkill);
        }
        const name = cleanLine.replace(/^•\s+/, '');
        currentSkill = {
          id: name,
          name: name,
          description: '',
          version: '',
          author: '',
          sourceType: 'local',
          installType: 'local',
          isSymlink: false,
          installedAt: new Date().toISOString(),
          path: '',
          metadata: {}
        };
      }
      // 匹配属性：• 属性名: 值
      else if (cleanLine.match(/^•\s+/) && currentSkill) {
        const match = cleanLine.match(/^•\s+(.+?):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          if (key === '来源') {
            currentSkill.sourceType = value;
            currentSkill.metadata.source = value;
          } else if (key === '版本') {
            currentSkill.version = value;
          } else if (key === '安装时间') {
            currentSkill.installedAt = value;
          }
        }
      }
    }

    if (currentSkill) {
      skills.push(currentSkill);
    }

    console.log('[SkillsService] Parsed skills:', skills.length);
    return skills;
  }

  /**
   * 获取已安装的技能列表
   */
  async listSkills() {
    // 尝试使用 JSON 格式，失败则使用文本格式
    let result = await this.execCommand('list', true);

    if (result.success && result.data) {
      // 如果是数组，已经是解析好的数据
      if (Array.isArray(result.data)) {
        return { success: true, data: result.data };
      }
      // 如果是对象，尝试规范化
      return { success: true, data: this.normalizeSkills(result.data) };
    }

    return result;
  }

  /**
   * 规范化技能数据
   */
  normalizeSkills(rawData) {
    if (Array.isArray(rawData)) {
      return rawData.map((skill, index) => ({
        id: skill.id || skill.name || `skill-${index}`,
        name: skill.name || 'Unknown',
        description: skill.description || '',
        version: skill.version,
        author: skill.author,
        sourceType: skill.sourceType || 'local',
        installType: skill.installType || 'local',
        isSymlink: skill.isSymlink || false,
        installedAt: skill.installedAt || new Date().toISOString(),
        path: skill.path || '',
        metadata: skill.metadata || {}
      }));
    }

    return [];
  }

  /**
   * 安装技能
   */
  async installSkill(source, sourceType = 'local') {
    let args = `add "${source}"`;

    if (sourceType === 'pingancoder-api') {
      args += ' --from pingancoder-api';
    }

    const result = await this.execCommand(args);
    return result;
  }

  /**
   * 卸载技能
   */
  async uninstallSkill(skillName) {
    const result = await this.execCommand(`remove "${skillName}"`);
    return result;
  }

  /**
   * 获取技能文件列表
   */
  async getSkillFiles(skillPath) {
    const vscode = require('vscode');
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const uri = vscode.Uri.file(skillPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);

      const files = [];
      for (const [name, type] of entries) {
        const filePath = path.join(skillPath, name);
        if (type === vscode.FileType.File) {
          files.push({
            name,
            path: filePath,
            type: 'file'
          });
        } else if (type === vscode.FileType.Directory) {
          const children = await this.getSkillFiles(filePath);
          files.push({
            name,
            path: filePath,
            type: 'directory',
            children
          });
        }
      }

      return files;
    } catch (error) {
      console.error('[SkillsService] Error reading files:', error);
      return [];
    }
  }

  /**
   * 搜索市场技能
   */
  async searchMarket(query) {
    const result = await this.execCommand(`find "${query}"`);
    return result;
  }
}

module.exports = SkillsService;
