import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Quest } from '@/types'

interface QuestCardProps {
  quest: Quest
  onComplete: (quest: Quest) => void
}

const difficultyColor = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function QuestCard({ quest, onComplete }: QuestCardProps) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      quest.is_completed
        ? 'border-gray-800 bg-gray-900/30 opacity-50'
        : 'border-gray-700 bg-gray-800/50'
    }`}>
      <div className="flex-1">
        <p className={`font-medium ${quest.is_completed ? 'line-through text-gray-500' : ''}`}>
          {quest.title}
        </p>
        {quest.description && (
          <p className="text-gray-400 text-sm mt-1">{quest.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge className={difficultyColor[quest.difficulty]}>
            {quest.difficulty}
          </Badge>
          <span className="text-yellow-400 text-sm font-bold">+{quest.xp_reward} XP</span>
        </div>
      </div>

      {!quest.is_completed ? (
        <Button
          onClick={() => onComplete(quest)}
          className="ml-4 bg-green-600 hover:bg-green-700 rounded-xl"
        >
          ✓ Complete
        </Button>
      ) : (
        <span className="ml-4 text-green-400 font-bold">✓ Done</span>
      )}
    </div>
  )
}
 