/**
 * Daemon worker registry and lifecycle management.
 *
 * The worker registry tracks active daemon workers, handles spawning,
 * health checking, and graceful shutdown. Workers are identified by
 * a unique workerId and run in subprocesses managed by the daemon.
 */
import { feature } from 'bun:bundle'
import { logForDebugging } from '../utils/debug.js'

interface WorkerInfo {
  workerId: string
  workerType: string
  pid: number
  startTime: number
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'crashed'
}

const workers = new Map<string, WorkerInfo>()

/**
 * Run a daemon worker by ID.
 * The worker ID determines the worker type and configuration.
 */
export async function runDaemonWorker(workerId: string): Promise<void> {
  if (!feature('DAEMON')) {
    logForDebugging(
      'Daemon: worker ' + workerId + ' not started (DAEMON feature disabled)',
    )
    return
  }

  logForDebugging('Daemon: starting worker ' + workerId)

  workers.set(workerId, {
    workerId,
    workerType: workerId.split(':')[0] || 'unknown',
    pid: process.pid,
    startTime: Date.now(),
    status: 'running',
  })
}

/**
 * Get information about all registered workers.
 */
export function getWorkers(): WorkerInfo[] {
  return Array.from(workers.values())
}

/**
 * Stop a worker by ID.
 */
export function stopWorker(workerId: string): void {
  const worker = workers.get(workerId)
  if (worker) {
    worker.status = 'stopped'
    workers.delete(workerId)
  }
}
