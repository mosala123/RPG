import { create } from 'zustand'
import { User } from '@/types'

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
  addXP: (xp: number) => void
}

const XP_PER_LEVEL = 100

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  addXP: (xp) =>
    set((state) => {
      if (!state.user) return state

      let newXP = state.user.xp + xp
      let newLevel = state.user.level

      while (newXP >= XP_PER_LEVEL) {
        newXP -= XP_PER_LEVEL
        newLevel += 1
      }

      return {
        user: {
          ...state.user,
          xp: newXP,
          level: newLevel,
        },
      }
    }),
}))