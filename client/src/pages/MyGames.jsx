import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const STATUS_COLORS = {
  forming: { bg: 'rgba(255,107,43,0.15)', color: 'var(--primary)' },
  active: { bg: 'rgba(76,175,80,0.15)', color: '#4CAF50' },
  completed: { bg: 'rgba(136,136,136,0.15)', color: '#888' },
}

const STATUS_LABELS = { forming: 'Forming', active: 'In Progress', completed: 'Completed' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return `${mins}m ago`
}

export default function MyGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/games/me')
      .then((res) => setGames(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Games</h1>
      </div>

      <div className="page-content">
        {loading && (
          <div className="loading" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && games.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏀</div>
            <h2 style={{ marginBottom: 8 }}>No games yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Find a court and call next to get in the game!
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Find Courts
            </button>
          </div>
        )}

        {games.map((game) => {
          const colors = STATUS_COLORS[game.status] || STATUS_COLORS.forming
          return (
            <div
              key={game.id}
              className="card"
              style={{ padding: 16, marginBottom: 12, cursor: game.court_id ? 'pointer' : 'default' }}
              onClick={() => game.court_id && navigate(`/court/${game.court_id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                    {game.court_name || 'Unknown Court'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {[game.court_city, game.court_country].filter(Boolean).join(', ')}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{ background: colors.bg, color: colors.color }}
                >
                  {STATUS_LABELS[game.status] || game.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-orange">{game.format}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  {game.participant_ids?.length || 0} players
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 'auto' }}>
                  {timeAgo(game.created_at)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
