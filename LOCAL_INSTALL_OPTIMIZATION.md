# 本地安装逻辑优化分析

## 🔍 当前问题

### Zip 安装（合理的方式）
```
zip-test.zip
└── SKILL.md  ← 直接在根目录
```
- ✅ 结构清晰
- ✅ 位置明确
- ✅ 符合直觉

### 本地安装（当前实现）
```
my-skills/
├── skills/
│   └── my-skill/
│       └── SKILL.md  ← 在子目录中
└── package.json
```
- ⚠️ 会递归搜索多个位置
- ⚠️ 可以在 `skills/`, `.agents/skills/` 等子目录找到
- ⚠️ 行为不一致

## 📋 当前实现分析

### discoverSkills 函数的搜索路径

```typescript
// 搜索以下位置：
const prioritySearchDirs = [
  searchPath,                    // 直接路径
  join(searchPath, 'skills'),
  join(searchPath, 'skills/.curated'),
  join(searchPath, 'skills/.experimental'),
  join(searchPath, 'skills/.system'),
  join(searchPath, '.agent/skills'),
  join(searchPath, '.agents/skills'),
  join(searchPath, '.gemini/skills'),
  join(searchPath, '.opencode/skills'),
  join(searchPath, '.pingancoder/skills'),
  join(searchPath, 'skills'),    // OpenClaw
];
```

### 问题
1. **过于复杂**：搜索太多位置
2. **行为不一致**：与zip安装的行为不同
3. **用户困惑**：不清楚应该把SKILL.md放在哪里

## 💡 优化方案

### 目标
让本地安装的行为与zip安装保持一致：
- 直接在用户指定的路径下查找 SKILL.md
- 不递归搜索子目录
- 简化逻辑，提升用户体验

### 方案
修改 `discoverSkills` 函数，添加一个 `direct` 选项：
- `direct: true` - 直接在指定路径查找，不搜索子目录
- `direct: false` - 递归搜索（向后兼容）

## 🔧 具体修改

### 1. 修改 DiscoverSkillsOptions 接口

```typescript
export interface DiscoverSkillsOptions {
  /** 包含内部技能 */
  includeInternal?: boolean;
  /** 搜索所有子目录 */
  fullDepth?: boolean;
  /** 直接模式：只在指定路径查找，不搜索子目录 */
  direct?: boolean;
}
```

### 2. 修改 discoverSkills 函数

```typescript
export async function discoverSkills(
  basePath: string,
  subpath?: string,
  options?: DiscoverSkillsOptions
): Promise<Skill[]> {
  const skills: Skill[] = [];
  const seenNames = new Set<string>();
  const searchPath = subpath ? join(basePath, subpath) : basePath;

  // 直接模式：只在指定路径查找 SKILL.md
  if (options?.direct) {
    if (await hasSkillMd(searchPath)) {
      const skillMdPath = join(searchPath, 'SKILL.md');
      let skill = await parseSkillMd(skillMdPath, options);
      if (skill) {
        skills.push(skill);
        return skills;
      }
    }
    // 未找到，返回空数组
    return skills;
  }

  // 原有的递归搜索逻辑...
  // ...
}
```

### 3. 修改 add.ts 中的本地安装逻辑

```typescript
} else if (parsed.type === 'local') {
  // 使用 direct 模式，只在指定路径查找
  const skills = await discoverSkills(parsed.localPath!, parsed.subpath, { direct: true });
  if (skills.length === 0) {
    throw new Error(`本地路径中未找到有效技能：${parsed.localPath}\n\n请确保 SKILL.md 文件直接在指定路径下。`);
  }
  skill = skills[0];
}
```

## 📝 预期效果

### 优化后的行为

```bash
# 用户执行
pa-skills add ./my-skill

# 期望行为：
# 直接在 ./my-skill/ 目录下查找 SKILL.md
# 不搜索子目录
```

### 目录结构要求

```
my-skill/
└── SKILL.md  ← 必须直接在这里
```

### 错误提示

如果找不到 SKILL.md，给出清晰的提示：
```
本地路径中未找到有效技能：./my-skill

请确保 SKILL.md 文件直接在指定路径下。

正确结构：
  my-skill/
  └── SKILL.md  ← 应该直接在这里

如果 SKILL.md 在子目录中，请直接指定子目录路径：
  pa-skills add ./my-skills/skills/my-skill
```

## 🎯 优势

1. **一致性**：本地安装与 zip 安装行为一致
2. **简洁性**：不需要递归搜索多个位置
3. **明确性**：用户清楚知道应该把 SKILL.md 放在哪里
4. **可预测性**：行为符合直觉，减少困惑

## 📚 文档更新

需要更新文档说明正确的目录结构：

```markdown
## 本地技能安装

### 目录结构要求

技能目录必须直接包含 SKILL.md 文件：

```
my-skill/
└── SKILL.md
```

### 安装命令

```bash
# 从技能目录安装
pa-skills add ./my-skill

# 使用绝对路径
pa-skills add /path/to/my-skill
```

### 常见错误

❌ 错误：SKILL.md 在子目录中
```
my-skills/
└── skills/
    └── my-skill/
        └── SKILL.md  ← 位置不对
```

✅ 正确：直接指定技能目录
```
pa-skills add ./my-skills/skills/my-skill
```
```

## 🔄 向后兼容性

- 添加 `direct` 选项而不是完全移除递归搜索
- 其他需要递归搜索的地方可以继续使用默认行为
- 只在用户明确指定的本地路径时使用 direct 模式

---

**创建时间**: 2026年3月5日
**状态**: 待实施
