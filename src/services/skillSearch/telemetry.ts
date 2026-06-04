import { logForDebugging } from '../../utils/debug.js'

export interface RemoteSkillLoadEvent {
  slug: string
  cacheHit: boolean
  latencyMs: number
  urlScheme: string
  error?: string
  fileCount?: number
  totalBytes?: number
  fetchMethod?: string
}

/**
 * Log a remote skill load event for telemetry and debugging.
 * In the reverse-engineered build, this logs to the debug channel.
 */
export function logRemoteSkillLoaded(data: RemoteSkillLoadEvent): void {
  const status = data.error
    ? 'error'
    : data.cacheHit
      ? 'cache_hit'
      : 'cache_miss'
  logForDebugging(
    `RemoteSkill: ${status} slug=${data.slug} scheme=${data.urlScheme} latency=${data.latencyMs}ms` +
      (data.fileCount ? ` files=${data.fileCount}` : '') +
      (data.totalBytes ? ` bytes=${data.totalBytes}` : '') +
      (data.fetchMethod ? ` method=${data.fetchMethod}` : '') +
      (data.error ? ` error=${data.error}` : ''),
  )
}
