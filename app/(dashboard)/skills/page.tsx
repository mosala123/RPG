'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  skills: {
    id: string
    name: string
  }
}

const XP_PER_LEVEL = 100

const getBadge = (level: number) => {
  if (level >= 10) return { label: 'Master', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
  if (level >= 7) return { label: 'Advanced', icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  if (level >= 4) return { label: 'Intermediate', icon: '🥈', color: 'text-gray-300', bg: 'bg-gray-500/10' }
  return { label: 'Beginner', icon: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10' }
}

export default function SkillsPage() {
  const [userSkills, setUserSkills] = useState<UserSkillData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Ensure all default skills exist
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

    // Create missing user skills with level 0 and xp 0
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

    if (finalSkills) setUserSkills(finalSkills as UserSkillData[])
    setLoading(false)
  }

  const getSkillInfo = (name: string) => {
    return DEFAULT_SKILLS.find(s => s.name === name) || { icon: '⭐', description: 'Keep practicing!' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-400 text-xl animate-pulse">⚔️ Loading skills...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🧠 Your Skills
          </h1>
          <p className="text-gray-400 mt-2">
            Complete quests to earn XP and level up each skill
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userSkills.map((userSkill, index) => {
            const skillInfo = getSkillInfo(userSkill.skills.name)
            const badge = getBadge(userSkill.level)
            const progress = (userSkill.xp / XP_PER_LEVEL) * 100
            const xpNeeded = XP_PER_LEVEL - userSkill.xp
            
            return (
              <motion.div
                key={userSkill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900/80 rounded-2xl border border-gray-800 overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
              >
                {/* Card Content */}
                <div className="p-5">
                  {/* Top Section: Icon, Name, Level */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">{skillInfo.icon}</span>
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          {userSkill.skills.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {skillInfo.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">
                        Lv.{userSkill.level}
                      </div>
                      <div className={`text-xs font-medium ${badge.color} flex items-center gap-1 justify-end mt-0.5`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* XP Progress Section */}
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <span>⚡</span> Experience Points
                      </span>
                      <span className="text-sm font-mono text-purple-400">
                        {userSkill.xp} / {XP_PER_LEVEL}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <Progress 
                      value={progress} 
                      className="h-2 bg-gray-800"
                    />
                    
                    {/* Progress Message */}
                    <div className="mt-2 text-xs">
                      {userSkill.xp === 0 ? (
                        <p className="text-gray-500 flex items-center gap-1">
                          <span>✨</span> No XP yet. Complete quests with this skill to earn XP!
                        </p>
                      ) : xpNeeded === 0 ? (
                        <p className="text-green-400 flex items-center gap-1">
                          <span>🎉</span> Ready to level up! Complete one more quest!
                        </p>
                      ) : (
                        <p className="text-gray-500">
                          {xpNeeded} more XP to reach level {userSkill.level + 1}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* How to Earn Info */}
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>⚔️</span>
                        <span>Complete quests</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>🏆</span>
                        <span>Earn {XP_PER_LEVEL} XP = +1 Level</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {userSkills.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No skills yet</h3>
            <p className="text-gray-500">Start adding quests to level up your skills!</p>
          </div>
        )}
      </div>
    </div>
  )
}