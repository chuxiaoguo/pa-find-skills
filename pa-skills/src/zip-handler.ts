/**
 * Zip 处理模块
 * 处理 Zip 文件的下载、解压和验证
 */

import { readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, normalize, basename } from 'path';
import { tmpdir } from 'os';
import extract from 'extract-zip';
import { SKILL_MD_FILE, ERROR_MESSAGES } from './constants.js';

/**
 * Zip 处理器类
 */
export class ZipHandler {
  /**
   * 从 URL 下载 Zip 文件到临时目录
   */
  async downloadZip(
    url: string,
    token?: string,
    onProgress?: (progress: number, downloaded: number, total: number) => void
  ): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Pingancoder-Skills/1.0.0',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('无法获取响应内容');
      }

      // 创建临时文件
      const tempDir = tmpdir();
      const fileName = `skill-${Date.now()}.zip`;
      const tempPath = join(tempDir, fileName);

      // 读取流并写入文件
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let downloaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        downloaded += value.length;

        if (onProgress && total > 0) {
          onProgress(Math.floor((downloaded / total) * 100), downloaded, total);
        }
      }

      // 合并所有 chunks 并写入文件
      const buffer = Buffer.concat(chunks);
      await writeFile(tempPath, buffer);

      return tempPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`下载 Zip 文件失败: ${error.message}`);
      }
      throw new Error('下载 Zip 文件失败');
    }
  }

  /**
   * 从 Buffer 解压 Zip
   */
  async extractZipFromBuffer(buffer: Buffer): Promise<string> {
    try {
      // 创建临时目录
      const tempDir = tmpdir();
      const extractPath = join(tempDir, `skill-extract-${Date.now()}`);
      await mkdir(extractPath, { recursive: true });

      // 将 Buffer 写入临时文件
      const tempZipPath = join(tempDir, `temp-${Date.now()}.zip`);
      await writeFile(tempZipPath, buffer);

      // 解压
      await extract(tempZipPath, { dir: extractPath });

      // 验证安全性
      this.validateExtractedPath(extractPath);

      // 删除临时 Zip 文件
      await unlink(tempZipPath).catch(() => {});

      return extractPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`解压 Zip 文件失败: ${error.message}`);
      }
      throw new Error('解压 Zip 文件失败');
    }
  }

  /**
   * 解压 Zip 文件到临时目录
   */
  async extractZip(zipPath: string): Promise<string> {
    try {
      // 创建临时目录
      const tempDir = tmpdir();
      const extractPath = join(tempDir, `skill-extract-${Date.now()}`);
      await mkdir(extractPath, { recursive: true });

      // 解压
      await extract(zipPath, { dir: extractPath });

      // 验证安全性
      this.validateExtractedPath(extractPath);

      // 验证技能包结构
      await this.validateSkillPackage(extractPath);

      return extractPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`解压 Zip 文件失败: ${error.message}`);
      }
      throw new Error('解压 Zip 文件失败');
    }
  }

  /**
   * 验证解压后的路径安全性（防止路径遍历攻击）
   */
  private validateExtractedPath(extractPath: string): void {
    try {
      const entries = readdirSync(extractPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = join(extractPath, entry.name);
        const normalized = normalize(entryPath);

        // 检查是否包含 .. （路径遍历攻击）
        if (normalized.includes('..')) {
          throw new Error(ERROR_MESSAGES.PATH_TRAVERSAL);
        }

        // 递归检查子目录
        if (entry.isDirectory()) {
          this.validateExtractedPath(entryPath);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === ERROR_MESSAGES.PATH_TRAVERSAL) {
        throw error;
      }
      // 如果无法读取目录，可能不是有效的 Zip 解压结果
      throw new Error(ERROR_MESSAGES.INVALID_ZIP);
    }
  }

  /**
   * 验证技能包结构
   */
  private async validateSkillPackage(extractPath: string): Promise<void> {
    const skillMdPath = join(extractPath, SKILL_MD_FILE);

    if (!existsSync(skillMdPath)) {
      throw new Error(ERROR_MESSAGES.NO_SKILL_MD);
    }

    // 验证 SKILL.md 是否可读
    try {
      await readFile(skillMdPath, 'utf-8');
    } catch {
      throw new Error(ERROR_MESSAGES.NO_SKILL_MD);
    }
  }

  /**
   * 清理临时文件
   */
  async cleanup(tempPath: string): Promise<void> {
    try {
      const { unlink, rmdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const { readdir } = await import('fs/promises');

      if (!existsSync(tempPath)) {
        return;
      }

      const stat = await (await import('fs/promises')).stat(tempPath);

      if (stat.isDirectory()) {
        const entries = await readdir(tempPath, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = join(tempPath, entry.name);

          if (entry.isDirectory()) {
            await this.cleanup(entryPath);
          } else {
            await unlink(entryPath).catch(() => {});
          }
        }

        await rmdir(tempPath).catch(() => {});
      } else {
        await unlink(tempPath).catch(() => {});
      }
    } catch {
      // 忽略清理错误
    }
  }

  /**
   * 从 URL 下载并直接解压
   */
  async downloadAndExtract(
    url: string,
    token?: string,
    onProgress?: (progress: number, downloaded: number, total: number) => void
  ): Promise<string> {
    const zipPath = await this.downloadZip(url, token, onProgress);
    try {
      return await this.extractZip(zipPath);
    } finally {
      // 清理临时 Zip 文件
      await this.cleanup(zipPath);
    }
  }
}

/**
 * 创建 Zip 处理器实例
 */
export function createZipHandler(): ZipHandler {
  return new ZipHandler();
}

/**
 * 全局共享的 Zip 处理器实例
 */
let globalZipHandler: ZipHandler | null = null;

/**
 * 获取全局 Zip 处理器
 */
export function getGlobalZipHandler(): ZipHandler {
  if (!globalZipHandler) {
    globalZipHandler = new ZipHandler();
  }
  return globalZipHandler;
}

/**
 * 重置全局 Zip 处理器
 */
export function resetGlobalZipHandler(): void {
  globalZipHandler = null;
}
