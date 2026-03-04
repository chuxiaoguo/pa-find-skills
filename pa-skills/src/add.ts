/**
 * 添加技能命令
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { parseSource } from './source-parser.js';
import { discoverSkills } from './skills.js';
import { installSkillForAllAgents } from './installer.js';
import { detectInstalledAgents, agents } from './agents.js';
import { findProvider } from './providers/index.js';
import { getSkillFromLock, addSkillToLock, saveSelectedAgents, getLastSelectedAgents } from './skill-lock.js';
import { addSkillToLocalLock, computeSkillFolderHash } from './local-lock.js';
import { getGlobalZipHandler } from './zip-handler.js';
import { getGlobalAuthManager } from './pingancoder-auth.js';
import type { Skill, AgentType } from './types.js';

export async function runAdd(args: string[]): Promise<void> {
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

    await addSkill(source, useGlobal);
  } else {
    await addSkill(filteredArgs[0], useGlobal);
  }
}

async function addSkill(sourceStr: string, global: boolean = false): Promise<void> {
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
      skill = skills[0];
    } else if (parsed.type === 'local') {
      const skills = await discoverSkills(parsed.localPath!, parsed.subpath);
      if (skills.length === 0) {
        throw new Error('本地路径中未找到有效技能');
      }
      skill = skills[0];
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
        skill = skills[0];
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

  const s = p.spinner();
  s.start('正在安装...');

  try {
    const results = await installSkillForAllAgents(skill, { agents: selectedAgents, global });

    let successCount = 0;
    let failCount = 0;

    for (const agentType of selectedAgents) {
      const result = results.get(agentType);
      if (!result) continue;

      if (result.success) {
        successCount++;
        p.log.success(`已安装到 ${agents[agentType].displayName}`);
      } else {
        failCount++;
        p.log.error(`安装到 ${agents[agentType].displayName} 失败: ${result.error}`);
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

      s.stop(`安装完成！(${successCount} 个代理成功${failCount > 0 ? `, ${failCount} 个失败` : ''})`);
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
