export const PRODUCT_URL = 'https://claude.com/claude-code'

// CCB — Feature toggle / restriction control
// Set CCB_UNLOCK_ALL=1 to enable all features regardless of USER_TYPE
// Set CCB_SKIP_AUTH=1 to bypass OAuth login (API key direct mode)
// Set CCB_NO_TELEMETRY=1 to disable analytics/Sentry/GrowthBook
// CCB_SIMPLE_PROMPT: 不设置=自动判断, =1=强制瘦身, =0=强制完整
export const CCB_UNLOCK_ALL = process.env.CCB_UNLOCK_ALL === '1'
export const CCB_SKIP_AUTH = process.env.CCB_SKIP_AUTH === '1' || CCB_UNLOCK_ALL
export const CCB_NO_TELEMETRY = process.env.CCB_NO_TELEMETRY === '1' || CCB_UNLOCK_ALL

// Auto-detect slim prompt: only enable for providers without prompt caching
// DeepSeek / Anthropic firstParty → supports cache_control → full prompt
// OpenAI-compatible (千问 etc.) → no cache_control → slim mode
export let CCB_SIMPLE_PROMPT: boolean
{
  const explicit = process.env.CCB_SIMPLE_PROMPT
  if (explicit === '1') {
    CCB_SIMPLE_PROMPT = true
  } else if (explicit === '0') {
    CCB_SIMPLE_PROMPT = false
  } else {
    // Auto-detect from provider
    const modelType = process.env.CLAUDE_CODE_MODEL_TYPE ||
      (process.env.OPENAI_BASE_URL ? 'openai' : '') ||
      (process.env.GEMINI_BASE_URL ? 'gemini' : '')
    const useBedrock = process.env.CLAUDE_CODE_USE_BEDROCK === '1'
    const useVertex = process.env.CLAUDE_CODE_USE_VERTEX === '1'
    const baseUrl = process.env.ANTHROPIC_BASE_URL || ''

    // DeepSeek base URL patterns support prompt caching
    const isDeepSeek = baseUrl.includes('deepseek')
    // Anthropic native or DeepSeek → caching supported → full prompt
    const hasCacheSupport = !modelType && !useBedrock && !useVertex &&
      (!baseUrl || isDeepSeek || baseUrl.includes('api.anthropic.com'))

    CCB_SIMPLE_PROMPT = !hasCacheSupport
  }
}

/**
 * Check if a feature should be enabled regardless of USER_TYPE.
 * When CCB_UNLOCK_ALL=1, all ant-only features are available to everyone.
 */
export function isCcbFeatureUnlocked(): boolean {
  return CCB_UNLOCK_ALL || process.env.USER_TYPE === 'ant'
}

// Claude Code Remote session URLs
export const CLAUDE_AI_BASE_URL = 'https://claude.ai'
export const CLAUDE_AI_STAGING_BASE_URL = 'https://claude-ai.staging.ant.dev'
export const CLAUDE_AI_LOCAL_BASE_URL = 'http://localhost:4000'

/**
 * Determine if we're in a staging environment for remote sessions.
 * Checks session ID format and ingress URL.
 */
export function isRemoteSessionStaging(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  return (
    sessionId?.includes('_staging_') === true ||
    ingressUrl?.includes('staging') === true
  )
}

/**
 * Determine if we're in a local-dev environment for remote sessions.
 * Checks session ID format (e.g. `session_local_...`) and ingress URL.
 */
export function isRemoteSessionLocal(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  return (
    sessionId?.includes('_local_') === true ||
    ingressUrl?.includes('localhost') === true
  )
}

/**
 * Get the base URL for Claude AI based on environment.
 */
export function getClaudeAiBaseUrl(
  sessionId?: string,
  ingressUrl?: string,
): string {
  if (isRemoteSessionLocal(sessionId, ingressUrl)) {
    return CLAUDE_AI_LOCAL_BASE_URL
  }
  if (isRemoteSessionStaging(sessionId, ingressUrl)) {
    return CLAUDE_AI_STAGING_BASE_URL
  }
  return CLAUDE_AI_BASE_URL
}

/**
 * Get the full session URL for a remote session.
 *
 * The cse_→session_ translation is a temporary shim gated by
 * tengu_bridge_repl_v2_cse_shim_enabled (see isCseShimEnabled). Worker
 * endpoints (/v1/code/sessions/{id}/worker/*) want `cse_*` but the claude.ai
 * frontend currently routes on `session_*` (compat/convert.go:27 validates
 * TagSession). Same UUID body, different tag prefix. Once the server tags by
 * environment_kind and the frontend accepts `cse_*` directly, flip the gate
 * off. No-op for IDs already in `session_*` form. See toCompatSessionId in
 * src/bridge/sessionIdCompat.ts for the canonical helper (lazy-required here
 * to keep constants/ leaf-of-DAG at module-load time).
 */
export function getRemoteSessionUrl(
  sessionId: string,
  ingressUrl?: string,
): string {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { toCompatSessionId } =
    require('../bridge/sessionIdCompat.js') as typeof import('../bridge/sessionIdCompat.js')
  /* eslint-enable @typescript-eslint/no-require-imports */
  const compatId = toCompatSessionId(sessionId)
  const baseUrl = getClaudeAiBaseUrl(compatId, ingressUrl)
  return `${baseUrl}/code/${compatId}`
}
