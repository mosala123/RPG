'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'

const DEFAULT_SKILLS = [
  { name: 'Coding', icon: '💻', description: 'Build apps and websites', color: 'purple' },
  { name: 'Fitness', icon: '💪', description: 'Exercise and stay healthy', color: 'green' },
  { name: 'English', icon: '📚', description: 'Learn and practice English', color: 'blue' },
  { name: 'Finance', icon: '💰', description: 'Manage your money', color: 'yellow' },
  { name: 'Mindfulness', icon: '🧘', description: 'Meditation and focus', color: 'cyan' },
  { name: 'Creativity', icon: '🎨', description: 'Art, music, and design', color: 'pink' },
]

interface UserSkillData {
  id: string
  skill_id: string
  level: number
  xp: number
  skills: {
    id: string
    name: string
  }
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

  const fetchSkills = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Ensure default skills exist
    for (const skill of DEFAULT_SKILLS) {
      const { data: existing } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skill.name)
        .maybeSingle()

      if (!existing) {
        await supabase.from('skills').insert({ name: skill.name })
      }
    }

    const { data: allSkills } = await supabase.from('skills').select('*')
    const { data: existingUserSkills } = await supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', user.id)

    // Create missing user skills
    if (allSkills) {
      for (const skill of allSkills) {
        const exists = existingUserSkills?.find(us => us.skill_id === skill.id)
        if (!exists) {
          await supabase.from('user_skills').insert({
            user_id: user.id,
            skill_id: skill.id,
            level: 0,
            xp: 0,
          })
        }
      }
    }

    const { data: finalSkills } = await supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', user.id)

    if (finalSkills) {
      setUserSkills(finalSkills as UserSkillData[])
      setTotalLevels(finalSkills.reduce((sum, s) => sum + s.level, 0))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSkills()
    const interval = setInterval(fetchSkills, 10000)
    return () => clearInterval(interval)
  }, [fetchSkills])

  const getSkillInfo = (name: string) => {
    return DEFAULT_SKILLS.find(s => s.name === name) ?? {
      icon: '⭐',
      description: 'Keep practicing!',
      color: 'purple',
    }
  }

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

  const activeSkills = userSkills.filter(s => s.level > 0)

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
            </div>
            {totalLevels > 0 && (
              <motion.div
                initial={{ scale: 0 }}
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

        {/* How it works - shown when no skills leveled up */}
        {activeSkills.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5"
          >
            <h3 className="font-bold text-yellow-400 mb-3">💡 How to level up your skills?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-2xl">1️⃣</span>
                <p>Go to <span className="text-purple-400">Quests</span> page</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">2️⃣</span>
                <p>Add a quest and link it to a <span className="text-purple-400">Skill</span></p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">3️⃣</span>
                <p>Complete the quest and watch your skill <span className="text-purple-400">level up!</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userSkills.map((userSkill, index) => {
            const skillInfo = getSkillInfo(userSkill.skills.name)
            const badge = getBadge(userSkill.level)
            const progress = ((userSkill.xp ?? 0) / XP_PER_LEVEL) * 100
            const xpNeeded = XP_PER_LEVEL - (userSkill.xp ?? 0)
            const isActive = userSkill.level > 0

            return (
              <motion.div
                key={userSkill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'border-purple-500/30 bg-gray-900/80 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10'
                    : 'border-gray-800 bg-gray-900/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="p-5">

                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                        isActive ? 'bg-purple-500/20' : 'bg-gray-800'
                      }`}>
                        {skillInfo.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          {userSkill.skills.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {skillInfo.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${isActive ? 'text-purple-400' : 'text-gray-600'}`}>
                        Lv.{userSkill.level}
                      </div>
                      <div className={`text-xs font-medium ${badge.color} flex items-center gap-1 justify-end mt-1`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* XP Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">⚡ XP Progress</span>
                      <span className="text-sm font-mono text-purple-400">
                        {userSkill.xp ?? 0} / {XP_PER_LEVEL}
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2.5 bg-gray-800"
                    />
                    <div className="mt-2 text-xs">
                      {(userSkill.xp ?? 0) === 0 ? (
                        <p className="text-gray-600">
                          ✨ Link a quest to this skill to start earning XP!
                        </p>
                      ) : xpNeeded <= 10 ? (
                        <p className="text-green-400 font-medium">
                          🎉 Almost there! {xpNeeded} XP to level {userSkill.level + 1}!
                        </p>
                      ) : (
                        <p className="text-gray-500">
                          {xpNeeded} more XP to reach level {userSkill.level + 1}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-lg border ${badge.bg} ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                    <span className="text-xs text-gray-600">
                      {XP_PER_LEVEL} XP = +1 Level
                    </span>
                  </div>

                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </div>
  )
}