import React, { useState } from 'react'
import { login } from '../lib/api'
import { setStoredAuth } from '../lib/auth'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !code) { setError('Email and access code are required.'); return }
    setLoading(true)
    setError('')
    try {
      const data = await login(email, code)
      setStoredAuth({ apiKey: code, name: data.name, email: data.email })
      onLogin()
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏘</span>
          <div>
            <div className="font-bold text-slate-900 text-sm">Ping Analyst</div>
            <div className="text-xs text-slate-400">Real estate underwriting</div>
          </div>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email and access code to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Access Code
            </label>
            <input
              className="input font-mono tracking-wide"
              type="text"
              placeholder="PING-XXXX-XXXXX"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
