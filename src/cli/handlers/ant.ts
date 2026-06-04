/**
 * Anthropic-internal CLI handlers (ANT-only).
 *
 * These handlers are only available when USER_TYPE=ant and provide
 * internal task management, log access, and export functionality.
 * In the reverse-engineered build, these are informational stubs.
 */
import { print } from '../print.js'

export async function logHandler(
  logId: string | number | undefined,
): Promise<void> {
  print('ANT log access not available in external build.', {
    variant: 'info',
  })
}

export async function errorHandler(num: number | undefined): Promise<void> {
  print('ANT error log access not available in external build.', {
    variant: 'info',
  })
}

export async function exportHandler(
  source: string,
  outputFile: string,
): Promise<void> {
  print('ANT export not available in external build.', {
    variant: 'info',
  })
  print('Export source: ' + source + ' -> ' + outputFile, {
    variant: 'info',
  })
}

export async function taskCreateHandler(
  subject: string,
  opts: { description?: string; list?: string },
): Promise<void> {
  print('ANT task creation not available in external build.', {
    variant: 'info',
  })
}

export async function taskListHandler(opts: {
  list?: string
  pending?: boolean
  json?: boolean
}): Promise<void> {
  print('ANT task list not available in external build.', {
    variant: 'info',
  })
}

export async function taskGetHandler(
  id: string,
  opts: { list?: string },
): Promise<void> {
  print('ANT task get not available in external build.', {
    variant: 'info',
  })
}

export async function taskUpdateHandler(
  id: string,
  opts: {
    list?: string
    status?: string
    subject?: string
    description?: string
    owner?: string
    clearOwner?: boolean
  },
): Promise<void> {
  print('ANT task update not available in external build.', {
    variant: 'info',
  })
}

export async function taskDirHandler(opts: {
  list?: string
}): Promise<void> {
  print('ANT task directory not available in external build.', {
    variant: 'info',
  })
}

export async function completionHandler(
  shell: string,
  opts: { output?: string },
  _program: unknown,
): Promise<void> {
  print(
    'Shell completion for ' + shell + ' not available in external build.',
    { variant: 'info' },
  )
}
