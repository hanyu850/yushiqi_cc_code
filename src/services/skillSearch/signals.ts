/**
 * Discovery signal types for skill search telemetry.
 * Used to track when skills are discovered by the model.
 */
export type DiscoverySignal = {
  /** The skill name that was discovered */
  skillName: string
  /** How the skill was discovered (search, attachment, slash-command) */
  source: 'search' | 'attachment' | 'slash_command'
  /** The query that led to discovery, if applicable */
  query?: string
  /** Timestamp of discovery */
  timestamp: number
}
