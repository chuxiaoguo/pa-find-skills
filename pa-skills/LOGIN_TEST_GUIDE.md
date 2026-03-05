# 🔐 Mock 环境登录测试完整指南

## ✅ Mock 服务器已启动

**服务器信息：**
- 🌐 地址: `http://localhost:3000`
- 🔐 登录接口: `/auth/login`
- 📡 状态: ✅ 运行中

**测试账号：**
| 用户名 | 密码 |
|--------|------|
| `admin` | `admin123` |
| `test` | `test123` |
| `mock` | `mock123` |

---

## 🚀 完整测试流程（5 步）

### 第 1 步：配置环境变量

**新开一个终端窗口**，然后运行：

```bash
# Windows (PowerShell)
$env:PINGANCODER_API_URL="http://localhost:3000"

# Windows (CMD)
set PINGANCODER_API_URL=http://localhost:3000

# Linux/Mac
export PINGANCODER_API_URL=http://localhost:3000
```

### 第 2 步：登录

```bash
pa-skills auth login
```

**交互流程：**
```
? 用户名: admin
? 密码: ********
```

**预期输出：**
```
✓ 登录成功！
欢迎, admin
Token 已保存到: ~/.pingancoder/auth.json
```

### 第 3 步：测试搜索功能

```bash
pa-skills find react
```

**预期输出：**
```
✓ 找到 3 个技能

1. Code Review
   智能代码审查技能，帮助识别代码问题并提供改进建议

2. React Components Generator
   基于描述生成 React 组件代码，支持 TypeScript 和样式

3. Database Schema Designer
   数据库表结构设计工具，支持 ER 图生成和 SQL 导出
```

### 第 4 步：测试添加功能

```bash
pa-skills add 1
```

**预期流程：**
```
1. 获取技能详情 ✅
2. 显示安装摘要 ✅
3. 选择代理（可选） ✅
4. 选择安装范围 ✅
5. 选择安装模式 ✅
6. 确认安装 ✅
7. 安装完成 ✅
```

**示例输出：**
```
✓ 找到技能: Code Review

┌─────────────────┐
│ 安装摘要        │
└─────────────────┘

技能名称：Code Review
描述：智能代码审查技能...

安装范围：项目级
安装模式：符号链接

目标代理：
  • Pingancoder

? 确认安装？ (Y/n)
```

### 第 5 步：测试列表功能

```bash
pa-skills list
```

**预期输出：**
```
已安装的技能 (1)

✓ code-review (Code Review)
  版本: 1.2.0
  来源: pingancoder-api://1
  位置: .pingancoder/skills/code-review
```

---

## 🧪 测试登录功能

### 测试正确密码

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "success": true,
  "data": {
    "token": "YWRtaW4...",
    "expiresIn": 86400000,
    "username": "admin"
  }
}
```

### 测试错误密码

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```

**预期响应：**
```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "success": false
}
```

---

## 🔍 验证认证状态

### 查看认证状态

```bash
pa-skills auth status
```

**预期输出：**
```
认证状态: ✓ 已认证
用户名: admin
Token 有效期: 24 小时
```

### 查看认证文件

```bash
cat ~/.pingancoder/auth.json
```

**预期内容：**
```json
{
  "token": "YWRtaW4t...",
  "expiresAt": 1772813429581,
  "username": "admin"
}
```

---

## 📋 完整验证清单

### 认证相关

- [ ] 登录成功 (`pa-skills auth login`)
- [ ] 查看状态 (`pa-skills auth status`)
- [ ] 登出成功 (`pa-skills auth logout`)

### 技能管理

- [ ] 搜索技能 (`pa-skills find react`)
- [ ] 添加技能 (`pa-skills add 1`)
- [ ] 列出技能 (`pa-skills list`)
- [ ] 移除技能 (`pa-skills remove code-review`)

### 错误处理

- [ ] 错误密码提示
- [ ] 未登录提示
- [ ] Token 过期处理

---

## 🛠️ 调试技巧

### 查看服务器日志

Mock 服务器会显示所有请求：

```
2026-03-06T11:00:00.000Z POST /auth/login
→ 登录请求: username=admin
→ 登录成功: username=admin, token=YWRtaW4t...

2026-03-06T11:00:05.000Z GET /api/skills/list
→ 返回技能列表 (3 个技能)
```

### 重置认证状态

如果遇到问题，可以删除认证文件重新登录：

```bash
# 删除认证文件
rm ~/.pingancoder/auth.json

# 重新登录
pa-skills auth login
```

### 测试认证接口

```bash
# 测试登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试登出（需要先登录获取 token）
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ❓ 常见问题

### Q1: 登录后还是提示未认证？

**A:** 确保：
1. 环境变量设置正确
2. 认证文件已创建：`~/.pingancoder/auth.json`
3. Token 未过期（24 小时有效期）

检查方法：
```bash
# 查看环境变量
echo $PINGANCODER_API_URL

# 查看认证状态
pa-skills auth status

# 查看认证文件
cat ~/.pingancoder/auth.json
```

### Q2: 如何切换用户？

**A:** 重新登录即可：
```bash
pa-skills auth logout
pa-skills auth login
```

### Q3: Token 过期了怎么办？

**A:** 重新登录：
```bash
pa-skills auth login
```

Token 有效期为 24 小时，过期后需要重新登录。

### Q4: Mock 数据可以修改吗？

**A:** 可以！编辑以下文件：
- `test/mocks/skills-api.mock.ts` - 技能数据
- `test/mock-server.ts` - Mock 用户（第 19-26 行）

修改后重启 Mock 服务器。

---

## 🎯 快速参考

### 环境设置
```bash
export PINGANCODER_API_URL=http://localhost:3000
```

### 登录命令
```bash
pa-skills auth login
# 用户名: admin
# 密码: admin123
```

### 测试命令
```bash
pa-skills find react    # 搜索技能
pa-skills add 1         # 添加技能
pa-skills list          # 列出技能
pa-skills auth status   # 查看状态
```

---

## 📊 系统架构

```
┌─────────────┐
│  CLI 客户端  │
└──────┬──────┘
       │
       ├─ 1. 配置环境变量
       │   PINGANCODER_API_URL=http://localhost:3000
       │
       ├─ 2. 登录
       │   POST /auth/login
       │   返回: { token, expiresIn, username }
       │   保存到: ~/.pingancoder/auth.json
       │
       ├─ 3. 获取技能
       │   GET /api/skills/list
       │   GET /resource/download/{id}
       │   Header: Authorization: Bearer {token}
       │
       └─ 4. 安装技能
           安装到: .pingancoder/skills/{skill-name}
```

---

## ✨ 总结

**现在的状态：**
- ✅ Mock 服务器运行中
- ✅ 支持用户登录
- ✅ 支持完整的技能管理流程
- ✅ 认证逻辑已恢复

**下一步：**
1. 配置环境变量
2. 登录（使用测试账号）
3. 测试完整功能

**准备好了吗？开始测试吧！** 🚀
