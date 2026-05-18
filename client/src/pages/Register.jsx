import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.email.trim(), form.password, form.full_name.trim())
      navigate('/profile?onboard=true')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">🏀</div>
      <h1 className="auth-title">Join Got Next</h1>
      <p className="auth-subtitle">Create your player profile</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label className="label">Full Name</label>
          <input
            type="text"
            className="input"
            placeholder="Jordan Miller"
            value={form.full_name}
            onChange={set('full_name')}
            required
          />
        </div>

        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label className="label">Confirm Password</label>
          <input
            type="password"
            className="input"
            placeholder="Repeat password"
            value={form.confirm}
            onChange={set('confirm')}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <div className="auth-links">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  )
}
