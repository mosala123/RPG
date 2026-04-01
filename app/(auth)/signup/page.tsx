'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    if (!email || !password || !username) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          username,
          level: 1,
          xp: 0,
        })

        if (profileError) {
          // لو الـ profile اتعمل قبل كده مش مشكلة
          if (!profileError.message.includes('duplicate')) {
            setError(profileError.message)
            setLoading(false)
            return
          }
        }

        // لو Supabase محتاج email confirmation
        if (data.session) {
          window.location.href = '/dashboard'
        } else {
          // في حالة إن email confirmation مطلوب
          setSuccess(true)
          setLoading(false)
        }
      }
    } catch (err) {
      setError('Something went wrong, please try again')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl border border-green-500/30 bg-green-500/10 max-w-md"
        >
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Check your email!</h2>
          <p className="text-gray-400">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            Click it to activate your account then{' '}
            <a href="/login" className="text-purple-400 hover:underline">login here</a>.
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Begin Your Quest
          </h1>
          <p className="text-gray-400 mt-2">Create your hero account</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 bg-gray-800 border-gray-700 text-white"
              placeholder="HeroName"
              autoComplete="username"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-gray-800 border-gray-700 text-white"
              placeholder="hero@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              className="mt-1 bg-gray-800 border-gray-700 text-white"
              placeholder="••••••••  (min 6 characters)"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2"
            >
              ❌ {error}
            </motion.p>
          )}

          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg rounded-xl"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : '🚀 Start Journey'}
          </Button>
        </div>

        <p className="text-center text-gray-500 mt-6">
          Already a hero?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Login
          </Link>
        </p>
      </motion.div>
    </main>
  )
}