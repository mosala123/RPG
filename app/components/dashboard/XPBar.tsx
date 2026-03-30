import { Progress } from '@/components/ui/progress'

interface XPBarProps {
  xp: number
  level: number
  xpPerLevel?: number
}

export default function XPBar({ xp, level, xpPerLevel = 100 }: XPBarProps) {
  const progress = (xp / xpPerLevel) * 100

  return (
    <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/80">
      <div className="flex justify-between mb-3">
        <span className="text-gray-400">XP Progress</span>
        <span className="text-purple-400 font-bold">{xp} / {xpPerLevel} XP</span>
      </div>
      <Progress value={progress} className="h-3" />
      <p className="text-gray-500 text-sm mt-2">
        {xpPerLevel - xp} XP until level {level + 1}
      </p>
    </div>
  )
}