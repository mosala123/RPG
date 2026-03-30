'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Quest, Difficulty, Skill } from '@/types'

const XP_REWARDS: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
}

const difficultyColor = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const SKILL_ICONS: Record<string, string> = {
  Coding: '💻',
  Fitness: '💪',
  English: '📚',
  Finance: '💰',
  Mindfulness: '🧘',
  Creativity: '🎨',
}

export default function QuestsPage() {
  const { user, addXP } = useUserStore()
  const [quests, setQuests] = useState<Quest[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [xpPopup, setXpPopup] = useState<number | null>(null)
  const [levelUpPopup, setLevelUpPopup] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [completedCount, setCompletedCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)

  const fetchQuests = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (data) {
      setQuests(data as Quest[])
      setCompletedCount(data.filter(q => q.is_completed).length)
      setActiveCount(data.filter(q => !q.is_completed).length)
    }
  }, [])

  const fetchSkills = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('skills').select('*')
    if (data) setSkills(data as Skill[])
  }, [])

  useEffect(() => {
    fetchQuests()
    fetchSkills()
    const interval = setInterval(fetchQuests, 15000)
    return () => clearInterval(interval)
  }, [fetchQuests, fetchSkills])

  const handleAddQuest = async () => {
    if (!title.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const newQuest = {
      user_id: authUser.id,
      title,
      description,
      difficulty,
      xp_reward: XP_REWARDS[difficulty],
      is_completed: false,
      skill_id: selectedSkill,
    }

    const { data } = await supabase.from('quests').insert(newQuest).select().single()
    if (data) {
      setQuests(prev => [data as Quest, ...prev])
      setActiveCount(prev => prev + 1)
    }

    setTitle('')
    setDescription('')
    setDifficulty('easy')
    setSelectedSkill(null)
    setLoading(false)
  }

  const handleComplete = async (quest: Quest) => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    await supabase
      .from('quests')
      .update({ is_completed: true })
      .eq('id', quest.id)

    const currentXP = (user?.xp ?? 0) + quest.xp_reward
    const currentLevel = user?.level ?? 1
    const newLevel = currentXP >= 100
      ? currentLevel + Math.floor(currentXP / 100)
      : currentLevel
    const newXP = currentXP % 100

    await supabase
      .from('users')
      .update({ xp: newXP, level: newLevel })
      .eq('id', authUser.id)

    if (newLevel > currentLevel) {
      setLevelUpPopup(newLevel)
      setTimeout(() => setLevelUpPopup(null), 3000)
    }

    addXP(quest.xp_reward)

    if (quest.skill_id) {
      const { data: userSkill } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('skill_id', quest.skill_id)
        .single()

      if (userSkill) {
        const newSkillXP = (userSkill.xp ?? 0) + quest.xp_reward
        const newSkillLevel = userSkill.level + Math.floor(newSkillXP / 100)
        const remainingXP = newSkillXP % 100

        await supabase
          .from('user_skills')
          .update({ xp: remainingXP, level: newSkillLevel })
          .eq('id', userSkill.id)
      }
    }

    setXpPopup(quest.xp_reward)
    setTimeout(() => setXpPopup(null), 2000)

    setQuests(prev => prev.map(q =>
      q.id === quest.id ? { ...q, is_completed: true } : q
    ))
    setCompletedCount(prev => prev + 1)
    setActiveCount(prev => prev - 1)
  }

  const handleDelete = async (questId: string, isCompleted: boolean) => {
    const supabase = createClient()
    await supabase.from('quests').delete().eq('id', questId)
    setQuests(prev => prev.filter(q => q.id !== questId))
    if (isCompleted) setCompletedCount(prev => prev - 1)
    else setActiveCount(prev => prev - 1)
  }

  const getSkillName = (skillId: string | null) => {
    if (!skillId) return null
    return skills.find(s => s.id === skillId)?.name ?? null
  }

  const filteredQuests = quests.filter(q => {
    if (filter === 'active') return !q.is_completed
    if (filter === 'completed') return q.is_completed
    return true
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/20 p-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                ⚔️ Quests
              </h1>
              <p className="text-gray-400 mt-1">Complete quests to earn XP and level up!</p>
            </div>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                <p className="text-yellow-400 font-bold text-xl">{activeCount}</p>
                <p className="text-gray-500 text-xs">Active</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border border-green-500/30 bg-green-500/10">
                <p className="text-green-400 font-bold text-xl">{completedCount}</p>
                <p className="text-gray-500 text-xs">Done</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* XP Popup */}
        <AnimatePresence>
          {xpPopup && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: 1 }}
              exit={{ opacity: 0, y: -100 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-black font-bold text-2xl px-6 py-3 rounded-2xl shadow-lg shadow-yellow-500/50"
            >
              +{xpPopup} XP ⚡
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Up Popup */}
        <AnimatePresence>
          {levelUpPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="relative z-10 text-center p-10 rounded-3xl border border-purple-500/50 bg-gray-900 shadow-2xl shadow-purple-500/20"
              >
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  LEVEL UP!
                </h2>
                <p className="text-gray-400 mt-3 text-xl">
                  You reached Level <span className="text-purple-400 font-bold">{levelUpPopup}</span>
                </p>
                <p className="text-gray-500 mt-2 text-sm">Keep going, hero! 💪</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Quest Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80"
        >
          <h2 className="text-xl font-bold mb-4">➕ New Quest</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Quest Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Study HTML for 2 hours"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Focus on semantic elements"
              />
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-gray-300">Difficulty</Label>
              <div className="flex gap-3 mt-2 flex-wrap">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-xl border capitalize font-medium transition-all ${
                      difficulty === d
                        ? difficultyColor[d]
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {d} (+{XP_REWARDS[d]} XP)
                  </button>
                ))}
              </div>
            </div>

            {/* Skill */}
            <div>
              <Label className="text-gray-300">
                Linked Skill
                <span className="text-gray-600 text-xs ml-2">(links XP to skill)</span>
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedSkill === null
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  None
                </button>
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill.id)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedSkill === skill.id
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {SKILL_ICONS[skill.name] ?? '⭐'} {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddQuest}
              disabled={loading || !title.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 py-5 rounded-xl text-base font-bold"
            >
              {loading ? '⏳ Adding...' : '➕ Add Quest'}
            </Button>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              {f === 'all' && `All (${quests.length})`}
              {f === 'active' && `Active (${activeCount})`}
              {f === 'completed' && `Done (${completedCount})`}
            </button>
          ))}
        </div>

        {/* Quests List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  quest.is_completed
                    ? 'border-gray-800 bg-gray-900/30 opacity-60'
                    : 'border-gray-700 bg-gray-800/50 hover:border-purple-500/30'
                }`}
              >
                <div className="flex-1">
                  <p className={`font-medium ${quest.is_completed ? 'line-through text-gray-500' : ''}`}>
                    {quest.title}
                  </p>
                  {quest.description && (
                    <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={difficultyColor[quest.difficulty]}>
                      {quest.difficulty}
                    </Badge>
                    <span className="text-yellow-400 text-sm font-bold">
                      +{quest.xp_reward} XP
                    </span>
                    {quest.skill_id && getSkillName(quest.skill_id) && (
                      <span className="text-purple-400 text-sm">
                        {SKILL_ICONS[getSkillName(quest.skill_id)!] ?? '⭐'} {getSkillName(quest.skill_id)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!quest.is_completed ? (
                    <Button
                      onClick={() => handleComplete(quest)}
                      className="bg-green-600 hover:bg-green-700 rounded-xl"
                    >
                      ✓ Complete
                    </Button>
                  ) : (
                    <span className="text-green-400 font-bold text-sm">✓ Done</span>
                  )}
                  <button
                    onClick={() => handleDelete(quest.id, quest.is_completed)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-lg px-2"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredQuests.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-5xl mb-3">
                {filter === 'completed' ? '🏆' : '🎯'}
              </div>
              <p className="text-gray-400 font-medium">
                {filter === 'completed' ? 'No completed quests yet!' : 'No quests here!'}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {filter === 'completed' ? 'Complete some quests to see them here' : 'Add your first quest above!'}
              </p>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}