/**
 * Template jobs handler.
 *
 * Manages template-based job execution for automated workflows.
 * Feature-gated behind the TEMPLATES flag.
 */
import { feature } from 'bun:bundle'
const print = (msg: string, _opts?: any) => console.log(msg)

export async function templatesMain(args: string[]): Promise<void> {
  if (!feature('TEMPLATES')) {
    print('Template jobs are not available in this build.', {
      variant: 'info',
    })
    return
  }

  const subcommand = args[0]
  if (!subcommand) {
    print('Usage: claude templates <list|run|create>', {
      variant: 'error',
    })
    return
  }

  print('Template jobs feature is not yet fully implemented.', {
    variant: 'info',
  })
}
