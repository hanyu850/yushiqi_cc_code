import type { Attachment } from '../../utils/attachments.js'
import type { Message } from '../../types/message.js'
import type { ToolUseContext } from '../../Tool.js'
import { getSkillToolCommands } from '../../commands.js'
import { getProjectRoot } from '../../bootstrap/state.js'
import { logForDebugging } from '../../utils/debug.js'

/**
 * Start a background prefetch of skill discovery data.
 * Runs in parallel with the main query to warm the skill index.
 *
 * Returns a promise that resolves to an array of skill attachments
 * that can be injected into the conversation as "Skills relevant to
 * your task:" reminders.
 */
export async function startSkillDiscoveryPrefetch(
  input: string | null,
  _messages: Message[],
  _toolUseContext: ToolUseContext,
): Promise<Attachment[]> {
  if (!input) return []

  try {
    const projectRoot = getProjectRoot()
    const skills = await getSkillToolCommands(projectRoot)

    if (skills.length === 0) return []

    // Filter skills that match the user's input
    const queryTerms = input.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    if (queryTerms.length === 0) return []

    const matchingSkills = skills.filter(cmd => {
      const searchText = [
        cmd.name.toLowerCase(),
        cmd.description?.toLowerCase() || '',
        cmd.whenToUse?.toLowerCase() || '',
      ].join(' ')
      return queryTerms.some(term => searchText.includes(term))
    })

    if (matchingSkills.length === 0) return []

    const skillLines = matchingSkills.map(
      cmd =>
        `- ${cmd.name}: ${cmd.whenToUse || cmd.description || 'No description'}`,
    )

    return [
      {
        type: 'text',
        text:
          `Skills relevant to your task:\n${skillLines.join('\n')}\n\n` +
          `Use the Skill tool to invoke any of these. ` +
          `Call DiscoverSkills if you need skills for a different task.`,
      } as Attachment,
    ]
  } catch (err) {
    logForDebugging(
      `Skill prefetch failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    return []
  }
}

/**
 * Collect the result of a background prefetch.
 * Simply awaits the pending promise and returns its result.
 */
export async function collectSkillDiscoveryPrefetch(
  pending: Promise<Attachment[]>,
): Promise<Attachment[]> {
  try {
    return await pending
  } catch {
    return []
  }
}

/**
 * Get initial skill discovery attachment for the first turn.
 * Called before the first query to seed skill suggestions.
 */
export async function getTurnZeroSkillDiscovery(
  input: string,
  messages: Message[],
  context: ToolUseContext,
): Promise<Attachment | null> {
  const attachments = await startSkillDiscoveryPrefetch(input, messages, context)
  if (attachments.length === 0) return null
  return attachments[0] || null
}
