/**
 * Remote skill state management.
 *
 * Remote skills are skills loaded from a remote registry (e.g., a skill
 * marketplace or internal skill repository). They are identified by a
 * canonical slug prefixed with '_canonical_'.
 *
 * When the model discovers a remote skill via DiscoverSkills, its metadata
 * (slug → URL mapping) is stored here so SkillTool can load it on invocation.
 */

const CANONICAL_PREFIX = '_canonical_'

/** Map of discovered remote skill slug → metadata */
const discoveredRemoteSkills = new Map<string, { url: string }>()

/**
 * Strip the canonical prefix from a skill name.
 * Returns the slug without the prefix, or null if the name doesn't have it.
 *
 * @example stripCanonicalPrefix('_canonical_my-skill') // 'my-skill'
 * @example stripCanonicalPrefix('my-skill') // null
 */
export function stripCanonicalPrefix(name: string): string | null {
  if (name.startsWith(CANONICAL_PREFIX)) {
    return name.slice(CANONICAL_PREFIX.length)
  }
  return null
}

/**
 * Get metadata for a previously discovered remote skill.
 * Returns undefined if the skill was not discovered in this session.
 */
export function getDiscoveredRemoteSkill(
  slug: string,
): { url: string } | undefined {
  return discoveredRemoteSkills.get(slug)
}

/**
 * Register a remote skill as discovered.
 * Called when DiscoverSkills finds a remote skill that the model can use.
 */
export function registerDiscoveredRemoteSkill(
  slug: string,
  url: string,
): void {
  discoveredRemoteSkills.set(slug, { url })
}

/**
 * Get all discovered remote skill slugs.
 */
export function getAllDiscoveredRemoteSkills(): string[] {
  return Array.from(discoveredRemoteSkills.keys())
}

/**
 * Clear all discovered remote skills (for session reset).
 */
export function clearDiscoveredRemoteSkills(): void {
  discoveredRemoteSkills.clear()
}
