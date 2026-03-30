'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchQuests()
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('skills').select('*')
    if (data) setSkills(data as Skill[])
  }

  const fetchQuests = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (data) setQuests(data as Quest[])
  }

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
    if (data) setQuests([data as Quest, ...quests])

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

    // Complete the quest
    await supabase
      .from('quests')
      .update({ is_completed: true })
      .eq('id', quest.id)

    // Update XP and Level
    const newXP = (user?.xp ?? 0) + quest.xp_reward
    const newLevel = Math.floor(newXP / 100) + 1

    await supabase
      .from('users')
      .update({ xp: newXP % 100, level: newLevel })
      .eq('id', authUser.id)

    addXP(quest.xp_reward)

    // Update skill level if quest has a skill
    if (quest.skill_id) {
      const { data: userSkill } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('skill_id', quest.skill_id)
        .single()

      if (userSkill) {
        await supabase
          .from('user_skills')
          .update({ level: userSkill.level + 1 })
          .eq('id', userSkill.id)
      }
    }

    setXpPopup(quest.xp_reward)
    setTimeout(() => setXpPopup(null), 2000)

    setQuests(quests.map(q =>
      q.id === quest.id ? { ...q, is_completed: true } : q
    ))
  }

  const getSkillName = (skillId: string | null) => {
    if (!skillId) return null
    return skills.find(s => s.id === skillId)?.name ?? null
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
        >
          ⚔️ Quests
        </motion.h1>

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
              <Label className="text-gray-300">Quest Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Study for 2 hours"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                placeholder="e.g. Focus on algorithms"
              />
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-gray-300">Difficulty</Label>
              <div className="flex gap-3 mt-2">
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
              <Label className="text-gray-300">Linked Skill (optional)</Label>
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
              className="w-full bg-purple-600 hover:bg-purple-700 py-5 rounded-xl"
            >
              {loading ? 'Adding...' : '➕ Add Quest'}
            </Button>
          </div>
        </motion.div>

        {/* Quests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-xl font-bold">📋 Your Quests</h2>
          <AnimatePresence>
            {quests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  quest.is_completed
                    ? 'border-gray-800 bg-gray-900/30 opacity-50'
                    : 'border-gray-700 bg-gray-800/50'
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
                {!quest.is_completed ? (
                  <Button
                    onClick={() => handleComplete(quest)}
                    className="ml-4 bg-green-600 hover:bg-green-700 rounded-xl"
                  >
                    ✓ Complete
                  </Button>
                ) : (
                  <span className="ml-4 text-green-400 font-bold">✓ Done</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {quests.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No quests yet. Add your first quest above!
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}