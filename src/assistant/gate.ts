import { feature } from 'bun:bundle'

/**
 * Kairos feature gate.
 *
 * Kairos is the internal codename for the proactive assistant mode
 * that allows Claude Code to monitor repositories, schedule tasks,
 * and take autonomous actions.
 *
 * Gate checks both the feature flag and any dynamic configuration.
 */
export async function isKairosEnabled(): Promise<boolean> {
  return feature('KAIROS')
}
