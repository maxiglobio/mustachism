'use client'

import { useId, useRef } from 'react'
import { LICENSE_CLASSES, PREFIXES } from '@/lib/licenses'
import type { LicenseForm } from './useLicenseForm'

export function LicenseFormFields({ form }: { form: LicenseForm }) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const { values, set } = form
  const classHelp = LICENSE_CLASSES.find((c) => c.id === values.licenseClass)?.help

  return (
    <div className="fields">
      <div className="field">
        <label className="field__label" htmlFor={`${id}-prefix`}>
          Prefix
        </label>
        <select
          id={`${id}-prefix`}
          className="input select"
          value={values.prefix}
          onChange={(e) => set('prefix', e.target.value)}
        >
          <option value="">None</option>
          {PREFIXES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-name`}>
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${id}-name`}
          className="input"
          required
          autoComplete="name"
          placeholder="Full name, as it should be engraved"
          maxLength={28}
          value={values.fullName}
          onChange={(e) => set('fullName', e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field__label" htmlFor={`${id}-sex`}>
            Sex <span aria-hidden="true">*</span>
          </label>
          <select
            id={`${id}-sex`}
            className="input select"
            required
            value={values.sex}
            onChange={(e) => set('sex', e.target.value)}
          >
            <option value="">Select</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-dob`}>
            Date of birth <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-dob`}
            className="input"
            type="date"
            required
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            value={values.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <span className="field__label" id={`${id}-photo-label`}>
          Photo <span className="field__optional">(optional)</span>
        </span>
        <div className="photo-field">
          {form.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="photo-field__thumb" src={form.photo.dataUrl} alt="Selected photo" />
          ) : (
            <span className="photo-field__thumb photo-field__thumb--empty" aria-hidden="true" />
          )}
          <div className="photo-field__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
              {form.photo ? 'Replace photo' : 'Upload photo'}
            </button>
            {form.photo ? (
              <button type="button" className="link-btn" onClick={form.clearPhoto}>
                Remove
              </button>
            ) : null}
            <p className="field__hint">Etched into the card as a line engraving. JPG or PNG, up to 5 MB.</p>
          </div>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="image/*"
            aria-labelledby={`${id}-photo-label`}
            tabIndex={-1}
            onChange={(e) => {
              form.pickPhoto(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        {form.photoError ? (
          <p className="field__error" role="alert">
            {form.photoError}
          </p>
        ) : null}
      </div>

      <fieldset className="field">
        <legend className="field__label">
          Class <span aria-hidden="true">*</span>
        </legend>
        <div className="segmented" role="radiogroup">
          {LICENSE_CLASSES.map((c) => (
            <label key={c.id} className="segmented__opt">
              <input
                type="radio"
                name={`${id}-class`}
                value={c.id}
                checked={values.licenseClass === c.id}
                onChange={() => set('licenseClass', c.id)}
              />
              <span>{c.id}</span>
            </label>
          ))}
        </div>
        <p className="field__hint" aria-live="polite">
          {classHelp}
        </p>
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-email`}>
          Email <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${id}-email`}
          className="input"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </div>
    </div>
  )
}
