import { certifications } from './certifications'
import { experience } from './experience'
import type { ProofPoint } from './types'

/** Whole years elapsed from `startedAt` to `now`, floored (an anniversary not yet reached this year doesn't count). */
function yearsSince(startedAt: string, now: Date): number {
  const start = new Date(startedAt)
  let years = now.getFullYear() - start.getFullYear()

  const anniversaryThisYear = new Date(start)
  anniversaryThisYear.setFullYear(now.getFullYear())
  if (now < anniversaryThisYear) years -= 1

  return years
}

/**
 * Builds the proof-strip figures. The certification count and the tenure are derived
 * from `certifications` and `experience.startedAt` rather than hardcoded, so adding a
 * certification or letting time pass keeps the strip honest on its own.
 */
export function buildProofPoints(now: Date = new Date()): ProofPoint[] {
  return [
    { prefix: '~', value: 40, suffix: '%', label: ['Faster', 'deploys'] },
    { prefix: '~', value: 30, suffix: '%', label: ['Lower AWS', 'spend'] },
    { value: yearsSince(experience.startedAt, now), suffix: 'yrs', label: ['Production', 'platforms'] },
    { value: certifications.length, label: ['CKA · CKAD', 'AWS'] },
  ]
}
