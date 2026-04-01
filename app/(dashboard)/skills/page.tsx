'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'

const DEFAULT_SKILLS = [
  { name: 'Coding', icon: '💻', description: 'Build apps and websites' },
  { name: 'Fitness', icon: '💪', description: 'Exercise and stay healthy' },
  { name: 'English', icon: '📚', description: 'Learn and practice English' },
  { name: 'Finance', icon: '💰', description: 'Manage your money' },
  { name: 'Mindfulness', icon: '🧘', description: 'Meditation and focus' },
  { name: 'Creativity', icon: '🎨', description: 'Art, music, and design' },
]

interface UserSkillData {
  id: string
  skill_id: string
  level: number
  xp: number
  skills: { id: string; name: string }
}

const XP_PER_LEVEL = 100

const getBadge = (level: number) => {
  if (level >= 10) return { label: 'Master', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' }
  if (level >= 7) return { label: 'Advanced', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' }
  if (level >= 4) return { label: 'Intermediate', icon: '🥈', color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/30' }
  return { label: 'Beginner', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' }
}

export default function SkillsPage() {
  const [userSkills, setUserSkills] = useState<UserSkillData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalLevels, setTotalLevels] = useState(0)
  const [recentlyUpdated, setRecentlyUpdated] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchSkills = useCallback(async (uid: string) => {
    const supabase = createClient()

    const { data: rawSkills } = await supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', uid)

    if (!rawSkills) return

    // *** إزالة التكرار: نأخذ أول record لكل skill_id ***
    const seen = new Set<string>()
    const unique: UserSkillData[] = []
    for (const s of rawSkills) {
      if (!seen.has(s.skill_id)) {
        seen.add(s.skill_id)
        unique.push(s as UserSkillData)
      }
    }

    // ترتيب ثابت بحسب الاسم
    unique.sort((a, b) => a.skills.name.localeCompare(b.skills.name))

    // اكتشف اللي اتحدث عشان نعمله flash
    setUserSkills(prev => {
      const prevMap: Record<string, { xp: number; level: number }> = {}
      prev.forEach(s => { prevMap[s.skill_id] = { xp: s.xp, level: s.level } })
      for (const s of unique) {
        const old = prevMap[s.skill_id]
        if (old && (old.xp !== s.xp || old.level !== s.level)) {
          setRecentlyUpdated(s.skill_id)
          setTimeout(() => setRecentlyUpdated(null), 2500)
          break
        }
      }
      return unique
    })

    setTotalLevels(unique.reduce((sum, s) => sum + (s.level ?? 0), 0))
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // *** upsert بدل insert عشان نمنع التكرار في جدول skills ***
      for (const skill of DEFAULT_SKILLS) {
        await supabase
          .from('skills')
          .upsert({ name: skill.name }, { onConflict: 'name', ignoreDuplicates: true })
      }

      const { data: allSkills } = await supabase.from('skills').select('*')
      if (allSkills) {
        const { data: existingUserSkills } = await supabase
          .from('user_skills').select('skill_id').eq('user_id', user.id)
        const existingIds = new Set(existingUserSkills?.map(us => us.skill_id) ?? [])

        // أضف بس الـ skills الجديدة
        for (const skill of allSkills) {
          if (!existingIds.has(skill.id)) {
            await supabase.from('user_skills').insert({
              user_id: user.id, skill_id: skill.id, level: 0, xp: 0,
            })
          }
        }
      }

      await fetchSkills(user.id)

      // Real-time subscription
      const channel = supabase
        .channel(`skills-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'user_skills',
          filter: `user_id=eq.${user.id}`,
        }, () => fetchSkills(user.id))
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [fetchSkills])

  // Fallback polling
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => fetchSkills(userId), 5000)
    return () => clearInterval(interval)
  }, [userId, fetchSkills])

  const getSkillInfo = (name: string) =>
    DEFAULT_SKILLS.find(s => s.name === name) ?? { icon: '⭐', description: 'Keep practicing!' }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-purple-400 text-xl">Loading skills...</p>
        </motion.div>
      </div>
    )
  }

  const activeSkills = userSkills.filter(s => s.level > 0 || s.xp > 0)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/20 p-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                🧠 Your Skills
              </h1>
              <p className="text-gray-400 mt-2">
                Complete quests linked to a skill to earn XP and level up automatically!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Live — updates instantly when you complete quests</span>
              </div>
            </div>
            {totalLevels > 0 && (
              <motion.div
                key={totalLevels}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 self-start sm:self-auto"
              >
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="text-purple-400 font-bold text-2xl leading-none">{totalLevels}</p>
                  <p className="text-gray-500 text-xs mt-1">Total Levels</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* How it works */}
        {activeSkills.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5"
          >
            <h3 className="font-bold text-yellow-400 mb-3">💡 How to level up your skills?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2"><span className="text-2xl">1️⃣</span><p>Go to <span className="text-purple-400">Quests</span> page</p></div>
              <div className="flex items-start gap-2"><span className="text-2xl">2️⃣</span><p>Add a quest and link it to a <span className="text-purple-400">Skill</span></p></div>
              <div className="flex items-start gap-2"><span className="text-2xl">3️⃣</span><p>Complete the quest and watch your skill <span className="text-purple-400">level up!</span></p></div>
            </div>
          </motion.div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {userSkills.map((userSkill, index) => {
              const skillInfo = getSkillInfo(userSkill.skills.name)
              const badge = getBadge(userSkill.level)
              const progress = ((userSkill.xp ?? 0) / XP_PER_LEVEL) * 100
              const xpNeeded = XP_PER_LEVEL - (userSkill.xp ?? 0)
              const isActive = userSkill.level > 0 || userSkill.xp > 0
              // *** استخدم skill_id للمقارنة ***
              const isFlashing = recentlyUpdated === userSkill.skill_id

              return (
                <motion.div
                  key={userSkill.skill_id} // *** skill_id مش id عشان يمنع duplicate keys ***
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1, y: 0,
                    boxShadow: isFlashing
                      ? ['0 0 0px #a855f7', '0 0 30px #a855f7', '0 0 0px #a855f7']
                      : '0 0 0px transparent',
                  }}
                  transition={{ delay: index * 0.05, boxShadow: { duration: 0.8, repeat: isFlashing ? 2 : 0 } }}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isFlashing
                      ? 'border-purple-400 bg-gray-900'
                      : isActive
                        ? 'border-purple-500/30 bg-gray-900/80 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10'
                        : 'border-gray-800 bg-gray-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="p-5">
                    {isFlashing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-3 text-center bg-purple-500/20 border border-purple-500/40 rounded-xl py-1 text-purple-300 text-xs font-bold"
                      >
                        ✨ Just Updated!
                      </motion.div>
                    )}

                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isActive ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                          {skillInfo.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">{userSkill.skills.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{skillInfo.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.div
                          key={userSkill.level}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className={`text-2xl font-bold ${isActive ? 'text-purple-400' : 'text-gray-600'}`}
                        >
                          Lv.{userSkill.level}
                        </motion.div>
                        <div className={`text-xs font-medium ${badge.color} flex items-center gap-1 justify-end mt-1`}>
                          <span>{badge.icon}</span><span>{badge.label}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">⚡ XP Progress</span>
                        <motion.span
                          key={userSkill.xp}
                          initial={{ scale: 1.2, color: '#facc15' }}
                          animate={{ scale: 1, color: '#a855f7' }}
                          transition={{ duration: 0.5 }}
                          className="text-sm font-mono text-purple-400"
                        >
                          {userSkill.xp ?? 0} / {XP_PER_LEVEL}
                        </motion.span>
                      </div>
                      <Progress value={progress} className="h-2.5 bg-gray-800" />
                      <div className="mt-2 text-xs">
                        {(userSkill.xp ?? 0) === 0 ? (
                          <p className="text-gray-600">✨ Link a quest to this skill to start earning XP!</p>
                        ) : xpNeeded <= 10 ? (
                          <p className="text-green-400 font-medium animate-pulse">🎉 Almost there! {xpNeeded} XP to level {userSkill.level + 1}!</p>
                        ) : (
                          <p className="text-gray-500">{xpNeeded} more XP to reach level {userSkill.level + 1}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${badge.bg} ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="text-xs text-gray-600">{XP_PER_LEVEL} XP = +1 Level</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}