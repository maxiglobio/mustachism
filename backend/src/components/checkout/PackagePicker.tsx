'use client'

import { useId } from 'react'
import { formatMoney } from '@/lib/licenses'
import type { Shop } from './useShop'

/** Basic / Pro choice, with names and prices straight from Shopify. */
export function PackagePicker({ shop }: { shop: Shop }) {
  const id = useId()
  if (!shop.configured || !shop.packages.length) return null

  return (
    <fieldset className="field">
      <legend className="field__label">Package</legend>
      <div className="packages" role="radiogroup">
        {shop.packages.map((p) => (
          <label key={p.id} className="package" data-selected={shop.selectedId === p.id}>
            <input
              type="radio"
              name={`${id}-package`}
              value={p.id}
              checked={shop.selectedId === p.id}
              disabled={!p.available}
              onChange={() => shop.select(p.id)}
            />
            <span className="package__name">{p.productTitle}</span>
            <span className="package__price">{formatMoney(p.price, p.currency)}</span>
            {p.description ? <span className="package__desc">{p.description}</span> : null}
            {!p.available ? <span className="package__desc">Sold out</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
