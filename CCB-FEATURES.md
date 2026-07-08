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
| 默认 | **自动判断**（无需手动设置） |
| 作用 | 为不支持 Prompt Caching 的模型自动削减提示词和工具数量 |
| 节省 | **每轮 15600 → 2600 tokens，省 83%** |

### 自动判断逻辑

CCB 会根据你的 API 提供商自动决定是否启用瘦身模式：

| 你的 API | 判断 | 说明 |
|------|------|------|
| Anthropic 官方 / DeepSeek | **完整模式** | 原生支持 `cache_control`，无需瘦身 |
| 千问 / OpenAI 兼容 | **自动瘦身** | 不支持缓存，自动削减 |
| Gemini | **自动瘦身** | 缓存机制不兼容 |
| AWS Bedrock / Vertex | **完整模式** | 有自身缓存 |

**不需要手动设置任何东西**。用千问自动省 token，用 DeepSeek 自动全功能。

### 手动覆盖

```bash
# 强制开启瘦身（无论什么模型）
CCB_SIMPLE_PROMPT=1 ccb

# 强制关闭瘦身（千问也发完整 prompt — 费 token 但功能全）
CCB_SIMPLE_PROMPT=0 ccb
```

### 瘦身 vs 完整对比

| | 完整模式 | 瘦身模式 |
|------|------|------|
| 系统提示词 | ~3600 tokens | ~400 tokens |
| 工具数量 | 61个 | 11个核心 |
| 工具 tokens | ~12000 | ~2200 |
| **每轮总计** | **~15600** | **~2600** |

### 瘦身后保留的工具

Bash、Read、Edit、Write、Glob、Grep、TodoWrite、TaskCreate、TaskStop、WebFetch、REPL

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
