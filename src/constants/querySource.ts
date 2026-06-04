/**
 * Query source identifiers used for telemetry and routing.
 *
 * Each query in Claude Code has a source that indicates how it was
 * initiated — by the user in the REPL, by a slash command, by a
 * subagent, by a hook, etc. This type is a union of string literals
 * covering all known query sources.
 */
export type QuerySource =
  | 'repl'           // Direct user input in the REPL
  | 'slash_command'  // Invoked via /command
  | 'agent:custom'   // Custom sub-agent invocation
  | 'agent:explore'  // Explore sub-agent
  | 'agent:plan'     // Plan-mode sub-agent
  | 'agent:general'  // General-purpose sub-agent
  | 'agent:verify'   // Verification sub-agent
  | 'agent:review'   // Review sub-agent
  | 'hook'           // Triggered by a hook
  | 'cron'           // Scheduled/cron task
  | 'bridge'         // Remote control / bridge
  | 'assistant'      // Kairos/proactive assistant
  | 'compact'        // Auto-compact continuation
  | 'fork'           // Forked session
  | 'task'           // Task-based invocation
  | 'workflow'       // Workflow script invocation
  | 'init'           // Initial system message
  | string           // Allow custom/unknown sources
