import { supabase } from "./supabase"
import type { Wish } from "@/types/wish"

export async function saveWish(
  content: string,
  star_x: number,
  star_y: number,
  drawing_data?: string | null,
  user_id?: string,
): Promise<Wish | null> {
  const base = { content, star_x, star_y, is_public: true as const, user_id: user_id ?? null }

  if (drawing_data) {
    const r1 = await supabase.from("wishes").insert({ ...base, drawing_data }).select().single()
    if (!r1.error) return r1.data
    const r2 = await supabase.from("wishes").insert(base).select().single()
    if (r2.error) { console.error("saveWish:", r2.error.message); return null }
    return r2.data
  }

  const { data, error } = await supabase.from("wishes").insert(base).select().single()
  if (error) { console.error("saveWish:", error.message); return null }
  return data
}

export async function getPublicWishes(myUserId?: string): Promise<Wish[]> {
  const { data, error } = await supabase
    .from("wishes")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) { console.error("Fetch error:", error.message); return [] }
  const wishes = data ?? []

  // Get like counts for all wishes
  const { data: likesData } = await supabase
    .from("likes")
    .select("wish_id, user_id")

  const likes = likesData ?? []

  return wishes.map(w => ({
    ...w,
    like_count: likes.filter(l => l.wish_id === w.id).length,
    liked_by_me: myUserId
      ? likes.some(l => l.wish_id === w.id && l.user_id === myUserId)
      : false,
  }))
}

export async function toggleLike(wishId: string, userId: string, liked: boolean): Promise<number> {
  if (liked) {
    // Unlike — remove the like
    await supabase
      .from("likes")
      .delete()
      .eq("wish_id", wishId)
      .eq("user_id", userId)
  } else {
    // Like — insert
    await supabase
      .from("likes")
      .insert({ wish_id: wishId, user_id: userId })
  }

  // Return new count
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("wish_id", wishId)

  return data?.length ?? 0
}

export async function deleteWish(id: string): Promise<boolean> {
  const { error } = await supabase.from("wishes").delete().eq("id", id)
  if (error) { console.error("deleteWish:", error.message); return false }
  return true
}