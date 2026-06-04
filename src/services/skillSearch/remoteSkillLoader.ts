import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { logForDebugging } from '../../utils/debug.js'

export interface RemoteSkillLoadResult {
  cacheHit: boolean
  latencyMs: number
  skillPath: string
  content: string
  fileCount?: number
  totalBytes?: number
  fetchMethod?: string
}

const CACHE_DIR = join(homedir(), '.claude', 'skill-cache')

function getCachePath(slug: string): string {
  return join(CACHE_DIR, slug + '.md')
}

/**
 * Load a remote skill from a URL.
 *
 * Checks a local cache first (~/.claude/skill-cache/<slug>.md).
 * On cache miss, fetches from the URL and caches the result.
 *
 * Supported URL schemes:
 * - https://, http:// — Standard HTTP fetch
 * - file:// — Local file system path (for bundled/testing)
 * - gs://, s3:// — Cloud storage (stubbed — returns empty content)
 */
export async function loadRemoteSkill(
  slug: string,
  url: string,
): Promise<RemoteSkillLoadResult> {
  const startTime = Date.now()
  const cachePath = getCachePath(slug)

  // Check local cache first
  try {
    if (existsSync(cachePath)) {
      const content = readFileSync(cachePath, 'utf8')
      const latencyMs = Date.now() - startTime
      logForDebugging(
        `RemoteSkill: cache hit for ${slug} (${latencyMs}ms, ${content.length} chars)`,
      )
      return {
        cacheHit: true,
        latencyMs,
        skillPath: cachePath,
        content,
        fetchMethod: 'cache',
      }
    }
  } catch {
    // Cache read error — proceed to fetch
  }

  // Fetch from URL
  let content: string
  let fetchMethod: string

  try {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      content = await response.text()
      fetchMethod = 'http'
    } else if (url.startsWith('file://')) {
      const filePath = url.replace('file://', '')
      content = readFileSync(filePath, 'utf8')
      fetchMethod = 'file'
    } else {
      // Cloud storage schemes (gs://, s3://) — not implemented in reverse-engineered build
      logForDebugging(
        `RemoteSkill: unsupported URL scheme for ${slug}: ${url}`,
      )
      return {
        cacheHit: false,
        latencyMs: Date.now() - startTime,
        skillPath: '',
        content: '',
        fetchMethod: 'unsupported',
      }
    }

    // Cache the result
    try {
      mkdirSync(CACHE_DIR, { recursive: true })
      writeFileSync(cachePath, content, 'utf8')
    } catch (err) {
      logForDebugging(
        `RemoteSkill: failed to cache ${slug}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    const latencyMs = Date.now() - startTime
    logForDebugging(
      `RemoteSkill: fetched ${slug} via ${fetchMethod} (${latencyMs}ms, ${content.length} chars)`,
    )

    return {
      cacheHit: false,
      latencyMs,
      skillPath: cachePath,
      content,
      fileCount: 1,
      totalBytes: content.length,
      fetchMethod,
    }
  } catch (err) {
    const latencyMs = Date.now() - startTime
    logForDebugging(
      `RemoteSkill: failed to load ${slug}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return {
      cacheHit: false,
      latencyMs,
      skillPath: '',
      content: '',
      fetchMethod: 'error',
    }
  }
}
