# 🚀 快速开始 - Mock 服务器测试

## ✅ Mock 服务器已启动

**服务器信息：**
- 🌐 地址: `http://localhost:3000`
- 📡 状态: ✅ 运行中
- 📊 可用技能: 3 个

---

## 🎯 立即测试（3 步）

### 第 1 步：配置环境变量

**新开一个终端窗口**，然后运行：

```bash
# Linux/Mac
export PINGANCODER_API_URL=http://localhost:3000

# Windows (PowerShell)
$env:PINGANCODER_API_URL="http://localhost:3000"

# Windows (CMD)
set PINGANCODER_API_URL=http://localhost:3000
```

### 第 2 步：重新构建（如果需要）

```bash
cd /d/pingan/pa-find-skills/pa-skills
pnpm build
```

### 第 3 步：测试 CLI 命令

```bash
# 测试搜索功能
pa-skills find react

# 测试添加功能
pa-skills add 1

# 测试列表功能
pa-skills list
```

---

## 📋 可用测试场景

### ✅ 场景 1：搜索技能

```bash
pa-skills find react
```

**预期结果：**
- 显示 3 个技能
- Code Review
- React Components Generator
- Database Schema Designer

### ✅ 场景 2：添加技能

```bash
pa-skills add 1
```

**预期结果：**
- 获取 Code Review 技能详情
- 显示安装选项
- 安装到 `.pingancoder/skills/code-review`

### ✅ 场景 3：列出已安装技能

```bash
pa-skills list
```

**预期结果：**
- 显示已安装的技能
- 包括版本、来源、位置等信息

### ❌ 场景 4：错误处理

```bash
pa-skills add 999
```

**预期结果：**
- 显示错误 "技能不存在"

---

## 🔍 API 测试

### 使用 curl 测试

```bash
# 测试列表接口
curl http://localhost:3000/api/skills/list

# 测试详情接口 (ID=1)
curl http://localhost:3000/resource/download/1

# 测试详情接口 (ID=2)
curl http://localhost:3000/resource/download/2

# 测试不存在的技能
curl http://localhost:3000/resource/download/999
```

### 使用浏览器测试

直接在浏览器打开：
- http://localhost:3000/api/skills/list
- http://localhost:3000/resource/download/1

---

## 📊 Mock 数据

### 可用的技能

| ID | 名称 | 分类 | 版本 | 作者 |
|----|------|------|------|------|
| 1 | Code Review | 代码质量 | 1.2.0 | Pingancoder Team |
| 2 | React Components Generator | 代码生成 | 2.0.1 | Frontend Team |
| 3 | Database Schema Designer | 数据库 | 1.5.3 | DBA Team |

---

## 🛠️ 调试技巧

### 查看服务器日志

Mock 服务器会实时显示请求日志：

```
2026-03-06T10:30:45.123Z GET /api/skills/list
→ 返回技能列表 (3 个技能)

2026-03-06T10:30:52.456Z GET /resource/download/1
→ 获取技能详情 (ID: 1)
```

### 检查配置

```bash
# 查看环境变量
echo $PINGANCODER_API_URL

# 查看配置文件
cat ~/.pingancoder/config.json

# 查看 CLI 状态
pa-skills status
```

### 测试 API 连通性

```bash
# 使用 curl 测试
curl http://localhost:3000/health

# 预期输出:
# {"status":"ok","message":"Mock 服务器运行中"}
```

---

## ⚠️ 常见问题

### Q: 命令还是连接到真实 API？

**A:** 确保环境变量设置正确：

```bash
# 检查当前值
echo $PINGANCODER_API_URL

# 应该输出: http://localhost:3000

# 如果不对，重新设置
export PINGANCODER_API_URL=http://localhost:3000
```

### Q: 如何停止 Mock 服务器？

**A:** 在运行服务器的终端按 `Ctrl+C`

### Q: 端口 3000 被占用怎么办？

**A:** 修改 `test/mock-server.ts` 中的 `PORT` 常量：

```typescript
const PORT = 3001; // 改为其他端口
```

然后更新环境变量：

```bash
export PINGANCODER_API_URL=http://localhost:3001
```

---

## 📝 验证清单

使用 Mock 服务器完成以下测试：

- [ ] 搜索技能 (`pa-skills find react`)
- [ ] 添加技能 1 (`pa-skills add 1`)
- [ ] 添加技能 2 (`pa-skills add 2`)
- [ ] 列出技能 (`pa-skills list`)
- [ ] 移除技能 (`pa-skills remove code-review`)
- [ ] 测试错误 (`pa-skills add 999`)
- [ ] 查看状态 (`pa-skills status`)

---

## 🎓 下一步

完成 Mock 测试后，你可以：

1. **切换到真实 API**
   ```bash
   export PINGANCODER_API_URL=https://market.paic.com.cn
   ```

2. **修改 Mock 数据**
   - 编辑 `test/mocks/skills-api.mock.ts`
   - 重启 Mock 服务器

3. **添加更多测试**
   - 修改 `test/integration-test.ts`
   - 运行 `pnpm test:mock`

---

**提示**: Mock 服务器仅用于本地测试，生产环境请使用真实 API。

**状态**: ✅ Mock 服务器运行中，可以开始测试！
