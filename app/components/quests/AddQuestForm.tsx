'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Difficulty } from '@/types'

interface AddQuestFormProps {
  title: string
  description: string
  difficulty: Difficulty
  loading: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onDifficultyChange: (v: Difficulty) => void
  onSubmit: () => void
}

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

export default function AddQuestForm({
  title,
  description,
  difficulty,
  loading,
  onTitleChange,
  onDescriptionChange,
  onDifficultyChange,
  onSubmit,
}: AddQuestFormProps) {
  return (
    <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80">
      <h2 className="text-xl font-bold mb-4">➕ New Quest</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-gray-300">Quest Title</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mt-1 bg-gray-800 border-gray-700 text-white"
            placeholder="e.g. Study for 2 hours"
          />
        </div>
        <div>
          <Label className="text-gray-300">Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="mt-1 bg-gray-800 border-gray-700 text-white"
            placeholder="e.g. Focus on algorithms"
          />
        </div>
        <div>
          <Label className="text-gray-300">Difficulty</Label>
          <div className="flex gap-3 mt-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
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
        <Button
          onClick={onSubmit}
          disabled={loading || !title.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 py-5 rounded-xl"
        >
          {loading ? 'Adding...' : '➕ Add Quest'}
        </Button>
      </div>
    </div>
  )
}