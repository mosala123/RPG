'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import LevelUpPopup from '@/components/shared/LevelUpPopup'
import { updateStreak } from '@/lib/streak'
import { User, Quest } from '@/types'

const XP_PER_LEVEL = 100

const difficultyColor = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const getStreakMessage = (streak: number) => {
  if (streak === 0) return '👋 Login every day to build your streak!'
  if (streak < 3) return '💪 Good start! Keep going!'
  if (streak < 7) return '🔥 You\'re on fire!'
  if (streak < 14) return '⚡ Unstoppable!'
  if (streak < 30) return '👑 Legendary streak!'
  return '🌟 You are a true hero!'
}

const MOTIVATIONAL_MESSAGES = [
  "Every quest completed makes you stronger! 💪",
  "Your future self will thank you! 🚀",
  "Small steps lead to big victories! ⚔️",
  "Level up your life, one quest at a time! 🎮",
  "Heroes are made through daily effort! 🏆",
  "Today's effort is tomorrow's power! ⚡",
]

export default function DashboardPage() {
  const { user, setUser } = useUserStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [completedCount, setCompletedCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [motivationalMsg] = useState(
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    // Update streak
    const newStreak = await updateStreak(authUser.id)
    setStreak(newStreak)

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) setUser(profile as User)

    // Fetch active quests
    const { data: questsData } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (questsData) setQuests(questsData as Quest[])

    // Fetch completed count
    const { count } = await supabase
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('is_completed', true)

    setCompletedCount(count ?? 0)
    setLoading(false)
  }, [setUser])

  useEffect(() => {
    fetchData()

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center"
        >
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-purple-400 text-xl">Loading your quest...</p>
        </motion.div>
      </div>
    )
  }

  const xpProgress = user ? (user.xp / XP_PER_LEVEL) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-white">

      <LevelUpPopup
        show={showLevelUp}
        level={newLevel}
        onClose={() => setShowLevelUp(false)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/20 p-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Welcome back, {user?.username} ⚔️
              </h1>
              <p className="text-gray-400 mt-1 italic text-sm">{motivationalMsg}</p>
            </div>

            {/* Streak */}
            <motion.div
              animate={{ scale: streak > 0 ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-orange-500/30 bg-orange-500/10"
            >
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-orange-400 font-bold text-2xl leading-none">{streak}</p>
                <p className="text-gray-500 text-xs mt-1">Day Streak</p>
              </div>
            </motion.div>
          </div>

          {/* Streak Message */}
          {streak > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 mt-3 text-sm text-orange-300/80"
            >
              {getStreakMessage(streak)}
            </motion.div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Level', value: user?.level, color: 'purple', icon: '🏆' },
            { label: 'XP', value: user?.xp, color: 'cyan', icon: '⚡' },
            { label: 'Active', value: quests.length, color: 'yellow', icon: '⚔️' },
            { label: 'Done', value: completedCount, color: 'green', icon: '✅' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-2xl border text-center
                ${stat.color === 'purple' ? 'border-purple-500/30 bg-purple-500/10' : ''}
                ${stat.color === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/10' : ''}
                ${stat.color === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/10' : ''}
                ${stat.color === 'green' ? 'border-green-500/30 bg-green-500/10' : ''}
              `}
            >
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className={`text-3xl font-bold
                ${stat.color === 'purple' ? 'text-purple-400' : ''}
                ${stat.color === 'cyan' ? 'text-cyan-400' : ''}
                ${stat.color === 'yellow' ? 'text-yellow-400' : ''}
                ${stat.color === 'green' ? 'text-green-400' : ''}
              `}>
                {stat.value}
              </p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex justify-between mb-3">
            <span className="text-gray-300 font-medium flex items-center gap-2">
              ⚡ XP Progress
            </span>
            <span className="text-purple-400 font-bold">{user?.xp} / {XP_PER_LEVEL} XP</span>
          </div>
          <Progress value={xpProgress} className="h-4" />
          <div className="flex justify-between mt-3">
            <span className="text-gray-500 text-sm">Level {user?.level}</span>
            <span className="text-gray-500 text-sm">
              {XP_PER_LEVEL - (user?.xp ?? 0)} XP → Level {(user?.level ?? 1) + 1}
            </span>
          </div>
        </motion.div>

        {/* Active Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              ⚡ Active Quests
            </h2>
            <span className="text-gray-500 text-sm bg-gray-800 px-3 py-1 rounded-full">
              {quests.length} remaining
            </span>
          </div>

          {quests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <p className="text-5xl mb-3">🗡️</p>
              <p className="text-gray-400 font-medium">No active quests!</p>
              <p className="text-gray-600 text-sm mt-1">
                Go to the Quests page and add some missions
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {quests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500/30 hover:bg-gray-800 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{quest.title}</p>
                      {quest.description && (
                        <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={difficultyColor[quest.difficulty]}>
                        {quest.difficulty}
                      </Badge>
                      <span className="text-yellow-400 text-sm font-bold whitespace-nowrap">
                        +{quest.xp_reward} XP
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}