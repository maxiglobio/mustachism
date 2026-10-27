'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, type LicenseNumber } from '@/lib/client/api'
import {
  categoryLabelFor,
  categoryNumbers,
  LICENSE_CATEGORIES,
  matchesSearch,
  toLicenseNumber,
  type CategoryId,
} from '@/lib/licenses'
import { gsap, prefersReducedMotion } from '@/lib/motion'

const PAGE = 100

type Props = {
  onSelect: (license: LicenseNumber) => void
  selected?: string | null
  autoFocus?: boolean
}

/** Search + categories + grid of available numbers. */
export function LicensePicker({ onSelect, selected, autoFocus }: Props) {
  const [category, setCategory] = useState<CategoryId>('all')
  const [query, setQuery] = useState('')
  const [all, setAll] = useState<LicenseNumber[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [catResults, setCatResults] = useState<LicenseNumber[]>([])
  const [exact, setExact] = useState<LicenseNumber | null>(null)
  const [state, setState] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')
  const gridRef = useRef<HTMLUListElement>(null)

  const loadPage = useCallback(async (from: number) => {
    setState('loading')
    try {
      const { licenses } = await api.fetchLicenses({ status: 'available', limit: PAGE, offset: from })
      setAll((prev) => (from === 0 ? licenses : [...prev, ...licenses]))
      setOffset(from + licenses.length)
      setHasMore(licenses.length === PAGE)
      setState('idle')
    } catch (err) {
      setError((err as Error).message)
      setState('error')
    }
  }, [])

  useEffect(() => {
    loadPage(0)
  }, [loadPage])

  // Category: check each curated number directly instead of paging through the pool.
  useEffect(() => {
    if (category === 'all') return
    let alive = true
    const nums = Array.from(new Set(categoryNumbers(category) ?? []))
    setState('loading')
    Promise.all(nums.map((n) => api.checkLicense(toLicenseNumber(n)!))).then((res) => {
      if (!alive) return
      setCatResults(res.filter((l): l is LicenseNumber => !!l && l.status === 'available'))
      setState('idle')
    })
    return () => {
      alive = false
    }
  }, [category])

  // Exact-number lookup so "20" finds 000-020 even if it isn't loaded yet.
  useEffect(() => {
    const n = toLicenseNumber(query)
    setExact(null)
    if (!n) return
    let alive = true
    const t = window.setTimeout(() => {
      api.checkLicense(n).then((l) => alive && setExact(l && l.status === 'available' ? l : null))
    }, 250)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [query])

  const items = useMemo(() => {
    const source = category === 'all' ? all : catResults
    const list = source.filter((l) => l.status === 'available' && matchesSearch(l.number, query))
    if (exact && !list.some((l) => l.number === exact.number)) list.unshift(exact)
    return list
  }, [all, catResults, category, query, exact])

  // Gentle cascade when results change.
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || prefersReducedMotion()) return
    const cells = Array.from(grid.children).slice(0, 24)
    gsap.fromTo(cells, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.015, overwrite: true })
  }, [category, items.length])

  const showLoadMore = category === 'all' && !query.trim() && hasMore && state !== 'loading'

  return (
    <div className="picker">
      <div className="picker__search">
        <label className="sr-only" htmlFor="license-search">
          Search license numbers
        </label>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="picker__search-icon">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <input
          id="license-search"
          className="input picker__input"
          placeholder="Enter a number (e.g. 000-020 or 20)"
          autoComplete="off"
          inputMode="numeric"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="picker__cats" role="group" aria-label="Categories">
        {LICENSE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {state === 'error' ? (
        <p className="picker__state picker__state--error" role="alert">
          Couldn’t load licenses: {error}
        </p>
      ) : null}

      <ul ref={gridRef} className="picker__grid" aria-busy={state === 'loading'}>
        {items.map((l) => {
          const cat = category === 'all' ? categoryLabelFor(l.number) : null
          const isSel = selected === l.number
          return (
            <li key={l.number}>
              <button
                type="button"
                className="lic"
                aria-pressed={isSel}
                onClick={() => onSelect(l)}
                aria-label={`License ${l.number}${l.priceTier === 'premium' ? ', premium number' : ''}`}
              >
                <span className="lic__num mono">{l.number}</span>
                <span className="lic__tags">
                  {cat ? <span className="lic__tag">{cat}</span> : null}
                  {l.priceTier === 'premium' ? <span className="lic__tag lic__tag--premium">Premium</span> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {state === 'loading' ? (
        <p className="picker__state mono" role="status">
          Loading licenses…
        </p>
      ) : items.length === 0 && state === 'idle' ? (
        <p className="picker__state mono">No available licenses match.</p>
      ) : null}

      {showLoadMore ? (
        <div className="picker__more">
          <button type="button" className="btn btn--ghost" onClick={() => loadPage(offset)}>
            Load more
          </button>
        </div>
      ) : null}
    </div>
  )
}
