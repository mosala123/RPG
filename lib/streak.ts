import { createClient } from '@/lib/supabase/client'

export async function updateStreak(userId: string) {
  const supabase = createClient()

  const { data: user } = await supabase
    .from('users')
    .select('streak, last_active')
    .eq('id', userId)
    .single()

  if (!user) return 0

  const today = new Date().toISOString().split('T')[0]
  const lastActive = user.last_active

  // لو فاتح الموقع النهارده خلاص
  if (lastActive === today) return user.streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = 1

  // لو فاتح امبارح → streak بيزيد
  if (lastActive === yesterdayStr) {
    newStreak = (user.streak ?? 0) + 1
  }

  // لو انقطع → بيبدأ من 1
  await supabase
    .from('users')
    .update({
      streak: newStreak,
      last_active: today,
    })
    .eq('id', userId)

  return newStreak
}