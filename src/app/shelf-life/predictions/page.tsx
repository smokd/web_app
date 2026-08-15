'use client';

import { useState } from 'react';

const VARIETIES = ['AKALA', 'ARANA', 'CASCADE', 'CORINDI', 'KIRRA', 'SEKOYA'];

export default function PredictionsPage() {
  const [variety, setVariety] = useState('');
  const [pickTemp, setPickTemp] = useState('');
  const [brix, setBrix] = useState('');
  const [freightType, setFreightType] = useState('AIR');
  const [transitDays, setTransitDays] = useState('14');
  const [week, setWeek] = useState('');
  const [shipmentWeight, setShipmentWeight] = useState('');
  const [result, setResult] = useState<any>(null);

  function calculate() {
    const temp = Number(pickTemp) || 25;
    const bx = Number(brix) || 12;
    const wk = Number(week) || 20;
    const days = Number(transitDays) || 14;

    // Base overpack (simplified lookup)
    const baseOverpack: Record<string, { AIR: number; SEA: number }> = {
      AKALA: { AIR: 3.5, SEA: 6.0 },
      ARANA: { AIR: 4.0, SEA: 7.0 },
      CASCADE: { AIR: 3.0, SEA: 5.5 },
      CORINDI: { AIR: 4.5, SEA: 8.0 },
      KIRRA: { AIR: 5.0, SEA: 9.0 },
      SEKOYA: { AIR: 3.5, SEA: 6.5 },
    };

    const base = baseOverpack[variety] || { AIR: 4.0, SEA: 7.0 };
    let recommended = freightType === 'AIR' ? base.AIR : base.SEA;

    // Temp adjustment
    if (temp > 30) recommended += (temp - 30) * 0.15;
    if (temp > 35) recommended += (temp - 35) * 0.10;

    // Season adjustment
    if (wk >= 27) recommended += 1.5;
    if (wk >= 31) recommended += 1.0;

    // Brix adjustment
    if (bx < 10.5) recommended += 1.0;

    const rounded = Math.ceil(recommended * 2) / 2;
    const riskLevel = rounded > 10 ? 'HIGH' : rounded > 5 ? 'MODERATE' : 'LOW';

    // Predicted weight loss at transit day (simplified linear model)
    const dailyLossRate = recommended / 100 * 0.3; // rough estimate
    const predictedLoss = dailyLossRate * days * 100;

    const kgToAdd = shipmentWeight
      ? (Number(shipmentWeight) * rounded / 100).toFixed(2)
      : null;

    setResult({
      recommended: recommended.toFixed(2),
      rounded: rounded.toFixed(1),
      riskLevel,
      predictedLoss: predictedLoss.toFixed(2),
      kgToAdd,
      warnings: [
        temp > 30 ? `⚠️ Pick temp ${temp}°C exceeds 30°C threshold` : null,
        bx < 10.5 ? `⚠️ Brix ${bx} below 10.5 — expect higher loss` : null,
        wk >= 27 ? `⚠️ Late season (Week ${wk}) — accelerated degradation` : null,
      ].filter(Boolean),
    });
  }

  return (
    <main className="bg-primary" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Overpack Calculator</h1>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label>Variety</label>
              <select value={variety} onChange={(e) => setVariety(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <option value="">Select</option>
                {VARIETIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label>Pick Temp (°C)</label>
              <input type="number" step="0.1" value={pickTemp} onChange={(e) => setPickTemp(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div>
              <label>Brix</label>
              <input type="number" step="0.1" value={brix} onChange={(e) => setBrix(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div>
              <label>Freight Type</label>
              <select value={freightType} onChange={(e) => setFreightType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                <option value="AIR">AIR</option>
                <option value="SEA">SEA</option>
              </select>
            </div>

            <div>
              <label>Transit Days</label>
              <input type="number" value={transitDays} onChange={(e) => setTransitDays(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div>
              <label>Season Week</label>
              <input type="number" value={week} onChange={(e) => setWeek(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>

            <div>
              <label>Shipment Weight (kg)</label>
              <input type="number" step="0.1" value={shipmentWeight} onChange={(e) => setShipmentWeight(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
          </div>

          <button onClick={calculate} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Calculate
          </button>
        </div>

        {result && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ marginBottom: '1rem' }}>Results</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Recommended Overpack</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{result.rounded}%</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Risk Level</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: result.riskLevel === 'HIGH' ? '#c62828' : result.riskLevel === 'MODERATE' ? '#f59e0b' : '#10b981' }}>
                  {result.riskLevel}
                </div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Predicted Loss</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{result.predictedLoss}%</div>
              </div>
              {result.kgToAdd && (
                <div style={{ padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Kg to Add</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{result.kgToAdd} kg</div>
                </div>
              )}
            </div>

            {result.warnings.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                {result.warnings.map((w: string, i: number) => (
                  <p key={i} style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
