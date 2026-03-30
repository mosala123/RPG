'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User } from '@/types'

const XP_PER_LEVEL = 100

const SKILL_ICONS: Record<string, string> = {
  Coding: '💻',
  Fitness: '💪',
  English: '📚',
  Finance: '💰',
  Mindfulness: '🧘',
  Creativity: '🎨',
}

interface QuestStats {
  total: number
  completed: number
  easy: number
  medium: number
  hard: number
  completionRate: number
  totalXPEarned: number
}

export default function ProfilePage() {
  const { user, setUser } = useUserStore()
  const [stats, setStats] = useState<QuestStats>({
    total: 0,
    completed: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    completionRate: 0,
    totalXPEarned: 0,
  })
  const [recentQuests, setRecentQuests] = useState<any[]>([])
  const [topSkills, setTopSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [memberSince, setMemberSince] = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser(profile as User)
      setMemberSince(new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }))
    }

    // Fetch quests
    const { data: allQuests } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (allQuests) {
      const completed = allQuests.filter(q => q.is_completed)
      const totalXPEarned = completed.reduce((sum, q) => sum + q.xp_reward, 0)

      setStats({
        total: allQuests.length,
        completed: completed.length,
        easy: allQuests.filter(q => q.difficulty === 'easy').length,
        medium: allQuests.filter(q => q.difficulty === 'medium').length,
        hard: allQuests.filter(q => q.difficulty === 'hard').length,
        completionRate: allQuests.length > 0
          ? Math.round((completed.length / allQuests.length) * 100)
          : 0,
        totalXPEarned,
      })

      setRecentQuests(allQuests.slice(0, 5))
    }

    // Fetch top skills
    const { data: userSkills } = await supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', authUser.id)
      .order('level', { ascending: false })
      .limit(3)

    if (userSkills) setTopSkills(userSkills)
    setLoading(false)
  }, [setUser])

  useEffect(() => {
    fetchData()
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
          <p className="text-purple-400 text-xl">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

  const xpProgress = user ? (user.xp / XP_PER_LEVEL) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/20 p-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-5xl shadow-lg shadow-purple-500/30">
                ⚔️
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{user?.username}</h1>
              <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  🏆 Level {user?.level} Hero
                </Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  📅 Since {memberSince}
                </Badge>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  🔥 {user?.streak ?? 0} Day Streak
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/quests">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  ⚔️ New Quest
                </Button>
              </Link>
              <Link href="/skills">
                <Button variant="outline" className="border-gray-700 hover:border-purple-500">
                  🧠 Skills
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">⚡ Experience Progress</h3>
              <p className="text-gray-500 text-sm">Level {user?.level} → Level {(user?.level ?? 1) + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-purple-400 font-bold text-xl">{user?.xp} / {XP_PER_LEVEL} XP</p>
              <p className="text-gray-500 text-sm">{XP_PER_LEVEL - (user?.xp ?? 0)} XP remaining</p>
            </div>
          </div>
          <Progress value={xpProgress} className="h-4" />
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-gray-500">Total XP Earned: <span className="text-purple-400 font-medium">{stats.totalXPEarned} XP</span></span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left - Quest Stats */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-center">
                <p className="text-4xl font-bold text-purple-400">{stats.total}</p>
                <p className="text-gray-400 text-sm mt-1">Total Quests</p>
              </div>
              <div className="p-5 rounded-2xl border border-green-500/30 bg-green-500/10 text-center">
                <p className="text-4xl font-bold text-green-400">{stats.completed}</p>
                <p className="text-gray-400 text-sm mt-1">Completed</p>
              </div>
            </motion.div>

            {/* Completion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <h3 className="font-bold text-lg mb-4">📊 Quest Statistics</h3>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Completion Rate</span>
                <span className="text-purple-400 font-bold">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-400">{stats.easy}</p>
                  <p className="text-xs text-gray-500 mt-1">Easy</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
                  <p className="text-xs text-gray-500 mt-1">Medium</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-400">{stats.hard}</p>
                  <p className="text-xs text-gray-500 mt-1">Hard</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Quests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">📋 Recent Quests</h3>
                <Link href="/quests" className="text-xs text-purple-400 hover:text-purple-300">
                  View All →
                </Link>
              </div>

              {recentQuests.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No quests yet. Start your journey!</p>
                  <Link href="/quests">
                    <Button className="mt-3 bg-purple-600 hover:bg-purple-700">
                      ➕ Add Quest
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all"
                    >
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${quest.is_completed ? 'line-through text-gray-500' : ''}`}>
                          {quest.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${
                            quest.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                            quest.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {quest.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">+{quest.xp_reward} XP</span>
                        </div>
                      </div>
                      {quest.is_completed ? (
                        <span className="text-green-400 text-sm font-medium">✓ Done</span>
                      ) : (
                        <span className="text-yellow-400 text-sm font-medium">⚡ Active</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right - Top Skills */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">🏆 Top Skills</h3>
                <Link href="/skills" className="text-xs text-purple-400 hover:text-purple-300">
                  View All →
                </Link>
              </div>

              {topSkills.filter(s => s.level > 0).length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-500 text-sm">No skills leveled up yet!</p>
                  <p className="text-gray-600 text-xs mt-1">Complete quests linked to skills</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSkills.filter(s => s.level > 0).map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{SKILL_ICONS[skill.skills.name] ?? '⭐'}</span>
                        <div>
                          <p className="text-sm font-medium">{skill.skills.name}</p>
                          <p className="text-xs text-gray-500">Level {skill.level}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Lv.{skill.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <h3 className="font-bold text-lg mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: '/quests', icon: '⚔️', label: 'Add New Quest' },
                  { href: '/skills', icon: '🧠', label: 'View Skills' },
                  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer">
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}