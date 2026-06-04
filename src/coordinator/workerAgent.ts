import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
import { feature } from 'bun:bundle'

/**
 * Coordinator mode worker agent definitions.
 *
 * In coordinator mode, the main agent delegates work to worker agents
 * that run in subprocesses. This module provides the agent definitions
 * for the standard coordinator workers.
 *
 * Feature-gated behind COORDINATOR_MODE.
 */
export function getCoordinatorAgents(): AgentDefinition[] {
  if (!feature('COORDINATOR_MODE')) return []

  // Standard coordinator workers
  return [
    {
      agentType: 'coordinator-worker',
      description:
        'General-purpose worker agent for coordinator mode. ' +
        'Executes delegated tasks in a subprocess.',
      tools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
      prompt:
        'You are a coordinator worker agent. Execute the assigned task ' +
        'efficiently and report results back to the coordinator.',
    },
  ]
}
