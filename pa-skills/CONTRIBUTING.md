# 贡献指南

感谢你有兴趣为 Pingancoder Skills 做出贡献！

## 开发环境设置

### 前置要求

- Node.js >= 18
- pnpm >= 10.17.1
- TypeScript 5.9+

### 克隆项目

```bash
git clone <repository-url>
cd pa-skills
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 运行健康检查
node scripts/check.js

# 启动开发模式
pnpm dev

# 或者使用 tsx 直接运行
npx tsx src/cli.ts --help
```

### 构建

```bash
# 构建项目
pnpm build

# 检查类型
pnpm type-check
```

### 测试

```bash
# 运行测试
pnpm test

# 运行特定测试
pnpm test <pattern>
```

## 项目结构

```
pa-skills/
├── src/                    # 源代码
│   ├── types.ts            # 类型定义
│   ├── constants.ts        # 常量定义
│   ├── agents.ts           # 代理配置
│   ├── config.ts           # 配置管理
│   ├── cli.ts              # CLI 入口
│   ├── commands/           # 命令实现
│   ├── providers/          # 技能提供者
│   └── utils.ts            # 工具函数
├── bin/                    # 可执行文件
├── dist/                   # 构建输出
├── examples/               # 示例技能
├── scripts/                # 构建脚本
└── tests/                  # 测试文件
```

## 代码规范

### TypeScript

- 使用严格模式
- 所有函数必须有类型注解
- 遵循 ESLint 规则

### 命名约定

- 文件名：kebab-case (`my-module.ts`)
- 变量/函数：camelCase (`myVariable`)
- 类/类型：PascalCase (`MyClass`)
- 常量：UPPER_SNAKE_CASE (`MY_CONSTANT`)

### 注释

- 使用 JSDoc 注释导出的函数和类
- 复杂逻辑需要添加说明注释
- 保持注释简洁明了

### Git 提交信息

使用约定式提交格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建

示例：

```
feat(providers): 添加新的技能提供者

实现了从 GitLab 仓库获取技能的功能

Closes #123
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 进行开发

- 遵循代码规范
- 添加必要的测试
- 更新相关文档

### 3. 测试

```bash
# 运行所有检查
pnpm type-check && pnpm test

# 手动测试
pnpm dev add <test-source>
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: 添加新功能"
```

### 5. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

## 添加新功能

### 添加新的命令

1. 在 `src/` 创建命令文件 `my-command.ts`
2. 实现命令逻辑
3. 在 `src/cli.ts` 中注册命令

```typescript
// src/my-command.ts
export async function runMyCommand(args: string[]): Promise<void> {
  // 实现命令逻辑
}

// src/cli.ts
case 'my-command': {
  const { runMyCommand } = await import('./my-command.js');
  await runMyCommand(commandArgs);
  break;
}
```

### 添加新的提供者

1. 在 `src/providers/` 创建提供者文件
2. 实现 `Provider` 接口
3. 在 `src/providers/index.ts` 中注册

```typescript
// src/providers/my-provider.ts
import type { Provider } from '../types.js';

class MyProvider implements Provider {
  id = 'my-provider';
  displayName = 'My Provider';

  match(source: string): boolean {
    // 实现匹配逻辑
  }

  async fetchSkill(parsedSource: ParsedSource): Promise<RemoteSkill | null> {
    // 实现获取逻辑
  }
}

export function createMyProvider(): Provider {
  return new MyProvider();
}
```

### 添加新的代理

1. 在 `src/agents.ts` 中添加代理配置
2. 更新 `AgentType` 类型

```typescript
// src/types.ts
export type AgentType =
  | 'gemini'
  | 'opencode'
  | 'openclaw'
  | 'pingancoder'
  | 'my-agent';  // 新增

// src/agents.ts
export const agents: Record<AgentType, AgentConfig> = {
  // ... 现有代理
  my-agent: {
    name: 'my-agent',
    displayName: 'My Agent',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.my-agent/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.my-agent'));
    },
  },
};
```

## 测试指南

### 单元测试

```typescript
// tests/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/utils.js';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### 集成测试

```bash
# 测试 CLI 命令
pnpm dev add ./test-skills
pnpm dev list
pnpm dev remove test-skill
```

## 文档

### 更新文档

- 新功能需要更新 README.md
- API 变更需要更新 CHANGELOG.md
- 复杂功能需要添加技术文档

### 文档位置

- `README.md` - 用户文档
- `CONTRIBUTING.md` - 贡献指南（本文件）
- `CHANGELOG.md` - 变更日志
- `docs/` - 详细文档（可选）

## 问题报告

### Bug 报告

使用 Issue 模板报告 bug，包含：

- 环境信息（OS、Node 版本等）
- 复现步骤
- 期望行为
- 实际行为
- 错误日志

### 功能请求

使用 Issue 模板提出功能请求，包含：

- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案

## 行为准则

- 尊重他人
- 接受建设性批评
- 关注对社区最有利的事情
- 表示同理心

## 获取帮助

- 查看 [文档](README.md)
- 搜索 [Issues](../../issues)
- 加入 [讨论](../../discussions)

---

感谢你的贡献！🙏
