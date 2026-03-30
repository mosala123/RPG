'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User } from '@/types'

const XP_PER_LEVEL = 100

interface QuestStats {
  total: number
  completed: number
  easy: number
  medium: number
  hard: number
  completionRate: number
}

export default function ProfilePage() {
  const { user, setUser } = useUserStore()
  const [stats, setStats] = useState<QuestStats>({
    total: 0,
    completed: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    completionRate: 0
  })
  const [recentQuests, setRecentQuests] = useState<any[]>([])
  const [topSkills, setTopSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [memberSince, setMemberSince] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
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
          day: 'numeric'
        }))
      }

      // Fetch all quests with details
      const { data: allQuests } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', authUser.id)

      if (allQuests) {
        const completed = allQuests.filter(q => q.is_completed)
        const easy = allQuests.filter(q => q.difficulty === 'easy')
        const medium = allQuests.filter(q => q.difficulty === 'medium')
        const hard = allQuests.filter(q => q.difficulty === 'hard')
        
        setStats({
          total: allQuests.length,
          completed: completed.length,
          easy: easy.length,
          medium: medium.length,
          hard: hard.length,
          completionRate: allQuests.length > 0 
            ? Math.round((completed.length / allQuests.length) * 100) 
            : 0
        })

        // Get recent 5 quests
        setRecentQuests(allQuests.slice(0, 5))
      }

      // Fetch top skills (highest level)
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', authUser.id)
        .order('level', { ascending: false })
        .limit(3)

      if (userSkills) setTopSkills(userSkills)

      setLoading(false)
    }

    fetchData()
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-purple-400 text-xl"
        >
          ⚔️ Loading your  profile...
        </motion.div>
      </div>
    )
  }

  const xpProgress = user ? (user.xp / XP_PER_LEVEL) * 100 : 0

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400'
      case 'hard': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            👤 Hero Profile
          </h1>
          <p className="text-gray-400 mt-2">
            Track your progress, achievements, and gaming stats
          </p>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6 mb-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-5xl shadow-lg shadow-purple-500/30">
                ⚔️
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-black">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold">{user?.username}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Level {user?.level} Hero
                </Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Member since {memberSince}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/quests">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  ⚔️ New Quest
                </Button>
              </Link>
              <Link href="/skills">
                <Button variant="outline" className="border-gray-700 hover:border-purple-500">
                  🧠 View Skills
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - XP & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* XP Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span> Experience Progress
              </h3>
              <div className="flex justify-between mb-3">
                <span className="text-gray-400">Current Level {user?.level}</span>
                <span className="text-purple-400 font-bold">{user?.xp} / {XP_PER_LEVEL} XP</span>
              </div>
              <Progress value={xpProgress} className="h-3 bg-gray-800" />
              <p className="text-gray-500 text-sm mt-3">
                {XP_PER_LEVEL - (user?.xp ?? 0)} XP needed to reach Level {(user?.level ?? 1) + 1}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total XP Earned:</span>
                  <span className="text-purple-400 font-medium">
                    {(user?.level || 1) * XP_PER_LEVEL + (user?.xp || 0) - XP_PER_LEVEL} XP
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quest Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📊</span> Quest Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <p className="text-3xl font-bold text-purple-400">{stats.total}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Quests</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
                  <p className="text-xs text-gray-400 mt-1">Completed</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Completion Rate</span>
                  <span className="text-sm font-medium text-purple-400">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2 bg-gray-800" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-sm font-medium text-green-400">{stats.easy}</div>
                  <div className="text-xs text-gray-500">Easy Quests</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-yellow-400">{stats.medium}</div>
                  <div className="text-xs text-gray-500">Medium Quests</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-red-400">{stats.hard}</div>
                  <div className="text-xs text-gray-500">Hard Quests</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Top Skills & Recent Quests */}
          <div className="space-y-6">
            {/* Top Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>🏆</span> Top Skills
                </h3>
                <Link href="/skills" className="text-xs text-purple-400 hover:text-purple-300">
                  View All →
                </Link>
              </div>
              
              {topSkills.length > 0 ? (
                <div className="space-y-3">
                  {topSkills.map((skill, index) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {skill.skills.name === 'Coding' && '💻'}
                          {skill.skills.name === 'Fitness' && '💪'}
                          {skill.skills.name === 'English' && '📚'}
                          {skill.skills.name === 'Finance' && '💰'}
                          {skill.skills.name === 'Mindfulness' && '🧘'}
                          {skill.skills.name === 'Creativity' && '🎨'}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{skill.skills.name}</p>
                          <p className="text-xs text-gray-500">Level {skill.level}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        Lv.{skill.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No skills yet. Complete quests to level up!
                </p>
              )}
            </motion.div>

            {/* Recent Quests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>📋</span> Recent Quests
                </h3>
                <Link href="/quests" className="text-xs text-purple-400 hover:text-purple-300">
                  View All →
                </Link>
              </div>
              
              {recentQuests.length > 0 ? (
                <div className="space-y-2">
                  {recentQuests.slice(0, 3).map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{quest.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                            {quest.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">+{quest.xp_reward} XP</span>
                        </div>
                      </div>
                      {quest.is_completed ? (
                        <span className="text-green-400 text-sm">✓ Done</span>
                      ) : (
                        <span className="text-yellow-400 text-sm">⚡ Active</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No quests yet. Start your journey!
                </p>
              )}
              
              <Link href="/quests">
                <Button variant="outline" className="w-full mt-4 border-gray-700 hover:border-purple-500">
                  + Add New Quest
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6"
        >
          <Link href="/quests">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center hover:border-purple-500 hover:bg-purple-500/10 transition-all cursor-pointer">
              <div className="text-2xl mb-1">⚔️</div>
              <p className="text-sm font-medium">Quests</p>
            </div>
          </Link>
          <Link href="/skills">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center hover:border-purple-500 hover:bg-purple-500/10 transition-all cursor-pointer">
              <div className="text-2xl mb-1">🧠</div>
              <p className="text-sm font-medium">Skills</p>
            </div>
          </Link>
          <Link href="/dashboard">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center hover:border-purple-500 hover:bg-purple-500/10 transition-all cursor-pointer">
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-sm font-medium">Dashboard</p>
            </div>
          </Link>
          <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-sm font-medium">Achievements</p>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}