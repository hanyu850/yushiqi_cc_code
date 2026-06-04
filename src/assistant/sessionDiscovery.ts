import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { logForDebugging } from '../utils/debug.js'

export interface AssistantSession {
  /** Unique session identifier */
  id: string
  /** Human-readable summary of the session */
  summary?: string
  /** When the session was last modified */
  lastModified?: number
  /** Working directory of the session */
  cwd?: string
  /** Git branch context */
  gitBranch?: string
}

/**
 * Discover assistant/Kairos sessions across all projects.
 *
 * Scans the ~/.claude/projects/ directory for session JSONL files
 * and returns metadata for sessions that were initiated by the
 * assistant (Kairos) mode.
 *
 * Sessions are sorted by lastModified descending (most recent first).
 */
export async function discoverAssistantSessions(): Promise<AssistantSession[]> {
  const sessions: AssistantSession[] = []
  const projectsDir = join(homedir(), '.claude', 'projects')

  try {
    const projectDirs = await readdir(projectsDir, { withFileTypes: true })
    for (const entry of projectDirs) {
      if (!entry.isDirectory()) continue

      const projectPath = join(projectsDir, entry.name)
      try {
        const sessionFiles = await readdir(projectPath)
        for (const file of sessionFiles) {
          if (!file.endsWith('.jsonl')) continue

          const filePath = join(projectPath, file)
          const fileStat = await stat(filePath)
          const sessionId = file.replace('.jsonl', '')

          sessions.push({
            id: sessionId,
            summary: sessionId.slice(0, 8) + '...',
            lastModified: fileStat.mtimeMs,
            cwd: entry.name,
          })
        }
      } catch {
        // Skip unreadable project directories
      }
    }
  } catch {
    // Projects directory doesn't exist or isn't readable
    logForDebugging('Assistant session discovery: no projects directory found')
  }

  // Sort by lastModified descending
  sessions.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))

  return sessions
}
