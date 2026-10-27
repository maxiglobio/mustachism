'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let configured = false

/** Registers GSAP plugins once and applies the site-wide ScrollTrigger config. */
export function configureScrollTrigger() {
  if (configured || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, SplitText)
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  })
  configured = true
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isNarrowViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

/**
 * Calls `handler` only when the viewport width actually changes. Mobile browsers fire
 * `resize` when the URL bar collapses (height-only); those are ignored.
 */
export function onWidthChange(handler: () => void, debounceMs = 150) {
  let lastWidth = window.innerWidth
  let timer = 0
  const listener = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      const width = window.innerWidth
      if (width === lastWidth) return
      lastWidth = width
      handler()
    }, debounceMs)
  }
  window.addEventListener('resize', listener, { passive: true })
  return () => {
    window.clearTimeout(timer)
    window.removeEventListener('resize', listener)
  }
}

export { gsap, ScrollTrigger, SplitText }
