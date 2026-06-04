/**
 * Environment runner entry point.
 *
 * The environment runner executes Claude Code sessions in isolated
 * environments (Docker containers, sandboxes, etc.). Feature-gated
 * behind BYOC_ENVIRONMENT_RUNNER or SELF_HOSTED_RUNNER.
 */
import { feature } from 'bun:bundle'
import { print } from '../cli/print.js'

export async function environmentRunnerMain(args: string[]): Promise<void> {
  const isByoc = feature('BYOC_ENVIRONMENT_RUNNER')
  const isSelfHosted = feature('SELF_HOSTED_RUNNER')

  if (!isByoc && !isSelfHosted) {
    print('Environment runner is not available in this build.', {
      variant: 'info',
    })
    return
  }

  const runnerType = isByoc ? 'BYOC' : 'Self-hosted'
  print(runnerType + ' environment runner starting...', {
    variant: 'info',
  })

  // Full implementation would:
  // 1. Parse command line arguments for environment config
  // 2. Set up the execution environment (container/sandbox)
  // 3. Run the Claude Code session inside the environment
  // 4. Stream results back to the host

  print('Environment runner not yet fully implemented.', {
    variant: 'info',
  })
}
