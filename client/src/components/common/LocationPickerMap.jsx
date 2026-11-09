import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Navigation, Locate, Building2 } from 'lucide-react';

// Custom modern SVG-based DivIcon matching Smart City theme (Teal / Navy)
const markerIcon = L.divIcon({
  className: 'custom-smart-city-pin',
  html: `
    <div style="position: relative; width: 36px; height: 36px;">
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #13A89E;
        position: absolute;
        transform: rotate(-45deg);
        left: 2px;
        top: 2px;
        border: 3px solid #ffffff;
        box-shadow: 0 6px 12px rgba(19, 168, 158, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -34],
});

// Helper component to handle map clicks
function MapClickEvents({ onSelect }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      onSelect(lat, lng);
    },
  });
  return null;
}

// Helper component to smoothly pan/fly when coordinates change externally
function MapCenterController({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, map.getZoom(), { duration: 1.0 });
    }
  }, [position, map]);
  return null;
}

const CIVIC_PRESETS = [
  { name: 'Central Civic Plaza', lat: 28.613939, lng: 77.209021 },
  { name: 'West Metro Station', lat: 28.621900, lng: 77.218500 },
  { name: 'Sector 4 Central Market', lat: 28.632400, lng: 77.219800 },
  { name: 'Greenfield Enclave', lat: 28.598000, lng: 77.205000 },
];

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = '320px',
}) {
  // Default to Delhi central coordinates if not provided
  const defaultPos = [28.613939, 77.209021];
  const hasCoords = Boolean(latitude && longitude);
  const currentPos = hasCoords
    ? [parseFloat(latitude), parseFloat(longitude)]
    : defaultPos;

  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(6));
          const lng = parseFloat(pos.lng.toFixed(6));
          onChange(lat, lng);
        }
      },
    }),
    [onChange]
  );

  const handleMapClick = (lat, lng) => {
    onChange(lat, lng);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange(lat, lng);
        setLocating(false);
        setGeoNotice('Live GPS coordinates captured!');
        setTimeout(() => setGeoNotice(null), 3500);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to central civic square coordinates
        onChange(28.613939, 77.209021);
        setLocating(false);
        setGeoNotice('Using municipal reference coordinates.');
        setTimeout(() => setGeoNotice(null), 3500);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Top Map Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Interactive Location Picker</span>
          {hasCoords ? (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800">
              {latitude}, {longitude}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">
              (Click on map or drag pin)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-colors disabled:opacity-60"
        >
          <Crosshair className={`w-3.5 h-3.5 text-teal-600 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Locating...' : 'Use My GPS Location'}</span>
        </button>
      </div>

      {geoNotice && (
        <div className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>{geoNotice}</span>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner z-0"
        style={{ height }}
      >
        <MapContainer
          center={currentPos}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={currentPos}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
            icon={markerIcon}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <strong className="text-navy-900 block">Civic Issue Pin</strong>
                <span className="text-slate-600 block">Drag pin to reposition</span>
                <span className="font-mono text-[10px] text-teal-700 block">
                  {currentPos[0]}, {currentPos[1]}
                </span>
              </div>
            </Popup>
          </Marker>

          <MapClickEvents onSelect={handleMapClick} />
          <MapCenterController position={currentPos} />
        </MapContainer>

        {/* Map Instructions Pill Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-[11px] text-slate-600 pointer-events-none">
          Click map or drag the teal pin to mark location
        </div>
      </div>

      {/* Quick Civic Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 font-medium">Quick Landmarks:</span>
        {CIVIC_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onChange(preset.lat, preset.lng)}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}

