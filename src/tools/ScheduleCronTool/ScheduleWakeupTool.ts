import { z } from 'zod/v4'
import { setScheduledTasksEnabled } from '../../bootstrap/state.js'
import type { ValidationResult } from '../../Tool.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import { addCronTask, getCronFilePath } from '../../utils/cronTasks.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { semanticBoolean } from '../../utils/semanticBoolean.js'
import { isKairosCronEnabled } from './prompt.js'

export const SCHEDULE_WAKEUP_TOOL_NAME = 'ScheduleWakeup'

const MIN_DELAY_S = 60
const MAX_DELAY_S = 3600

const inputSchema = lazySchema(() =>
  z.strictObject({
    delaySeconds: z
      .number()
      .int()
      .min(MIN_DELAY_S)
      .max(MAX_DELAY_S)
      .describe(
        `Seconds from now to wake up. Clamped to [${MIN_DELAY_S}, ${MAX_DELAY_S}] by the runtime.`,
      ),
    reason: z
      .string()
      .describe(
        'One short sentence explaining the chosen delay. Goes to telemetry and is shown to the user.',
      ),
    prompt: z
      .string()
      .describe(
        'The /loop input to fire on wake-up. Pass the same /loop input verbatim each turn so the next firing re-enters the skill and continues the loop. For autonomous /loop (no user prompt), pass the literal sentinel `<<autonomous-loop-dynamic>>` instead.',
      ),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    id: z.string(),
    delaySeconds: z.number(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>
export type ScheduleWakeupOutput = z.infer<OutputSchema>

export const ScheduleWakeupTool = buildTool({
  name: SCHEDULE_WAKEUP_TOOL_NAME,
  searchHint: 'schedule a wakeup callback within this session',
  maxResultSizeChars: 100_000,
  shouldDefer: true,
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  isEnabled() {
    return isKairosCronEnabled()
  },
  toAutoClassifierInput(input) {
    return `${input.delaySeconds}s: ${input.prompt}`
  },
  async description() {
    return `Schedule when to resume work in /loop dynamic mode — the user invoked /loop without an interval, asking you to self-pace iterations of a specific task.`
  },
  async prompt() {
    return `Schedule when to resume work in /loop dynamic mode.

Use ONLY when the user invoked /loop without an interval, asking you to self-pace iterations. Do NOT use for cron-based /loop (use CronCreate for those).

## Parameters

- **delaySeconds**: How long to wait before the wakeup fires. Must be ${MIN_DELAY_S}-${MAX_DELAY_S} seconds. The runtime clamps to this range.
  - Under 5 minutes (${MIN_DELAY_S}s–270s): cache stays warm. Right for actively polling external state the harness can't notify you about — a CI run, a deploy, a remote queue.
  - 5 minutes to 1 hour (300s–${MAX_DELAY_S}s): pay the cache miss. Right when there's no point checking sooner — waiting on something that takes minutes to change, genuinely idle, or as the long fallback heartbeat when something else is the primary wake signal.
  - Don't pick 300s. It's the worst-of-both: you pay the cache miss without amortizing it. Either drop to 270s (stay in cache) or commit to 1200s+ (one cache miss buys a much longer wait).
  - For idle ticks with no specific signal to watch, default to 1200s–1800s (20–30 min).
- **reason**: One short sentence on what you chose and why. Be specific.
- **prompt**: Pass the same /loop input verbatim so the next firing re-enters the skill and continues the loop. For autonomous /loop (no user prompt), pass the literal sentinel \`<<autonomous-loop-dynamic>>\` instead. Omit the call to end the loop.

## Session-only

Jobs live only in this Claude session — nothing is written to disk, and the job is gone when Claude exits.

Returns a job ID you can pass to CronDelete.`
  },
  getPath() {
    return getCronFilePath()
  },
  async validateInput(input): Promise<ValidationResult> {
    const clamped = Math.max(MIN_DELAY_S, Math.min(MAX_DELAY_S, input.delaySeconds))
    if (clamped !== input.delaySeconds) {
      return {
        result: false,
        message: `delaySeconds must be between ${MIN_DELAY_S} and ${MAX_DELAY_S}. Got ${input.delaySeconds}.`,
        errorCode: 1,
      }
    }
    if (!input.prompt || input.prompt.trim().length === 0) {
      return {
        result: false,
        message: 'prompt must not be empty.',
        errorCode: 2,
      }
    }
    return { result: true }
  },
  async call({ delaySeconds, reason, prompt }) {
    const clamped = Math.max(MIN_DELAY_S, Math.min(MAX_DELAY_S, delaySeconds))
    // Schedule as a one-shot cron job: fire once after delaySeconds
    const now = new Date()
    now.setSeconds(now.getSeconds() + clamped)
    const cron = `${now.getMinutes()} ${now.getHours()} ${now.getDate()} ${now.getMonth() + 1} *`
    const id = await addCronTask(cron, prompt, false, false)
    setScheduledTasksEnabled(true)
    return {
      data: {
        id,
        delaySeconds: clamped,
      },
    }
  },
  mapToolResultToToolResultBlockParam(output, toolUseID) {
    const mins = Math.round(output.delaySeconds / 60)
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `Scheduled wakeup ${output.id} in ${mins} min (${output.delaySeconds}s). Session-only — dies when Claude exits. Use CronDelete to cancel sooner.`,
    }
  },
  renderToolUseMessage() {
    return null
  },
  renderToolResultMessage() {
    return null
  },
} satisfies ToolDef<InputSchema, ScheduleWakeupOutput>)
