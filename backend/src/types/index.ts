export interface ShippingAddress {
  country: string
  city: string
  addressLine: string
  zip: string
}

export interface PurchaseFormData {
  firstName: string
  lastName: string
  email: string
  shippingAddress: ShippingAddress
}

export interface LicenseNumber {
  number: string
  status: 'available' | 'reserved' | 'taken'
  priceTier: 'standard' | 'premium'
  price: number
}
