export type Wish = {
  id: string
  content: string
  star_x: number
  star_y: number
  created_at?: string
  is_public?: boolean | null
  drawing_data?: string | null
  user_id?: string | null
  like_count?: number
  liked_by_me?: boolean
}

export type Star = {
  id: string
  x: number
  y: number
  size: number
  opacity: number
  wish?: string
}