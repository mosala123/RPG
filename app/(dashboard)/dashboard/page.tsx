'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { User, Quest } from '@/types'
import { updateStreak } from '@/lib/streak'
import LevelUpPopup from '@/components/shared/LevelUpPopup'

const XP_PER_LEVEL = 100

const difficultyColor = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const getStreakMessage = (streak: number) => {
  if (streak === 0) return 'Login every day to build your streak!'
  if (streak < 3) return 'Good start! Keep going! 💪'
  if (streak < 7) return 'You\'re on fire! 🔥'
  if (streak < 14) return 'Unstoppable! ⚡'
  return 'Legendary streak! 👑'
}

export default function DashboardPage() {
  const { user, setUser } = useUserStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Update streak
      const newStreak = await updateStreak(authUser.id)
      setStreak(newStreak)

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) setUser(profile as User)

      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (questsData) setQuests(questsData as Quest[])

      const { count } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_completed', true)

      setCompletedCount(count ?? 0)
      setLoading(false)
    }

    fetchData()
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-purple-400 text-xl"
        >
          ⚔️ Loading your quest...
        </motion.div>
      </div>
    )
  }

  const xpProgress = user ? (user.xp / XP_PER_LEVEL) * 100 : 0

  return (
    <>
      <LevelUpPopup
        level={user?.level ?? 1}
        show={showLevelUp}
        onClose={() => setShowLevelUp(false)}
      />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome back, {user?.username} ⚔️
            </h1>
            <p className="text-gray-400 mt-1">Ready for today's quests?</p>
          </div>
          {/* Streak Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 self-start sm:self-auto"
          >
            <span className="text-2xl">🔥</span>
            <div>
              <span className="text-orange-400 font-bold text-xl">{streak}</span>
              <span className="text-gray-500 text-xs block">Day Streak</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Streak Message */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-4 py-3 rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-300 text-sm"
          >
            🔥 {streak} day streak! {getStreakMessage(streak)}
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-center">
            <p className="text-gray-400 text-xs mb-1">Level</p>
            <p className="text-3xl font-bold text-purple-400">{user?.level}</p>
          </div>
          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-center">
            <p className="text-gray-400 text-xs mb-1">Total XP</p>
            <p className="text-3xl font-bold text-cyan-400">{user?.xp}</p>
          </div>
          <div className="p-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-center">
            <p className="text-gray-400 text-xs mb-1">Active</p>
            <p className="text-3xl font-bold text-yellow-400">{quests.length}</p>
          </div>
          <div className="p-4 rounded-2xl border border-green-500/30 bg-green-500/10 text-center">
            <p className="text-gray-400 text-xs mb-1">Done</p>
            <p className="text-3xl font-bold text-green-400">{completedCount}</p>
          </div>
        </motion.div>

        {/* XP Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex justify-between mb-3">
            <span className="text-gray-400 font-medium">⚡ XP Progress</span>
            <span className="text-purple-400 font-bold">{user?.xp} / {XP_PER_LEVEL} XP</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <div className="flex justify-between mt-2">
            <p className="text-gray-500 text-sm">
              Level {user?.level}
            </p>
            <p className="text-gray-500 text-sm">
              {XP_PER_LEVEL - (user?.xp ?? 0)} XP to Level {(user?.level ?? 1) + 1}
            </p>
          </div>
        </motion.div>

        {/* Active Quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">⚡ Active Quests</h2>
            <span className="text-gray-500 text-sm">{quests.length} quest{quests.length !== 1 ? 's' : ''}</span>
          </div>
          {quests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🗡️</p>
              <p className="text-gray-400">No active quests!</p>
              <p className="text-gray-600 text-sm mt-1">Go to Quests page and add some</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quests.map((quest) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-gray-600 transition-all"
                >
                  <div>
                    <p className="font-medium">{quest.title}</p>
                    {quest.description && (
                      <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge className={difficultyColor[quest.difficulty]}>
                      {quest.difficulty}
                    </Badge>
                    <span className="text-yellow-400 text-sm font-bold whitespace-nowrap">+{quest.xp_reward} XP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}