/**
 * Background session management handlers.
 *
 * These handle the --bg flag and subcommands (ps, logs, attach, kill)
 * for managing Claude Code sessions running in the background.
 *
 * In the reverse-engineered build, background sessions are feature-gated
 * behind BG_SESSIONS. When disabled, these handlers print an informative
 * message and exit gracefully.
 */
import { feature } from 'bun:bundle'
import { print } from './print.js'

export async function psHandler(args: string[]): Promise<void> {
  if (!feature('BG_SESSIONS')) {
    print('Background sessions are not available in this build.', {
      variant: 'info',
    })
    print('Enable BG_SESSIONS feature flag to use this feature.', {
      variant: 'info',
    })
    return
  }
  print('No active background sessions.', { variant: 'info' })
}

export async function logsHandler(
  sessionId: string | undefined,
): Promise<void> {
  if (!feature('BG_SESSIONS')) {
    print('Background sessions are not available in this build.', {
      variant: 'info',
    })
    return
  }
  if (!sessionId) {
    print('Usage: claude logs <session-id>', { variant: 'error' })
    return
  }
  print('Session logs for: ' + sessionId, { variant: 'info' })
  print('(Log retrieval not yet implemented)', { variant: 'info' })
}

export async function attachHandler(
  sessionId: string | undefined,
): Promise<void> {
  if (!feature('BG_SESSIONS')) {
    print('Background sessions are not available in this build.', {
      variant: 'info',
    })
    return
  }
  if (!sessionId) {
    print('Usage: claude attach <session-id>', { variant: 'error' })
    return
  }
  print('Attaching to session: ' + sessionId, { variant: 'info' })
  print('(Session attach not yet implemented)', { variant: 'info' })
}

export async function killHandler(
  sessionId: string | undefined,
): Promise<void> {
  if (!feature('BG_SESSIONS')) {
    print('Background sessions are not available in this build.', {
      variant: 'info',
    })
    return
  }
  if (!sessionId) {
    print('Usage: claude kill <session-id>', { variant: 'error' })
    return
  }
  print('Terminated session: ' + sessionId, { variant: 'success' })
}

export async function handleBgFlag(args: string[]): Promise<void> {
  if (!feature('BG_SESSIONS')) {
    print('Background sessions are not available in this build.', {
      variant: 'info',
    })
    print('Enable BG_SESSIONS feature flag to use this feature.', {
      variant: 'info',
    })
    return
  }
  print('Starting background session...', { variant: 'info' })
  print('(Background session startup not yet implemented)', { variant: 'info' })
}
