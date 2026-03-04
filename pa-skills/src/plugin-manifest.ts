/**
 * 插件清单模块
 * 兼容 Claude Code 插件系统
 */

import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import * as matter from 'gray-matter';

/**
 * 获取插件技能路径
 */
export async function getPluginSkillPaths(searchPath: string): Promise<string[]> {
  const pluginPaths: string[] = [];

  // 检查 .claude-plugin 目录
  const pluginDir = join(searchPath, '.claude-plugin');
  if (!existsSync(pluginDir)) {
    return pluginPaths;
  }

  const marketplacePath = join(pluginDir, 'marketplace.json');
  if (!existsSync(marketplacePath)) {
    return pluginPaths;
  }

  try {
    const content = await readFile(marketplacePath, 'utf-8');
    const manifest = JSON.parse(content);

    if (manifest.plugins && Array.isArray(manifest.plugins)) {
      for (const plugin of manifest.plugins) {
        if (plugin.skills && Array.isArray(plugin.skills)) {
          const rootDir = manifest.metadata?.pluginRoot
            ? join(searchPath, manifest.metadata.pluginRoot)
            : searchPath;

          for (const skillPath of plugin.skills) {
            const absolutePath = resolve(rootDir, skillPath);
            pluginPaths.push(dirname(absolutePath));
          }
        }
      }
    }
  } catch {
    // 忽略错误
  }

  return pluginPaths;
}

/**
 * 获取插件分组信息
 */
export async function getPluginGroupings(searchPath: string): Promise<Map<string, string>> {
  const groupings = new Map<string, string>();

  const pluginDir = join(searchPath, '.claude-plugin');
  if (!existsSync(pluginDir)) {
    return groupings;
  }

  const marketplacePath = join(pluginDir, 'marketplace.json');
  if (!existsSync(marketplacePath)) {
    return groupings;
  }

  try {
    const content = await readFile(marketplacePath, 'utf-8');
    const manifest = JSON.parse(content);

    if (manifest.plugins && Array.isArray(manifest.plugins)) {
      for (const plugin of manifest.plugins) {
        if (plugin.skills && Array.isArray(plugin.skills)) {
          const rootDir = manifest.metadata?.pluginRoot
            ? join(searchPath, manifest.metadata.pluginRoot)
            : searchPath;

          for (const skillPath of plugin.skills) {
            const absolutePath = resolve(rootDir, skillPath);
            groupings.set(absolutePath, plugin.name);
          }
        }
      }
    }
  } catch {
    // 忽略错误
  }

  return groupings;
}
