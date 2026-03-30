export type Difficulty = 'easy' | 'medium' | 'hard'

export interface User {
  id: string
  email: string
  username: string
  level: number
  xp: number
  streak: number
  last_active: string | null
  created_at: string
}

export interface Quest {
  id: string
  user_id: string
  title: string
  description: string
  difficulty: Difficulty
  xp_reward: number
  is_completed: boolean
  skill_id: string | null
  created_at: string
}

export interface Skill {
  id: string
  name: string
}

export interface UserSkill {
  id: string
  user_id: string
  skill_id: string
  level: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}