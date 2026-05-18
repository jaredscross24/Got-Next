import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import api from '../api/client'

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
}

export default function AddCourt() {
  const navigate = useNavigate()
  const fileRef = useRef()

  const [step, setStep] = useState(1) // 1 = pin, 2 = details
  const [pin, setPin] = useState(null)
  const [viewState, setViewState] = useState({ longitude: -40, latitude: 20, zoom: 2 })

  const [form, setForm] = useState({
    name: '', description: '', address: '', city: '', country: '', court_type: 'outdoor',
  })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleMapClick = (evt) => {
    setPin({ lat: evt.lngLat.lat, lng: evt.lngLat.lng })
  }

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pin) { setError('Drop a pin on the map first'); return }
    if (!form.name.trim()) { setError('Court name is required'); return }

    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('latitude', pin.lat)
      fd.append('longitude', pin.lng)
      fd.append('description', form.description)
      fd.append('address', form.address)
      fd.append('city', form.city)
      fd.append('country', form.country)
      fd.append('court_type', form.court_type)
      photos.forEach((p) => fd.append('photos', p))

      await api.post('/courts', fd)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add court')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-icon btn-secondary" onClick={() => navigate('/')} style={{ minWidth: 40 }}>
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Add a Court</h1>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= 1 ? 'var(--primary)' : 'var(--border)' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : 'var(--border)' }} />
        </div>
      </div>

      {step === 1 && (
        <>
          <div style={{ padding: '12px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {pin
                ? `📍 Pin dropped: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                : 'Tap the map to drop a pin on the court location'}
            </p>
          </div>

          <div style={{ height: 'calc(100vh - 56px - 72px - 48px - 64px)', position: 'relative' }}>
            <Map
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%' }}
              mapStyle={MAP_STYLE}
              cursor="crosshair"
              attributionControl={false}
            >
              <GeolocateControl
                position="bottom-right"
                onGeolocate={(evt) => {
                  setViewState((v) => ({
                    ...v,
                    longitude: evt.coords.longitude,
                    latitude: evt.coords.latitude,
                    zoom: 15,
                  }))
                }}
              />
              <NavigationControl position="bottom-right" showCompass={false} />

              {pin && (
                <Marker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
                  <div className="court-pin">
                    <div className="court-pin-dot" style={{ background: '#FF6B2B' }}>
                      <span className="court-pin-dot-inner">📍</span>
                    </div>
                  </div>
                </Marker>
              )}
            </Map>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => { if (pin) setStep(2); else setError('Drop a pin first') }}
            >
              Next: Court Details →
            </button>
            {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
          </div>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="page-content">
            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label className="label">Court Name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Riverside Courts" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={set('city')} placeholder="City" />
              </div>
              <div>
                <label className="label">Country</label>
                <input className="input" value={form.country} onChange={set('country')} placeholder="Country" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="label">Street Address (optional)</label>
              <input className="input" value={form.address} onChange={set('address')} placeholder="123 Main St" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="label">Court Type</label>
              <select className="select" value={form.court_type} onChange={set('court_type')}>
                <option value="outdoor">Outdoor</option>
                <option value="indoor">Indoor</option>
                <option value="covered">Covered (outdoor but sheltered)</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="label">Description (optional)</label>
              <textarea
                className="input"
                style={{ resize: 'vertical', minHeight: 80 }}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe the court — surface quality, # of hoops, vibe, etc."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">Photos (up to 5)</label>
              <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*" multiple onChange={handlePhotos} />
              <button type="button" className="btn btn-secondary btn-full" onClick={() => fileRef.current.click()}>
                📷 Upload Photos
              </button>
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, overflow: 'auto' }}>
                  {previews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 2 }}
              >
                {submitting ? 'Adding…' : '🏀 Add Court'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
