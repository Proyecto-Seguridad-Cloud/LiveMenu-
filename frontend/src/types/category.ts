export type Category = {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  position: number
  active: boolean
}

export type CategoryPayload = {
  name: string
  description?: string | null
}

export type CategoryUpdatePayload = {
  name?: string
  description?: string | null
  active?: boolean
}
