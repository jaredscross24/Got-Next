import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import QueueList from '../components/Queue/QueueList'
import api from '../api/client'

const GAME_FORMATS = ['1v1', '2v2', '3v3', '4v4', '5v5']
const FORMAT_PLAYERS = { '1v1': 2, '2v2': 4, '3v3': 6, '4v4': 8, '5v5': 10 }
const PLAY_STYLES = [
  { value: 'casual', label: '🎮 Casual', desc: 'Just having fun, no stress' },
  { value: 'competitive', label: '⚔️ Competitive', desc: 'Serious runs, call your own fouls' },
  { value: 'league', label: '🏆 League', desc: 'Organized, recurring, tracked wins/losses' },
]

function PhotoGallery({ urls }) {
  const [idx, setIdx] = useState(0)
  if (!urls || urls.length === 0) {
    return (
      <div style={{
        height: 180, background: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 64,
      }}>
        🏀
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
      <img
        src={urls[idx]}
        alt="Court"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {urls.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6,
        }}>
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none',
                background: i === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const socket = useSocket()

  const [court, setCourt] = useState(null)
  const [queue, setQueue] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [gameFormat, setGameFormat] = useState('5v5')
  const [playStyle, setPlayStyle] = useState('casual')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [gameReady, setGameReady] = useState(null)

  const inQueue = queue.some((e) => e.user_id === user?.id)

  useEffect(() => {
    Promise.all([fetchCourt(), fetchQueue()]).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!socket) return

    socket.emit('join_court', id)

    socket.on('queue_updated', (q) => setQueue(q))
    socket.on('game_ready', (data) => {
      setGameReady(data)
      setTimeout(() => setGameReady(null), 12000)
    })

    return () => {
      socket.emit('leave_court', id)
      socket.off('queue_updated')
      socket.off('game_ready')
    }
  }, [socket, id])

  const fetchCourt = async () => {
    try {
      const res = await api.get(`/courts/${id}`)
      setCourt(res.data)
    } catch {
      navigate('/')
    }
  }

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/queue/court/${id}`)
      setQueue(res.data)
    } catch { /* non-critical */ }
  }

  const handleGotNext = async () => {
    if (!user.phone_verified) {
      navigate('/profile?verify=true')
      return
    }
    setJoining(true)
    setError('')
    try {
      const res = await api.post(`/queue/court/${id}`, { game_format: gameFormat, play_style: playStyle })
      setQueue(res.data.queue)
      setShowModal(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join queue')
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveQueue = async () => {
    try {
      const res = await api.delete(`/queue/court/${id}`)
      setQueue(res.data.queue)
    } catch { /* non-critical */ }
  }

  if (loading) {
    return <div className="loading" style={{ height: '100vh' }}><div className="spinner" /></div>
  }
  if (!court) return null

  const needsPlayers = FORMAT_PLAYERS[gameFormat] - queue.filter((e) => e.game_format === gameFormat).length

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-icon btn-secondary"
          onClick={() => navigate('/')}
          style={{ minWidth: 40 }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {court.name}
          </h1>
          <div className="text-muted text-sm">
            {[court.city, court.country].filter(Boolean).join(', ')}
          </div>
        </div>
        <span className="badge badge-orange">{court.court_type || 'outdoor'}</span>
      </div>

      {/* Photos */}
      <PhotoGallery urls={court.photo_urls} />

      <div className="page-content">
        {/* Game ready banner */}
        {gameReady && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <strong>Game on!</strong> {gameReady.format} is ready —{' '}
              {gameReady.players_in_queue} players queued up!
            </div>
          </div>
        )}

        {/* Phone verification notice */}
        {!user.phone_verified && (
          <div
            className="alert alert-info"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile?verify=true')}
          >
            📱 Verify your phone to join the queue →
          </div>
        )}

        {/* Court description */}
        {court.description && (
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            {court.description}
          </p>
        )}

        {/* Queue section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Active Queue</h2>
            <span className="badge badge-orange">{queue.length} waiting</span>
          </div>

          <div style={{ padding: queue.length > 0 ? '12px 12px 4px' : 16 }}>
            {queue.length === 0 ? (
              <div className="text-center" style={{ padding: '16px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏀</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  No one waiting — be first to call next!
                </p>
              </div>
            ) : (
              <QueueList queue={queue} currentUserId={user?.id} />
            )}
          </div>
        </div>

        {/* Court coordinates */}
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginBottom: 80 }}>
          📍 {parseFloat(court.latitude).toFixed(5)}, {parseFloat(court.longitude).toFixed(5)}
          {court.address && <><br />{court.address}</>}
        </div>
      </div>

      {/* Fixed bottom action */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        padding: '12px 16px', background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}>
        {inQueue ? (
          <button className="btn btn-danger btn-full" onClick={handleLeaveQueue}>
            Leave Queue
          </button>
        ) : (
          <button
            className="btn btn-primary btn-full"
            onClick={() => setShowModal(true)}
            disabled={!user.phone_verified}
            style={{ fontSize: 17, fontWeight: 700 }}
          >
            🏀 Got Next
          </button>
        )}
      </div>

      {/* Join queue modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>Join the Queue</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <label className="label">Game Format</label>
              <div className="skill-chips">
                {GAME_FORMATS.map((f) => (
                  <button
                    key={f}
                    className={`chip ${gameFormat === f ? 'active' : ''}`}
                    onClick={() => setGameFormat(f)}
                  >
                    {f}
                    <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
                      ({FORMAT_PLAYERS[f]}p)
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Need {FORMAT_PLAYERS[gameFormat]} players total —{' '}
                {needsPlayers > 0 ? `${needsPlayers} more needed` : 'enough players in queue!'}
              </p>
            </div>

            <div className="form-section">
              <label className="label">Play Style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PLAY_STYLES.map((s) => (
                  <button
                    key={s.value}
                    className={`chip ${playStyle === s.value ? 'active' : ''}`}
                    style={{ justifyContent: 'flex-start', borderRadius: 10, padding: '10px 14px' }}
                    onClick={() => setPlayStyle(s.value)}
                  >
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                      — {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              className="btn btn-primary btn-full"
              onClick={handleGotNext}
              disabled={joining}
              style={{ fontWeight: 700, fontSize: 16 }}
            >
              {joining ? 'Joining…' : '🏀 Got Next!'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
