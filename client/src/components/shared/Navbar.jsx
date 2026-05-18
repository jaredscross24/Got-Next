import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)

const BallIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93c4.08 4.08 4.08 10.07 0 14.14" />
    <path d="M19.07 4.93c-4.08 4.08-4.08 10.07 0 14.14" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
)

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const TABS = [
  { path: '/', label: 'Courts', Icon: MapIcon },
  { path: '/my-games', label: 'My Games', Icon: BallIcon },
  { path: '/profile', label: 'Profile', Icon: PersonIcon },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <button
        className={`nav-item ${pathname === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <MapIcon />
        <span>Courts</span>
      </button>

      <button className="fab" onClick={() => navigate('/add-court')} aria-label="Add court">
        +
      </button>

      <button
        className={`nav-item ${pathname === '/my-games' ? 'active' : ''}`}
        onClick={() => navigate('/my-games')}
      >
        <BallIcon />
        <span>My Games</span>
      </button>

      <button
        className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <PersonIcon />
        <span>Profile</span>
      </button>
    </nav>
  )
}
