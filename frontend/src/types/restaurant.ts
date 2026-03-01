export type Restaurant = {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string | null
  address: string | null
  hours: Record<string, unknown> | null
}

export type RestaurantPayload = {
  name: string
  description?: string | null
  logo_url?: string | null
  phone?: string | null
  address?: string | null
  hours?: Record<string, unknown> | null
}
