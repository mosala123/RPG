'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AuthFormProps {
  type: 'login' | 'signup'
  email: string
  password: string
  username?: string
  loading: boolean
  error: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onUsernameChange?: (v: string) => void
  onSubmit: () => void
}

export default function AuthForm({
  type,
  email,
  password,
  username,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onUsernameChange,
  onSubmit,
}: AuthFormProps) {
  return (
    <div className="space-y-4">
      {type === 'signup' && (
        <div>
          <Label className="text-gray-300">Username</Label>
          <Input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange?.(e.target.value)}
            className="mt-1 bg-gray-800 border-gray-700 text-white"
            placeholder="HeroName"
          />
        </div>
      )}

      <div>
        <Label className="text-gray-300">Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="mt-1 bg-gray-800 border-gray-700 text-white"
          placeholder="hero@example.com"
        />
      </div>

      <div>
        <Label className="text-gray-300">Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="mt-1 bg-gray-800 border-gray-700 text-white"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg rounded-xl"
      >
        {loading ? 'Loading...' : type === 'login' ? '⚔️ Login' : '🚀 Start Journey'}
      </Button>
    </div>
  )
}
```
src/components/dashboard/StatsCard.tsx