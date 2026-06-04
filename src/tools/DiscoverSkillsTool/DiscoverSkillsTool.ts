import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { getProjectRoot } from 'src/bootstrap/state.js'
import {
  getSkillToolCommands,
  getSlashCommandToolSkills,
} from 'src/commands.js'
import type { Tool, ToolDef, ToolResult, ToolUseContext, ValidationResult } from 'src/Tool.js'
import { buildTool } from 'src/Tool.js'
import { logForDebugging } from 'src/utils/debug.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { z } from 'zod/v4'
import {
  DISCOVER_SKILLS_TOOL_NAME,
  getPrompt,
} from './prompt.js'

export const inputSchema = lazySchema(() =>
  z.object({
    description: z
      .string()
      .describe(
        'Description of what you are trying to accomplish. Be specific about the task, workflow, or domain.',
      ),
    max_results: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of skills to return (default: 10)'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export const outputSchema = lazySchema(() =>
  z.object({
    query: z.string().describe('The search query used'),
    skills: z.array(
      z.object({
        name: z.string().describe('Skill name (use with Skill tool)'),
        description: z.string().describe('What the skill does'),
        whenToUse: z.string().optional().describe('Guidance on when to use this skill'),
        source: z.string().describe('Where the skill comes from'),
      }),
    ),
    total_available: z.number().describe('Total number of skills available'),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>
export type Output = z.infer<OutputSchema>

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function scoreSkillRelevance(
  query: string,
  skill: { name: string; description: string; whenToUse?: string },
): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1)
  if (queryTerms.length === 0) return 0

  const searchText = [
    skill.name.toLowerCase(),
    skill.description.toLowerCase(),
    skill.whenToUse?.toLowerCase() || '',
  ].join(' ')

  let score = 0
  for (const term of queryTerms) {
    const regex = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i')
    if (regex.test(searchText)) {
      score += 2
    } else if (searchText.includes(term)) {
      score += 1
    }
  }

  if (skill.name.toLowerCase().includes(query.toLowerCase())) {
    score += 3
  }

  return score
}

export const DiscoverSkillsTool: Tool<InputSchema, Output, void> = buildTool({
  name: DISCOVER_SKILLS_TOOL_NAME,
  searchHint: 'discover relevant skills for a task',
  maxResultSizeChars: 50_000,
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },

  description: async ({ description }) =>
    'Discover skills for: ' + description,

  prompt: async () => getPrompt(),

  async validateInput({ description }, _context): Promise<ValidationResult> {
    if (!description || description.trim().length === 0) {
      return {
        result: false,
        message: 'Description must not be empty',
        errorCode: 1,
      }
    }
    return { result: true }
  },

  async call(
    { description, max_results = 10 },
    context,
  ): Promise<ToolResult<Output>> {
    const projectRoot = getProjectRoot()
    const query = description.trim()

    const [skillToolCommands, slashCommandSkills] = await Promise.all([
      getSkillToolCommands(projectRoot).catch(err => {
        logForDebugging(
          'DiscoverSkills: failed to load skill commands: ' +
            (err instanceof Error ? err.message : String(err)),
        )
        return []
      }),
      getSlashCommandToolSkills(projectRoot).catch(err => {
        logForDebugging(
          'DiscoverSkills: failed to load slash command skills: ' +
            (err instanceof Error ? err.message : String(err)),
        )
        return []
      }),
    ])

    const appState = context.getAppState()
    const surfacedSkills = new Set<string>()
    if (appState.invokedSkills) {
      for (const [name] of appState.invokedSkills) {
        surfacedSkills.add(name)
      }
    }

    const allSkillsMap = new Map<
      string,
      { name: string; description: string; whenToUse?: string; source: string }
    >()

    for (const cmd of [...skillToolCommands, ...slashCommandSkills]) {
      if (surfacedSkills.has(cmd.name)) continue
      if (!cmd.description && !cmd.whenToUse) continue

      let source = cmd.source
      if (cmd.loadedFrom === 'skills') source = 'project'
      else if (cmd.loadedFrom === 'plugin') source = 'plugin'
      else if (cmd.loadedFrom === 'bundled') source = 'bundled'
      else if (cmd.loadedFrom === 'mcp') source = 'mcp'

      if (!allSkillsMap.has(cmd.name)) {
        allSkillsMap.set(cmd.name, {
          name: cmd.name,
          description: cmd.description || '',
          whenToUse: cmd.whenToUse,
          source,
        })
      }
    }

    const scored = Array.from(allSkillsMap.values())
      .map(skill => ({
        ...skill,
        score: scoreSkillRelevance(query, skill),
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max_results)

    logForDebugging(
      'DiscoverSkills: query="' +
        query +
        '" matched ' +
        scored.length +
        ' skills (from ' +
        allSkillsMap.size +
        ' total)',
    )

    return {
      data: {
        query,
        skills: scored.map(({ name, description, whenToUse, source }) => ({
          name,
          description,
          whenToUse,
          source,
        })),
        total_available: allSkillsMap.size,
      },
    }
  },

  mapToolResultToToolResultBlockParam(
    result: Output,
    toolUseID: string,
  ): ToolResultBlockParam {
    if (result.skills.length === 0) {
      return {
        type: 'tool_result' as const,
        tool_use_id: toolUseID,
        content:
          'No matching skills found for "' +
          result.query +
          '". Try broadening your search terms.',
      }
    }

    const skillList = result.skills
      .map(s => {
        let entry =
          '**' + s.name + '** (' + s.source + ')\n  ' + s.description
        if (s.whenToUse) entry += '\n  When to use: ' + s.whenToUse
        return entry
      })
      .join('\n\n')

    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseID,
      content:
        'Found ' +
        result.skills.length +
        ' relevant skill(s):\n\n' +
        skillList +
        '\n\nUse the Skill tool with the skill name to invoke.',
    }
  },

  renderToolUseMessage: undefined,
  renderToolUseProgressMessage: undefined,
  renderToolUseRejectedMessage: undefined,
  renderToolUseErrorMessage: undefined,
  renderToolResultMessage: undefined,
} satisfies ToolDef<InputSchema, Output, void>)
