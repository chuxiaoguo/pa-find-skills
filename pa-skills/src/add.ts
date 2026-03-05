/**
 * 添加技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { parseSource } from './source-parser.js';
import { discoverSkills } from './skills.js';
import { installSkillForAllAgents } from './installer.js';
import { agents } from './agents.js';
import { findProvider } from './providers/index.js';
import { addSkillToLock, saveSelectedAgents, getLastSelectedAgents } from './skill-lock.js';
import { addSkillToLocalLock, computeSkillFolderHash } from './local-lock.js';
import { getGlobalZipHandler } from './zip-handler.js';
import { getGlobalAuthManager } from './pingancoder-auth.js';
import type { Skill, AgentType } from './types.js';

/**
 * 从多个技能中选择一个
 * 如果只有一个技能，直接返回；如果有多个，让用户选择
 */
async function selectSkill(skills: Skill[]): Promise<Skill | null> {
  if (skills.length === 0) {
    return null;
  }

  if (skills.length === 1) {
    return skills[0];
  }

  p.log.info(`发现 ${pc.cyan(String(skills.length))} 个技能`);

  const selected = await p.select({
    message: '请选择要安装的技能',
    options: skills.map(s => {
      const desc = s.description
        ? ` - ${s.description.slice(0, 50)}${s.description.length > 50 ? '...' : ''}`
        : '';
      return {
        value: s.name,
        label: `${s.name}${desc}`,
      };
    }),
  });

  if (p.isCancel(selected)) {
    return null;
  }

  return skills.find(s => s.name === selected) ?? null;
}

/**
 * 显示安装摘要
 */
function showInstallSummary(
  skill: Skill,
  selectedAgents: AgentType[],
  global: boolean,
  mode: 'symlink' | 'copy'
): string {
  const scope = global ? '全局' : '项目';
  const modeText = mode === 'symlink' ? '符号链接' : '复制';

  const lines: string[] = [
    `技能名称：${pc.cyan(skill.name)}`,
  ];

  if (skill.description) {
    lines.push(`描述：${skill.description}`);
  }

  lines.push(
    ``,
    `安装范围：${pc.yellow(scope)}`,
    `安装模式：${pc.yellow(modeText)}`,
    ``,
    `目标代理：`,
    ...selectedAgents.map(a => `  • ${agents[a].displayName}`),
  );

  if (global) {
    lines.push(``, `规范位置：`, `  ~/.agents/skills/${skill.name}`);
  }

  return lines.join('\n');
}

/**
 * 显示安装结果详情
 */
function showInstallResults(
  skill: Skill,
  selectedAgents: AgentType[],
  results: Map<AgentType, import('./installer.js').InstallResult>,
  global: boolean
): string {
  const lines: string[] = [];

  // 按代理分组显示结果
  for (const agentType of selectedAgents) {
    const agent = agents[agentType];
    const result = results.get(agentType);

    if (!result) continue;

    const icon = result.success ? pc.green('✓') : pc.red('✗');
    const status = result.success
      ? pc.green('成功')
      : pc.red(`失败: ${result.error || '未知错误'}`);

    lines.push(`${icon} ${agent.displayName}: ${status}`);

    if (result.success) {
      // 显示安装路径
      const mode = result.symlinkFailed
        ? pc.yellow('copy (symlink失败)')
        : pc.blue(result.mode);

      // 对于 symlink 模式，显示两个路径
      if (result.mode === 'symlink' && result.canonicalPath) {
        lines.push(`  ${pc.dim('→')} ${result.canonicalPath}`);
        lines.push(`  ${pc.dim('→')} ${result.path}`);
      } else {
        lines.push(`  ${mode} → ${result.path}`);
      }
    }
    lines.push('');
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * 交互式选择安装选项
 * @param globalFromCmd 命令行传入的 global 值（如果有）
 * @returns 安装选项
 */
async function selectInstallOptions(globalFromCmd?: boolean): Promise<{
  global: boolean;
  mode: 'symlink' | 'copy';
}> {
  // 如果命令行没有指定 global，则询问
  let global = globalFromCmd ?? false;
  if (globalFromCmd === undefined) {
    const scope = await p.select({
      message: '选择安装范围',
      options: [
        {
          value: 'false',
          label: '项目级 (仅当前项目可用)',
        },
        {
          value: 'true',
          label: '全局 (所有项目可用)',
        },
      ],
      initialValue: 'false',
    });

    if (p.isCancel(scope)) {
      throw new Error('操作已取消');
    }

    global = scope === 'true';
  }

  // 询问安装模式
  const mode = await p.select({
    message: '选择安装模式',
    options: [
      {
        value: 'symlink',
        label: '符号链接 (推荐，节省空间，便于更新)',
      },
      {
        value: 'copy',
        label: '复制 (兼容性更好，占用更多空间)',
      },
    ],
    initialValue: 'symlink',
  });

  if (p.isCancel(mode)) {
    throw new Error('操作已取消');
  }

  return {
    global,
    mode: mode as 'symlink' | 'copy',
  };
}

/**
 * 显示 PA-SKILLS 标题
 */
function showPaSkillsHeader(): void {
  const header = pc.cyan(`
┌──────────────────────────────────────┐
│                                      │
│  ┌─┐┌─┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │
│  │P││A││- ││S ││K ││I ││L ││L ││S │  │
│  └─┘└─┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘  │
│                                      │
│     PA - SKILLS                      │
│                                      │
└──────────────────────────────────────┘
`);

  console.log(header);
}

export async function runAdd(args: string[]): Promise<void> {
  // 显示 PA-SKILLS 标题
  showPaSkillsHeader();

  p.intro(pc.cyan('欢迎使用 Pingancoder Skills'));

  // 解析参数：移除 --global 和 -g 标志
  const filteredArgs = args.filter(arg => arg !== '--global' && arg !== '-g');
  const useGlobal = args.includes('--global') || args.includes('-g');

  if (filteredArgs.length === 0) {
    const source = await p.text({
      message: '请输入技能来源',
      placeholder: 'pingancoder://skill-name 或 ./local-path 或 ./skill.zip',
      validate: (value) => {
        if (!value) return '请输入技能来源';
        try {
          parseSource(value);
          return undefined;
        } catch {
          return '无效的技能来源格式';
        }
      },
    });

    if (p.isCancel(source)) {
      p.cancel('操作已取消');
      return;
    }

    await addSkill(source, useGlobal || undefined);
  } else {
    await addSkill(filteredArgs[0], useGlobal || undefined);
  }
}

async function addSkill(sourceStr: string, global: boolean | undefined = undefined): Promise<void> {
  const parsed = parseSource(sourceStr);

  p.log.info(`从 ${parsed.type} 获取技能...`);

  const provider = findProvider(sourceStr);
  if (!provider) {
    p.cancel('不支持的技能来源');
    return;
  }

  let skill: Skill | null = null;
  let tempExtractPath: string | null = null;

  try {
    if (parsed.type === 'local-zip') {
      const zipHandler = getGlobalZipHandler();
      tempExtractPath = await zipHandler.extractZip(parsed.localPath!);

      const skills = await discoverSkills(tempExtractPath, undefined, { includeInternal: true });
      if (skills.length === 0) {
        throw new Error('Zip 文件中未找到有效技能');
      }

      // 多技能选择
      skill = await selectSkill(skills);
      if (!skill) {
        if (tempExtractPath) {
          const zipHandler = getGlobalZipHandler();
          await zipHandler.cleanup(tempExtractPath);
        }
        p.cancel('操作已取消');
        return;
      }
    } else if (parsed.type === 'local') {
      // 使用 direct 模式，只在指定路径查找 SKILL.md，不搜索子目录
      // 与 zip 安装行为保持一致
      const skills = await discoverSkills(parsed.localPath!, parsed.subpath, { direct: true });
      if (skills.length === 0) {
        throw new Error(
          `本地路径中未找到有效技能：${parsed.localPath}\n\n` +
          `请确保 SKILL.md 文件直接在指定路径下。\n\n` +
          `正确结构：\n` +
          `  ${parsed.localPath}/\n` +
          `  └── SKILL.md  ← 应该直接在这里\n\n` +
          `如果 SKILL.md 在子目录中，请直接指定子目录路径。`
        );
      }

      // 多技能选择（本地路径也可能有多个技能）
      skill = await selectSkill(skills);
      if (!skill) {
        p.cancel('操作已取消');
        return;
      }
    } else if (parsed.type === 'pingancoder-api') {
      const authManager = getGlobalAuthManager();
      const status = await authManager.getStatus();

      if (!status.authenticated) {
        p.cancel('请先登录: pa-skills auth login');
        return;
      }

      const remoteSkill = await provider.fetchSkill(parsed);
      if (!remoteSkill) {
        throw new Error('获取技能失败');
      }

      if (remoteSkill.sourceUrl.endsWith('.zip')) {
        const zipHandler = getGlobalZipHandler();
        const token = await authManager.getToken();
        p.log.info('下载技能包...');
        tempExtractPath = await zipHandler.downloadAndExtract(remoteSkill.sourceUrl, token);

        const skills = await discoverSkills(tempExtractPath, undefined, { includeInternal: true });
        if (skills.length === 0) {
          throw new Error('技能包中未找到有效技能');
        }

        // 多技能选择
        skill = await selectSkill(skills);
        if (!skill) {
          if (tempExtractPath) {
            const zipHandler = getGlobalZipHandler();
            await zipHandler.cleanup(tempExtractPath);
          }
          p.cancel('操作已取消');
          return;
        }
      } else {
        throw new Error('不支持的技能格式');
      }
    }
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : '获取技能失败';

    if (parsed.type === 'local-zip' && (errorMessage.includes('no such file') || errorMessage.includes('ENOENT'))) {
      errorMessage = `Zip 文件不存在: ${parsed.localPath}。请确认文件路径是否正确（可使用相对路径如 ../file.zip 或绝对路径）`;
    }

    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }

    p.cancel(errorMessage);
    return;
  }

  if (!skill) {
    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }
    p.cancel('未找到有效技能');
    return;
  }

  p.log.success(`找到技能: ${skill.name}`);

  // 检查是否已安装（用于提示重新安装）
  const { isSkillInstalled } = await import('./installer.js');
  const allAgentTypes = Object.keys(agents) as Array<keyof typeof agents>;

  // 从锁文件获取最后选择的代理
  const lastSelectedAgents = await getLastSelectedAgents();
  // 过滤出有效的代理类型（移除不支持的老代理，如 claude-code）
  const validLastSelected = lastSelectedAgents
    ? (lastSelectedAgents as string[]).filter((a): a is AgentType => a in agents)
    : [];
  const checkOrder = validLastSelected.length > 0
    ? validLastSelected.concat(allAgentTypes.filter(a => !validLastSelected.includes(a)))
    : allAgentTypes;

  // 按照优先级顺序检查是否已安装
  for (const agentType of checkOrder) {
    if (await isSkillInstalled(skill.name, agentType)) {
      const shouldContinue = await p.confirm({
        message: `技能 ${skill.name} 已安装到 ${agents[agentType].displayName}，是否重新安装？`,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        if (tempExtractPath) {
          const zipHandler = getGlobalZipHandler();
          await zipHandler.cleanup(tempExtractPath);
        }
        p.cancel('操作已取消');
        return;
      }
      break;
    }
  }

  // 选择要安装的代理 - 始终显示所有 4 个代理
  const agentChoices = allAgentTypes.map((type) => ({
    value: type,
    label: agents[type].displayName,
  }));

  const selected = await p.multiselect({
    message: '选择要安装到的代理',
    options: agentChoices,
    required: false,
  });

  if (p.isCancel(selected) || selected.length === 0) {
    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }
    p.cancel('操作已取消');
    return;
  }

  const selectedAgents = selected as typeof allAgentTypes;

  const validAgents = selectedAgents.filter((agentType) => agentType in agents);
  if (validAgents.length !== selectedAgents.length) {
    const invalid = selectedAgents.filter((a) => !(a in agents));
    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }
    p.cancel(`选择的代理包含无效类型: ${invalid.join(', ')}`);
    return;
  }

  // 交互式选择安装范围和模式
  const installOptions = await selectInstallOptions(global);

  // 显示安装摘要
  p.note(showInstallSummary(skill, selectedAgents, installOptions.global, installOptions.mode), '安装摘要');

  // 确认安装
  const confirmed = await p.confirm({
    message: '确认安装？',
  });

  if (p.isCancel(confirmed) || !confirmed) {
    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }
    p.cancel('操作已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在安装...');

  try {
    const results = await installSkillForAllAgents(skill, { agents: selectedAgents, global: installOptions.global });

    let successCount = 0;
    let failCount = 0;

    for (const agentType of selectedAgents) {
      const result = results.get(agentType);
      if (!result) continue;

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      const folderHash = await computeSkillFolderHash(skill.path);
      await addSkillToLock(skill.name, {
        source: sourceStr,
        sourceType: parsed.type,
        sourceUrl: sourceStr,
        skillFolderHash: folderHash,
      });
      await addSkillToLocalLock(skill.name, {
        source: sourceStr,
        sourceType: parsed.type,
        computedHash: folderHash,
      });
      await saveSelectedAgents(selectedAgents);

      s.stop(`安装完成！`);

      // 显示详细安装结果
      p.note(showInstallResults(skill, selectedAgents, results, installOptions.global), '安装详情');

      p.outro(pc.green('✓ 技能安装成功'));
    } else {
      s.stop('安装失败');
      p.cancel('所有代理安装均失败');
    }
  } catch (error) {
    s.stop('安装失败');
    p.cancel(error instanceof Error ? error.message : '安装失败');
  } finally {
    if (tempExtractPath) {
      const zipHandler = getGlobalZipHandler();
      await zipHandler.cleanup(tempExtractPath);
    }
  }
}
