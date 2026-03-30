'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LevelUpPopupProps {
  level: number
  show: boolean
  onClose: () => void
}

export default function LevelUpPopup({ level, show, onClose }: LevelUpPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative z-10 text-center p-10 rounded-3xl border border-purple-500/50 bg-gray-900 shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stars */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i / 6) * Math.PI * 2) * 80,
                  y: Math.sin((i / 6) * Math.PI * 2) * 80,
                }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="absolute top-1/2 left-1/2 text-yellow-400 text-2xl"
              >
                ⭐
              </motion.div>
            ))}

            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            >
              LEVEL UP!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mt-3 text-xl"
            >
              You reached Level{' '}
              <span className="text-purple-400 font-bold text-2xl">{level}</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 mt-2 text-sm"
            >
              Keep going, hero! 💪
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition-all"
            >
              Continue ⚔️
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}