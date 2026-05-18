import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CourtMap from '../components/Map/CourtMap'
import api from '../api/client'

export default function Home() {
  const [courts, setCourts] = useState([])
  const [search, setSearch] = useState('')
  const [viewState, setViewState] = useState({
    longitude: -40,
    latitude: 20,
    zoom: 2,
  })
  const [geoLoaded, setGeoLoaded] = useState(false)
  const searchTimer = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllCourts()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setViewState({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            zoom: 12,
          })
          setGeoLoaded(true)
          fetchNearbyCourts(pos.coords.latitude, pos.coords.longitude)
        },
        () => setGeoLoaded(true)
      )
    } else {
      setGeoLoaded(true)
    }
  }, [])

  const fetchAllCourts = async () => {
    try {
      const res = await api.get('/courts')
      setCourts(res.data)
    } catch (err) {
      console.error('Failed to load courts', err)
    }
  }

  const fetchNearbyCourts = async (lat, lng) => {
    try {
      const res = await api.get('/courts', { params: { lat, lng, radius: 100 } })
      setCourts(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = useCallback((e) => {
    const val = e.target.value
    setSearch(val)

    clearTimeout(searchTimer.current)
    if (val.length === 0) {
      fetchAllCourts()
      return
    }
    if (val.length < 2) return

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/courts', { params: { search: val } })
        setCourts(res.data)
      } catch (err) {
        console.error(err)
      }
    }, 300)
  }, [])

  return (
    <div style={{ height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>
      <div className="map-search">
        <input
          type="text"
          placeholder="Search courts by name, city, or country…"
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <CourtMap
          courts={courts}
          viewState={viewState}
          onViewStateChange={setViewState}
        />

        {courts.length > 0 && (
          <div
            style={{
              position: 'absolute', bottom: 16, left: 16,
              background: 'rgba(26,26,26,0.92)', borderRadius: 100,
              padding: '6px 14px', fontSize: 13, color: 'var(--text-muted)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {courts.length} court{courts.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>
    </div>
  )
}
