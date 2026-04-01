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

// بناء الـ heatmap للـ 12 أسبوع الأخيرة
function buildActivityMap(completedDates: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  completedDates.forEach(date => {
    const d = date.split('T')[0] // YYYY-MM-DD
    map[d] = (map[d] ?? 0) + 1
  })
  return map
}

function getLast84Days(): string[] {
  const days: string[] = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function getIntensity(count: number): string {
  if (count === 0) return 'bg-gray-800/80'
  if (count === 1) return 'bg-purple-900/70'
  if (count === 2) return 'bg-purple-700/80'
  if (count === 3) return 'bg-purple-500'
  return 'bg-purple-400'
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DashboardPage() {
  const { user, setUser } = useUserStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [completedCount, setCompletedCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [activityMap, setActivityMap] = useState<Record<string, number>>({})
  const [totalActiveDays, setTotalActiveDays] = useState(0)
  const [motivationalMsg] = useState(
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  )
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const newStreak = await updateStreak(authUser.id)
    setStreak(newStreak)

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', authUser.id).single()
    if (profile) setUser(profile as User)

    // Active quests
    const { data: questsData } = await supabase
      .from('quests').select('*')
      .eq('user_id', authUser.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(5)
    if (questsData) setQuests(questsData as Quest[])

    // Completed count
    const { count } = await supabase
      .from('quests').select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id).eq('is_completed', true)
    setCompletedCount(count ?? 0)

    // *** Activity heatmap - جلب تواريخ إكمال الـ quests ***
    const { data: completedQuests } = await supabase
      .from('quests')
      .select('updated_at')
      .eq('user_id', authUser.id)
      .eq('is_completed', true)

    if (completedQuests) {
      const dates = completedQuests.map(q => q.updated_at ?? q.created_at).filter(Boolean)
      const map = buildActivityMap(dates)
      setActivityMap(map)
      setTotalActiveDays(Object.keys(map).length)
    }

    setLoading(false)
  }, [setUser])

  useEffect(() => {
    fetchData()

    // Real-time subscription
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const channel = supabase
        .channel('dashboard-realtime')
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'quests',
          filter: `user_id=eq.${authUser.id}`
        }, () => { fetchData() })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'users',
          filter: `id=eq.${authUser.id}`
        }, () => { fetchData() })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    init()
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
  const last84Days = getLast84Days()

  // بناء الـ weeks (7 أيام في كل column)
  const weeks: string[][] = []
  for (let i = 0; i < last84Days.length; i += 7) {
    weeks.push(last84Days.slice(i, i + 7))
  }

  // حساب الشهور للـ labels
  const monthPositions: { label: string; col: number }[] = []
  weeks.forEach((week, col) => {
    const firstDay = new Date(week[0])
    if (firstDay.getDate() <= 7) {
      monthPositions.push({ label: MONTH_LABELS[firstDay.getMonth()], col })
    }
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <LevelUpPopup show={showLevelUp} level={newLevel} onClose={() => setShowLevelUp(false)} />

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
              {/* Live indicator */}
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">Live Dashboard</span>
              </div>
            </div>

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
              <motion.p
                key={stat.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`text-3xl font-bold
                  ${stat.color === 'purple' ? 'text-purple-400' : ''}
                  ${stat.color === 'cyan' ? 'text-cyan-400' : ''}
                  ${stat.color === 'yellow' ? 'text-yellow-400' : ''}
                  ${stat.color === 'green' ? 'text-green-400' : ''}
                `}
              >
                {stat.value}
              </motion.p>
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
            <span className="text-gray-300 font-medium flex items-center gap-2">⚡ XP Progress</span>
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

        {/* *** Activity Heatmap *** */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                📅 Activity — Last 12 Weeks
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {totalActiveDays} active {totalActiveDays === 1 ? 'day' : 'days'} · {completedCount} quests completed
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>Less</span>
              {['bg-gray-800/80', 'bg-purple-900/70', 'bg-purple-700/80', 'bg-purple-500', 'bg-purple-400'].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Month labels */}
              <div className="flex mb-1 ml-8">
                {weeks.map((_, col) => {
                  const month = monthPositions.find(m => m.col === col)
                  return (
                    <div key={col} className="w-4 flex-shrink-0 text-xs text-gray-600 mr-1">
                      {month?.label ?? ''}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-1">
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} className="h-3.5 text-xs text-gray-600 flex items-center" style={{ fontSize: '10px' }}>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {weeks.map((week, col) => (
                  <div key={col} className="flex flex-col gap-1">
                    {week.map((date) => {
                      const count = activityMap[date] ?? 0
                      const isToday = date === new Date().toISOString().split('T')[0]
                      return (
                        <div
                          key={date}
                          onMouseEnter={() => setHoveredDay({ date, count })}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125 ${getIntensity(count)} ${
                            isToday ? 'ring-1 ring-cyan-400' : ''
                          }`}
                          title={`${date}: ${count} quest${count !== 1 ? 's' : ''}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredDay && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-center text-sm text-gray-300"
                  >
                    {hoveredDay.count === 0
                      ? `${hoveredDay.date} — No quests completed`
                      : `${hoveredDay.date} — ${hoveredDay.count} quest${hoveredDay.count !== 1 ? 's' : ''} completed 🎯`
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            <h2 className="text-lg font-bold flex items-center gap-2">⚡ Active Quests</h2>
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
              <p className="text-gray-600 text-sm mt-1">Go to the Quests page and add some missions</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {quests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-purple-500/30 hover:bg-gray-800 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{quest.title}</p>
                      {quest.description && (
                        <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={difficultyColor[quest.difficulty]}>{quest.difficulty}</Badge>
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