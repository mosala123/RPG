'use client'

import { motion, useScroll, useTransform, easeInOut } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Floating animation for background elements
  const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: easeInOut
    }
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-cyan-900/30 animate-gradient" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"
        animate={floatingAnimation}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{
          ...floatingAnimation,
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: easeInOut }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: easeInOut }}
      />

      {/* Enhanced grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Diagonal lines pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_65%,rgba(139,92,246,0.03)_75%,rgba(6,182,212,0.03)_85%,transparent_95%)]" />

      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{ opacity, scale }}
      >
        <div className="text-center max-w-7xl mx-auto">

          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="inline-block mb-6"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative px-5 py-2 rounded-full border border-purple-500/50 bg-purple-500/10 backdrop-blur-sm">
                <span className="text-purple-300 text-sm font-medium">
                  ⚔️ Level Up Your Life
                </span>
              </div>
            </div>
          </motion.div>

          {/* Main title with enhanced gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, type: "spring", bounce: 0.2 }}
            className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Life RPG
            </span>
          </motion.h1>

          {/* Subtitle with better readability */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto px-4"
          >
            Transform your daily tasks into epic quests. Gain XP, level up, and become the hero of your own story.
          </motion.p>

          {/* Buttons with improved responsiveness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  🚀 Start Your Journey
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 1 }}
                  >
                    →
                  </motion.span>
                </span>
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:border-gray-600 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl transition-all duration-300"
              >
                Login
              </Button>
            </Link>
          </motion.div>

          {/* Stats with improved layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto px-4"
          >
            {[
              { label: 'Quests Completed', value: '10K+', icon: '⚔️' },
              { label: 'XP Gained', value: '1M+', icon: '⚡' },
              { label: 'Active Users', value: '5K+', icon: '👥' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-gray-500 text-sm">Scroll to explore</span>
              <div className="w-5 h-8 border-2 border-gray-500 rounded-full flex justify-center">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1 h-2 bg-purple-500 rounded-full mt-1"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes gradient {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          animation: gradient 4s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </main>
  )
}