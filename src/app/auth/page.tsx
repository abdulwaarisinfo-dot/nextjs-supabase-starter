'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] fade-up">

        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0066CC] rounded-2xl mb-5 shadow-lg shadow-blue-200">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 4h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" stroke="white" strokeWidth="1.5"/>
              <path d="M9 9h10M9 13h10M9 17h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">BillKar</h1>
          <p className="text-[15px] text-[#6E6E73] mt-1">Simple billing for your shop</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-[19px] font-semibold text-[#1D1D1F] mb-6">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label block mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label block mb-2">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="text-[13px] text-[#FF3B30] bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="text-[13px] text-[#34C759] bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                {success}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[#E5E5E7] text-center">
            <span className="text-[14px] text-[#6E6E73]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              className="text-[14px] text-[#0066CC] font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-[#AEAEB2] mt-6">
          Your data is private and secure.
        </p>
      </div>
    </div>
  )
}
