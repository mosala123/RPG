interface StatsCardProps {
  label: string
  value: string | number
  color: 'purple' | 'cyan' | 'yellow' | 'green'
}

const colorMap = {
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  green: 'border-green-500/30 bg-green-500/10 text-green-400',
}

export default function StatsCard({ label, value, color }: StatsCardProps) {
  return (
    <div className={`p-6 rounded-2xl border ${colorMap[color]}`}>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-5xl font-bold mt-2 ${colorMap[color].split(' ')[2]}`}>
        {value}
      </p>
    </div>
  )
}