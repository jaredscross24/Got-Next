import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const SKILL_LEVELS = [
  { value: 'recreational', label: 'Recreational / Never played organized ball' },
  { value: 'middle_school', label: 'Middle School' },
  { value: 'hs_jv', label: 'High School JV' },
  { value: 'hs_varsity', label: 'High School Varsity' },
  { value: 'college_club', label: 'College Club / Intramural' },
  { value: 'college_d3', label: 'College D3' },
  { value: 'college_d2', label: 'College D2' },
  { value: 'college_d1', label: 'College D1' },
  { value: 'semi_pro', label: 'Semi-Pro / Pro / Overseas' },
]

const PLAY_STYLES = [
  { value: 'casual', label: '🎮 Casual', desc: 'Just having fun, no stress' },
  { value: 'competitive', label: '⚔️ Competitive', desc: 'Serious runs, call your own fouls' },
  { value: 'league', label: '🏆 League', desc: 'Organized, recurring, tracked wins/losses' },
]

function Avatar({ user, size = 80 }) {
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, flexShrink: 0 }}>
      {user?.profile_photo_url ? (
        <img src={user.profile_photo_url} alt={user.full_name} />
      ) : (
        initials
      )}
    </div>
  )
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    full_name: '', age: '', city: '', skill_level: '', play_style: '',
  })
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devOtp, setDevOtp] = useState('')

  const [saving, setSaving] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [msg, setMsg] = useState({ type: '', text: '' })
  const fileRef = useRef()

  const showVerifySection = searchParams.get('verify') === 'true'

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        age: user.age || '',
        city: user.city || '',
        skill_level: user.skill_level || '',
        play_style: user.play_style || '',
      })
      setPhone(user.phone || '')
    }
  }, [user])

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg({ type: '', text: '' }), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', {
        full_name: form.full_name,
        age: form.age ? parseInt(form.age, 10) : null,
        city: form.city,
        skill_level: form.skill_level,
        play_style: form.play_style,
      })
      await refreshUser()
      flash('success', 'Profile saved!')
    } catch (err) {
      flash('error', err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      await api.post('/users/me/photo', fd)
      await refreshUser()
      flash('success', 'Photo updated!')
    } catch (err) {
      flash('error', 'Photo upload failed')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone.trim()) { flash('error', 'Enter a phone number first'); return }
    setSendingOtp(true)
    try {
      const res = await api.post('/auth/send-otp', { phone: phone.trim() })
      setOtpSent(true)
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp)
      flash('success', 'Code sent! Check your phone.')
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to send code')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true)
    try {
      await api.post('/auth/verify-otp', { otp: otpCode })
      await refreshUser()
      setOtpSent(false)
      setOtpCode('')
      setDevOtp('')
      flash('success', 'Phone verified!')
    } catch (err) {
      flash('error', err.response?.data?.error || 'Incorrect code')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Profile</h1>
        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          style={{ marginLeft: 'auto' }}
        >
          Sign Out
        </button>
      </div>

      <div className="page-content">
        {msg.text && (
          <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>
            {msg.text}
          </div>
        )}

        {/* Photo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Avatar user={user} size={80} />
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploadingPhoto}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--primary)', border: '2px solid var(--bg)',
                color: 'white', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {uploadingPhoto ? '…' : '📷'}
            </button>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhoto} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.full_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user?.email}</div>
            {user?.phone_verified && (
              <span className="badge badge-green" style={{ marginTop: 4, fontSize: 11 }}>
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Basic Info
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" min="13" max="100" value={form.age} onChange={set('age')} placeholder="Age" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={set('city')} placeholder="Your city" />
            </div>
          </div>
        </div>

        {/* Skill level */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Skill Level
          </h3>
          <select
            className="select"
            value={form.skill_level}
            onChange={set('skill_level')}
          >
            <option value="">Select your highest level…</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Play style */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Default Play Style
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLAY_STYLES.map((s) => (
              <button
                key={s.value}
                className={`chip ${form.play_style === s.value ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', borderRadius: 10, padding: '10px 14px' }}
                onClick={() => setForm((f) => ({ ...f, play_style: s.value }))}
              >
                <span style={{ fontWeight: 600 }}>{s.label}</span>
                <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>— {s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleSave}
          disabled={saving}
          style={{ marginBottom: 20 }}
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>

        {/* Phone verification */}
        <div className="card" style={{ padding: 16, marginBottom: 24 }} id="verify">
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Phone Verification
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Required to join any court queue. Your number is never shown publicly.
          </p>

          {user?.phone_verified ? (
            <div className="alert alert-success">
              ✓ Phone verified — {user.phone}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {sendingOtp ? '…' : otpSent ? 'Resend' : 'Send Code'}
                </button>
              </div>

              {devOtp && (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  <strong>Dev mode:</strong> Your OTP is <strong>{devOtp}</strong>
                </div>
              )}

              {otpSent && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length !== 6}
                  >
                    {verifyingOtp ? '…' : 'Verify'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
