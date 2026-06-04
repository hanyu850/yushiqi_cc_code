import { feature } from 'bun:bundle'

/**
 * Check whether experimental skill search is enabled.
 * Gated by the EXPERIMENTAL_SKILL_SEARCH feature flag.
 * When enabled, the DiscoverSkills tool is available and skill discovery
 * attachments are generated each turn.
 */
export function isSkillSearchEnabled(): boolean {
  return feature('EXPERIMENTAL_SKILL_SEARCH')
}
