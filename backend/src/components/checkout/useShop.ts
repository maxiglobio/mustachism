'use client'

import { useEffect, useState } from 'react'
import { api, type PackageId, type ShopPackage } from '@/lib/client/api'

/** Loads the Basic / Pro packages from Shopify. `configured: false` → demo checkout flow. */
export function useShop() {
  const [packages, setPackages] = useState<ShopPackage[]>([])
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [selectedId, setSelectedId] = useState<PackageId>('basic')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getPackages()
      .then((r) => {
        setConfigured(r.configured)
        setPackages(r.packages)
        // The homepage links to /order?package=basic|pro.
        const wanted = new URLSearchParams(window.location.search).get('package')
        if (r.packages.some((p) => p.id === wanted)) setSelectedId(wanted as PackageId)
        else if (r.packages.length && !r.packages.some((p) => p.id === 'basic')) setSelectedId(r.packages[0].id)
      })
      .catch(() => {
        setConfigured(true)
        setError('The shop is unavailable right now. Please try again shortly.')
      })
  }, [])

  const selected = packages.find((p) => p.id === selectedId) ?? null
  return { packages, configured, selected, selectedId, select: setSelectedId, error }
}

export type Shop = ReturnType<typeof useShop>
