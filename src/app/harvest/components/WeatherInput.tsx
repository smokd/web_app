'use client';

import { useState } from 'react';

export type WeatherData = {
  condition: string;
  temp: number;
  lat: number | null;
  lon: number | null;
  source: 'gps' | 'manual';
};

export default function WeatherInput({
  value,
  onChange,
}: {
  value: WeatherData;
  onChange: (w: WeatherData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function decodeWeatherCode(code: number): string {
    const map: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail',
    };
    return map[code] || 'Unknown';
  }

  async function fetchGPS() {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          const data = await res.json();
          const w: WeatherData = {
            condition: decodeWeatherCode(data.current.weather_code),
            temp: data.current.temperature_2m,
            lat: latitude,
            lon: longitude,
            source: 'gps',
          };
          onChange(w);
        } catch {
          setError('Weather fetch failed');
        }
        setLoading(false);
      },
      () => {
        setError('Location access denied');
        setLoading(false);
      }
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Weather Conditions</h3>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={fetchGPS}
          disabled={loading}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          {loading ? 'Fetching…' : '📍 Use GPS Weather'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Condition</label>
          <input
            type="text"
            value={value.condition}
            onChange={(e) => onChange({ ...value, condition: e.target.value, source: 'manual' })}
            style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: 90 }}>
          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Temp °C</label>
          <input
            type="number"
            step="0.1"
            value={value.temp}
            onChange={(e) => onChange({ ...value, temp: parseFloat(e.target.value) || 0, source: 'manual' })}
            style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}
          />
        </div>

        {value.source === 'gps' && value.lat !== null && (
          <span style={{ fontSize: '0.75rem', opacity: 0.6, alignSelf: 'center' }}>
            📍 {value.lat.toFixed(4)}, {value.lon?.toFixed(4)}
          </span>
        )}
      </div>

      {error && <p style={{ color: '#c62828', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
