import React from 'react'

const SKILL_LABELS = {
  recreational: 'Rec',
  middle_school: 'Middle School',
  hs_jv: 'HS JV',
  hs_varsity: 'HS Varsity',
  college_club: 'College Club',
  college_d3: 'D3',
  college_d2: 'D2',
  college_d1: 'D1',
  semi_pro: 'Pro / Semi-Pro',
}

const PLAY_STYLE_LABELS = {
  casual: '🎮 Casual',
  competitive: '⚔️ Competitive',
  league: '🏆 League',
}

const FORMAT_COLORS = {
  '1v1': '#e91e63',
  '2v2': '#9c27b0',
  '3v3': '#2196f3',
  '4v4': '#009688',
  '5v5': '#FF6B2B',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

function Avatar({ user, size = 40 }) {
  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, flexShrink: 0 }}
    >
      {user.profile_photo_url ? (
        <img
          src={user.profile_photo_url}
          alt={user.full_name}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        initials
      )}
    </div>
  )
}

export default function QueueList({ queue, currentUserId }) {
  if (!queue.length) return null

  return (
    <div>
      {queue.map((entry, i) => (
        <div
          key={entry.id}
          className="queue-entry"
          style={entry.user_id === currentUserId ? { border: '1.5px solid var(--primary)' } : {}}
        >
          <div style={{ position: 'relative' }}>
            <Avatar user={entry} />
            <span
              style={{
                position: 'absolute', bottom: -2, right: -2,
                background: '#1a1a1a', borderRadius: '50%',
                fontSize: 10, width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: 'var(--text-muted)',
              }}
            >
              {i + 1}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              {entry.full_name}
              {entry.user_id === currentUserId && (
                <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700 }}>YOU</span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <span
                className="badge"
                style={{
                  background: FORMAT_COLORS[entry.game_format] + '22',
                  color: FORMAT_COLORS[entry.game_format],
                  fontSize: 11,
                }}
              >
                {entry.game_format}
              </span>
              {entry.play_style && (
                <span className="badge badge-orange" style={{ fontSize: 11 }}>
                  {PLAY_STYLE_LABELS[entry.play_style] || entry.play_style}
                </span>
              )}
              {entry.skill_level && (
                <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 11 }}>
                  {SKILL_LABELS[entry.skill_level] || entry.skill_level}
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(entry.created_at)}</div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{timeUntil(entry.expires_at)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
