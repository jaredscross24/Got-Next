import React, { useState } from 'react'
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useNavigate } from 'react-router-dom'

// Free OSM raster tiles — no API key required
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
}

export default function CourtMap({ courts, viewState, onViewStateChange }) {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  return (
    <Map
      {...viewState}
      onMove={(evt) => onViewStateChange(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
    >
      <GeolocateControl position="bottom-right" trackUserLocation />
      <NavigationControl position="bottom-right" showCompass={false} />

      {courts.map((court) => (
        <Marker
          key={court.id}
          longitude={parseFloat(court.longitude)}
          latitude={parseFloat(court.latitude)}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelected(court)
          }}
        >
          <div className="court-pin" title={court.name}>
            <div className="court-pin-dot">
              <span className="court-pin-dot-inner">🏀</span>
            </div>
          </div>
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={parseFloat(selected.longitude)}
          latitude={parseFloat(selected.latitude)}
          anchor="bottom"
          offset={40}
          onClose={() => setSelected(null)}
          closeOnClick={false}
        >
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>{selected.name}</div>
            {(selected.city || selected.country) && (
              <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                {[selected.city, selected.country].filter(Boolean).join(', ')}
              </div>
            )}
            <button
              className="btn btn-primary btn-sm btn-full"
              onClick={() => navigate(`/court/${selected.id}`)}
            >
              Got Next →
            </button>
          </div>
        </Popup>
      )}
    </Map>
  )
}
