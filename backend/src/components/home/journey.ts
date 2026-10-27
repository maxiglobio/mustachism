/**
 * Shared state for the homepage's single 3D card. One card lives in a fixed full-screen layer;
 * the hero, the intro and the features section each write their part of the choreography here,
 * and HomeJourney blends them every frame.
 */
export type Pose = { yaw: number; pitch: number; roll: number; fx: number; fy: number; zoom: number }

export interface JourneyState {
  /** Features camera (written by CardFeatures' scrubbed timeline). */
  feature: Pose
  /** Intro override: weight k (1 = intro owns the card), screen offset (px from viewport centre), zoom, opacity. */
  intro: { k: number; x: number; y: number; zoom: number; opacity: number }
  ready: boolean
}

export function createJourneyState(): JourneyState {
  return {
    feature: { yaw: 0, pitch: 0, roll: 0, fx: 0, fy: 0, zoom: 1 },
    intro: { k: 0, x: 0, y: 0, zoom: 1, opacity: 1 },
    ready: false,
  }
}

/** Card aspect (0.92 × 0.58). */
export const CARD_ASPECT = 0.58 / 0.92

/** Zoom that makes the card fill a hero slot of the given size (with room to tilt). */
export function slotZoom(slot: DOMRect, cardPxWidth: number) {
  if (!cardPxWidth) return 1
  const fit = 0.84
  return Math.min((slot.width * fit) / cardPxWidth, (slot.height * fit) / (cardPxWidth * CARD_ASPECT))
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smooth = (t: number) => t * t * (3 - 2 * t)
