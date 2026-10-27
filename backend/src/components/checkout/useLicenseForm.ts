'use client'

import { useMemo, useState } from 'react'
import type { EngravingData } from '@/components/card3d/engraver'
import { formatCardDate, isValidEmail } from '@/lib/licenses'

export type LicenseFormState = {
  prefix: string
  fullName: string
  sex: string
  dateOfBirth: string
  email: string
  licenseClass: string
}

const EMPTY: LicenseFormState = { prefix: '', fullName: '', sex: '', dateOfBirth: '', email: '', licenseClass: 'A' }
const MAX_PHOTO = 5 * 1024 * 1024

export function useLicenseForm(licenseNumber: string | null) {
  const [values, setValues] = useState<LicenseFormState>(EMPTY)
  const [photo, setPhoto] = useState<{ dataUrl: string; img: HTMLImageElement } | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [issueDate] = useState(() => formatCardDate(new Date()))

  const set = <K extends keyof LicenseFormState>(key: K, value: LicenseFormState[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const pickPhoto = (file: File | undefined | null) => {
    setPhotoError('')
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('Please choose an image file.')
    if (file.size > MAX_PHOTO) return setPhotoError('Image must be smaller than 5 MB.')
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const img = new Image()
      img.onload = () => setPhoto({ dataUrl, img })
      img.onerror = () => setPhotoError('That image could not be read.')
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const engraving = useMemo<EngravingData>(
    () => ({
      number: licenseNumber ?? '',
      name: [values.prefix.replace(/\.$/, ''), values.fullName.trim()].filter(Boolean).join(' '),
      sex: values.sex,
      dob: formatCardDate(values.dateOfBirth),
      issueDate,
      licenseClass: values.licenseClass,
      photo: photo?.img ?? null,
    }),
    [licenseNumber, values, issueDate, photo],
  )

  const validate = () => {
    if (!values.fullName.trim() || !values.sex || !values.dateOfBirth || !values.email.trim())
      return 'Please fill in all required fields.'
    if (!isValidEmail(values.email.trim())) return 'Please enter a valid email address.'
    return null
  }

  const isDirty =
    !!(values.prefix || values.fullName || values.sex || values.dateOfBirth || values.email || photo) ||
    values.licenseClass !== 'A'

  return {
    values,
    set,
    photo,
    photoError,
    pickPhoto,
    clearPhoto: () => setPhoto(null),
    engraving,
    validate,
    isDirty,
    toOrder: (number: string) => ({
      licenseNumber: number,
      fullName: values.fullName.trim(),
      prefix: values.prefix || undefined,
      email: values.email.trim(),
      licenseType: values.licenseClass,
      sex: values.sex,
      dateOfBirth: values.dateOfBirth,
      photo: photo?.dataUrl ?? null,
      shippingAddress: { country: '', city: '', addressLine: '', zip: '' },
    }),
  }
}

export type LicenseForm = ReturnType<typeof useLicenseForm>
