# CCB 功能开关配置指南 (v2.2.0+)

所有开关通过**环境变量**控制，设置后重启 CCB 生效。每个开关独立运作。

---

## 🚀 快速全解锁

```bash
CCB_UNLOCK_ALL=1 ccb
```

一键等价于：`CCB_SKIP_AUTH=1` + `CCB_NO_TELEMETRY=1` + `USER_TYPE=ant`

---

## 💰 CCB_SIMPLE_PROMPT（Token 瘦身模式）

| 属性 | 值 |
|------|-----|
| 默认 | 关闭 |
| 作用 | **大幅削减系统提示词和工具数量**，专为不支持 Prompt Caching 的模型设计 |
| 适用模型 | 千问 / DeepSeek V2 / 任何非 Anthropic 原生 API |
| 节省 | **每轮 15600 → 2600 tokens，省 83%** |

```bash
CCB_SIMPLE_PROMPT=1 ccb
```

### 为什么需要

DeepSeek 支持 Anthropic 的 Prompt Caching 机制，首次请求后 system prompt 被缓存，后续几乎免费。千问等模型**不支持此机制**，每轮都重发全部：

| | 默认模式 | 瘦身模式 |
|------|------|------|
| 系统提示词 | ~3600 tokens | ~400 tokens |
| 工具定义 | 61个 (~12000 tokens) | 11个核心 (~2200 tokens) |
| **每轮总计** | **~15600 tokens** | **~2600 tokens** |
| 千问 10 轮对话 | 烧 15.6 万 token | 只烧 2.6 万 token |

### 瘦身后保留的工具

Bash、Read、Edit、Write、Glob、Grep、TodoWrite、TaskCreate、TaskStop、WebFetch、REPL

移除了：Agent、Skill、WebSearch、WebBrowser、NotebookEdit、PlanMode、LSP 等 50 个低频工具。

> 关闭 `CCB_SIMPLE_PROMPT` 后恢复全部 61 个工具和完整系统提示词。

---

## 📋 完整开关列表

### CCB_UNLOCK_ALL（总开关）

| 属性 | 值 |
|------|-----|
| 默认 | 关闭 |
| 作用 | 一键启用全部功能 |

```bash
CCB_UNLOCK_ALL=1 ccb
```

---

### CCB_SKIP_AUTH（跳过登录）

| 属性 | 值 |
|------|-----|
| 默认 | 关闭 |
| 作用 | 跳过 OAuth 登录，直接用 API Key |

```bash
# API Key 直连，无需 /login
ANTHROPIC_API_KEY=sk-ant-xxx CCB_SKIP_AUTH=1 ccb

# OpenAI 兼容接口
OPENAI_API_KEY=sk-xxx CCB_SKIP_AUTH=1 ccb

# Gemini
GEMINI_API_KEY=xxx CCB_SKIP_AUTH=1 ccb

# Bedrock
CLAUDE_CODE_USE_BEDROCK=1 CCB_SKIP_AUTH=1 ccb

# Vertex
CLAUDE_CODE_USE_VERTEX=1 CCB_SKIP_AUTH=1 ccb
```

---

### CCB_NO_TELEMETRY（关闭遥测）

| 属性 | 值 |
|------|-----|
| 默认 | 关闭 |
| 作用 | 禁用 Sentry / GrowthBook / 遥测上报 |

```bash
CCB_NO_TELEMETRY=1 ccb
```

---

### USER_TYPE=ant（解锁内部功能）

| 属性 | 值 |
|------|-----|
| 默认 | 未设置 |
| 作用 | 解锁 Remote Control / Chrome MCP / Voice Mode 等全部命令 |

```bash
USER_TYPE=ant ccb
# 或直接用总开关
CCB_UNLOCK_ALL=1 ccb
```

---

## 🔗 组合示例

### 日常使用（只跳登录）
```bash
CCB_SKIP_AUTH=1 ccb
```

### 内网代理（跳登录 + 关遥测）
```bash
CCB_SKIP_AUTH=1 CCB_NO_TELEMETRY=1 ccb
```
进去 `/login` → Anthropic Compatible → 填代理地址和 Key。

### 零配置直接干活
```bash
ANTHROPIC_API_KEY=sk-ant-xxx CCB_UNLOCK_ALL=1 ccb "写一段代码"
```

### 开发调试全开
```bash
CCB_UNLOCK_ALL=1 FEATURE_BUDDY=1 FEATURE_VOICE_MODE=1 bun run dev
```

---

## ⚙️ 优先级

```
CCB_UNLOCK_ALL=1
  └─ 自动启用: SKIP_AUTH + NO_TELEMETRY + USER_TYPE=ant

单独开关可覆盖 UNLOCK_ALL 的默认值:
  CCB_UNLOCK_ALL=1 CCB_SKIP_AUTH=0  → 只关登录，其他仍开
```

---

## 📂 相关源码

| 文件 | 作用 |
|------|------|
| `src/constants/product.ts` | 开关定义 |
| `src/entrypoints/cli.tsx` | 启动注入 USER_TYPE |
| `src/utils/auth.ts` | 认证绕过逻辑 |
| `scripts/defines.ts` | 版本号管理 |
