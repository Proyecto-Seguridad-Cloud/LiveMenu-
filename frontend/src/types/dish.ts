export type Dish = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number | string
  price_offer: number | string | null
  image_url: string | null
  available: boolean
  featured: boolean
  tags: string[]
  position: number
}

export type DishPayload = {
  category_id: string
  name: string
  description?: string | null
  price: number
  price_offer?: number | null
  image_url?: string | null
  featured?: boolean
  tags?: string[]
  position?: number
}

export type DishUpdatePayload = Partial<DishPayload>
