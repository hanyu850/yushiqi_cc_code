export { DISCOVER_SKILLS_TOOL_NAME } from './constants.js'

import { DISCOVER_SKILLS_TOOL_NAME } from './constants.js'

export const DISCOVER_SKILLS_TOOL_DESCRIPTION = `Discover relevant skills for a specific task or workflow. Skills are modular, reusable prompt templates that extend Claude's capabilities with specialized knowledge, workflows, or tool integrations.

When to use:
- You're starting a task that goes beyond basic file editing/searching
- The auto-surfaced skills don't cover your current task
- You're doing a mid-task pivot to a new workflow
- You need to find domain-specific skills (e.g., deployment, testing, documentation)

Provide a specific description of what you're trying to accomplish. The tool searches across bundled skills, project skills (.claude/skills/), and plugin skills, returning the most relevant matches with their descriptions and when-to-use guidance.

Only skills matching your description are returned; skills already visible in "Skills relevant to your task:" reminders are automatically filtered out.`

export function getPrompt(): string {
  return `Search across available skills to discover ones relevant to your current task. Use this when the auto-surfaced skills don't cover what you need to do next.

Query tips:
- Be specific about what you're trying to accomplish (e.g., "deploy to AWS", "generate API docs", "set up CI/CD")
- Include technical context like frameworks, platforms, or file types
- Use natural language — the search matches against skill descriptions and use-case guidance

Results include the skill name, description, and when-to-use guidance so you can determine which skill to invoke via ${DISCOVER_SKILLS_TOOL_NAME}.`
}
