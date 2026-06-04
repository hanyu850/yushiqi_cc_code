/**
 * Local skill search indexing and cache management.
 *
 * The skill index is a memoized, lazily-built map of all available skills
 * (bundled, project, plugin, MCP) keyed by name. It is rebuilt when commands
 * or skills change. clearSkillIndexCache() invalidates the memoized index
 * so it will be rebuilt on the next access.
 */

let skillIndexCache: Map<string, { name: string; description: string }> | null = null

/**
 * Clear the memoized skill index cache.
 * Call this when commands or skills are added/removed at runtime
 * (e.g., after plugin install, skill discovery, or config change).
 */
export function clearSkillIndexCache(): void {
  skillIndexCache = null
}

/**
 * Get the current skill index cache state (for testing).
 * Returns null if cache is cleared.
 * @internal
 */
export function getSkillIndexCache(): Map<string, { name: string; description: string }> | null {
  return skillIndexCache
}

/**
 * Set the skill index cache (for pre-loading).
 * @internal
 */
export function setSkillIndexCache(
  cache: Map<string, { name: string; description: string }>,
): void {
  skillIndexCache = cache
}
