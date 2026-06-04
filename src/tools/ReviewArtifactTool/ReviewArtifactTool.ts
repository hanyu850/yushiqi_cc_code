import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { feature } from 'bun:bundle'
import type { Tool, ToolDef, ToolResult, ToolUseContext, ValidationResult } from 'src/Tool.js'
import { buildTool } from 'src/Tool.js'
import { logForDebugging } from 'src/utils/debug.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { z } from 'zod/v4'

export const REVIEW_ARTIFACT_TOOL_NAME = 'ReviewArtifact'

export const inputSchema = lazySchema(() =>
  z.object({
    artifact_type: z
      .string()
      .describe('Type of artifact to review (e.g., "code", "document", "design")'),
    description: z
      .string()
      .describe('Description of what to review and what to look for'),
    artifact_content: z
      .string()
      .optional()
      .describe('The content of the artifact to review (if not in the conversation)'),
    review_criteria: z
      .array(z.string())
      .optional()
      .describe('Specific criteria to evaluate against'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export const outputSchema = lazySchema(() =>
  z.object({
    artifact_type: z.string(),
    summary: z.string().describe('Brief summary of the review'),
    findings: z.array(
      z.object({
        severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
        category: z.string(),
        description: z.string(),
        location: z.string().optional(),
        recommendation: z.string().optional(),
      }),
    ),
    overall_assessment: z.enum(['approved', 'needs_work', 'rejected']),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const ReviewArtifactTool: Tool<InputSchema, Output, void> = buildTool({
  name: REVIEW_ARTIFACT_TOOL_NAME,
  searchHint: 'review code, documents, or other artifacts',
  maxResultSizeChars: 100_000,
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },

  description: async ({ artifact_type, description }) =>
    'Review ' + artifact_type + ': ' + description,

  prompt: async () =>
    'Review artifacts (code, documents, designs) against specified criteria. ' +
    'Use this tool when the user asks for a review or when you want to verify ' +
    'work against quality standards. Consider correctness, completeness, style, ' +
    'security, performance, and maintainability based on the artifact type.',

  isEnabled: () => feature('REVIEW_ARTIFACT'),

  async validateInput({ artifact_type, description }, _context): Promise<ValidationResult> {
    if (!artifact_type || artifact_type.trim().length === 0) {
      return { result: false, message: 'artifact_type is required', errorCode: 1 }
    }
    if (!description || description.trim().length === 0) {
      return { result: false, message: 'description is required', errorCode: 2 }
    }
    return { result: true }
  },

  async call(
    { artifact_type, description, artifact_content, review_criteria },
    context,
  ): Promise<ToolResult<Output>> {
    logForDebugging(
      'ReviewArtifact: reviewing ' +
        artifact_type +
        ' - ' +
        description,
    )

    return {
      data: {
        artifact_type,
        summary: 'Review of ' + artifact_type + ': ' + description,
        findings: [],
        overall_assessment: 'needs_work',
      },
    }
  },

  mapToolResultToToolResultBlockParam(
    result: Output,
    toolUseID: string,
  ): ToolResultBlockParam {
    const lines: string[] = [
      '## Review: ' + result.artifact_type,
      '',
      '**Summary**: ' + result.summary,
      '',
      '**Overall Assessment**: ' + result.overall_assessment.toUpperCase(),
      '',
    ]

    if (result.findings.length > 0) {
      lines.push('### Findings')
      lines.push('')
      for (const finding of result.findings) {
        lines.push(
          '- [' +
            finding.severity.toUpperCase() +
            '] ' +
            finding.category +
            ': ' +
            finding.description,
        )
        if (finding.location) {
          lines.push('  Location: ' + finding.location)
        }
        if (finding.recommendation) {
          lines.push('  Recommendation: ' + finding.recommendation)
        }
      }
    }

    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseID,
      content: lines.join('\n'),
    }
  },

  renderToolUseMessage: undefined,
  renderToolUseProgressMessage: undefined,
  renderToolUseRejectedMessage: undefined,
  renderToolUseErrorMessage: undefined,
  renderToolResultMessage: undefined,
} satisfies ToolDef<InputSchema, Output, void>)
