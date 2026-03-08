/**
 * pa-skills CLI 适配器
 * 负责与 pa-skills CLI 进行交互
 */

import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { Skill, SkillFile, CLIResponse, InstallOptions } from '../types/index';

export class CLIAdapter {
  private cliPath: string;

  constructor() {
    // 优先使用项目中的 pa-skills
    const projectPaSkills = path.join(
      vscode.workspace.rootPath || '',
      'pa-skills',
      'bin',
      'cli.mjs'
    );

    // 检查项目中的 pa-skills 是否存在
    try {
      vscode.workspace.fs.stat(vscode.Uri.file(projectPaSkills));
      this.cliPath = projectPaSkills;
    } catch {
      // 使用全局安装的 pa-skills
      this.cliPath = 'pa-skills';
    }
  }

  /**
   * 执行 CLI 命令
   */
  private async exec(
    command: string,
    args: string[]
  ): Promise<CLIResponse> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const process = cp.spawn(
        command,
        [...args, '--json'],
        {
          cwd: vscode.workspace.rootPath,
          shell: true,
        }
      );

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        console.log(
          `[CLIAdapter] Command executed in ${duration}ms: ${command} ${args.join(' ')}`
        );

        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            resolve({ success: true, data });
          } catch (e) {
            // 如果输出不是 JSON，可能是错误消息
            resolve({ success: false, error: stdout || stderr });
          }
        } else {
          resolve({ success: false, error: stderr || stdout });
        }
      });

      process.on('error', (error) => {
        console.error('[CLIAdapter] Process error:', error);
        resolve({ success: false, error: error.message });
      });
    });
  }

  /**
   * 获取已安装的技能列表
   */
  async listSkills(): Promise<CLIResponse<Skill[]>> {
    return this.exec(this.cliPath, ['list', '--json']);
  }

  /**
   * 安装技能
   */
  async installSkill(options: InstallOptions): Promise<CLIResponse> {
    const args = ['add', options.source];

    if (options.sourceType === 'pingancoder-api') {
      args.push('--from', 'pingancoder-api');
    }

    if (options.agents && options.agents.length > 0) {
      args.push('--agents', options.agents.join(','));
    }

    return this.exec(this.cliPath, args);
  }

  /**
   * 卸载技能
   */
  async uninstallSkill(skillName: string): Promise<CLIResponse> {
    return this.exec(this.cliPath, ['remove', skillName]);
  }

  /**
   * 搜索市场技能
   */
  async searchMarket(query: string): Promise<CLIResponse> {
    return this.exec(this.cliPath, ['find', query, '--json']);
  }

  /**
   * 获取技能文件列表
   */
  async getSkillFiles(skillPath: string): Promise<SkillFile[]> {
    const files: SkillFile[] = [];

    try {
      const uri = vscode.Uri.file(skillPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);

      for (const [name, type] of entries) {
        const filePath = path.join(skillPath, name);
        if (type === vscode.FileType.File) {
          files.push({ name, path: filePath, type: 'file' });
        } else if (type === vscode.FileType.Directory) {
          // 递归获取子目录
          const children = await this.getSkillFiles(filePath);
          files.push({ name, path: filePath, type: 'directory', children });
        }
      }
    } catch (error) {
      console.error('[CLIAdapter] Error reading skill files:', error);
    }

    return files;
  }
}
