/**
 * Assistant mode management.
 *
 * Assistant mode (a.k.a. "Kairos") allows Claude Code to run in an
 * always-on assistant capacity, proactively monitoring and suggesting
 * actions. Feature-gated behind the KAIROS flag.
 *
 * In the reverse-engineered build, assistant mode is disabled by default.
 */

import { feature } from 'bun:bundle'

let assistantForced = false

/** Whether the current session is running in assistant/Kairos mode */
export function isAssistantMode(): boolean {
  return feature('KAIROS') || assistantForced
}

/** Initialize the assistant team (background agents) */
export async function initializeAssistantTeam(): Promise<void> {
  // Team initialization happens when KAIROS is enabled
  // In the reverse-engineered build, this is a no-op
}

/** Force-enable assistant mode for the current session */
export function markAssistantForced(): void {
  assistantForced = true
}

/** Check if assistant mode was force-enabled */
export function isAssistantForced(): boolean {
  return assistantForced
}

/** Get any additional system prompt content for assistant mode */
export function getAssistantSystemPromptAddendum(): string {
  if (!isAssistantMode()) return ''
  return (
    'You are running in assistant mode. You may proactively suggest ' +
    'actions and monitor for issues without explicit user prompting.'
  )
}

/** Get the activation path that triggered assistant mode (if any) */
export function getAssistantActivationPath(): string | undefined {
  if (!isAssistantMode()) return undefined
  return assistantForced ? 'forced' : 'kairos_feature_flag'
}
