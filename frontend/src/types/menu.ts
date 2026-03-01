export type PublicMenuDish = {
  id: string
  name: string
  description: string | null
  price: number | string
  price_offer: number | string | null
  image_url: string | null
  featured: boolean
  tags: string[]
}

export type PublicMenuCategory = {
  id: string
  name: string
  description: string | null
  position: number
  dishes: PublicMenuDish[]
}

export type PublicMenuRestaurant = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string | null
  address: string | null
  hours: Record<string, unknown> | null
}

export type PublicMenuResponse = {
  restaurant: PublicMenuRestaurant
  categories: PublicMenuCategory[]
}
