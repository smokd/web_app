'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createShelfLifeSample } from '../actions';

const VARIETIES = ['AKALA', 'ARANA', 'CASCADE', 'CORINDI', 'KIRRA', 'SEKOYA'];
const TYPES = ['TIME_TEMP', 'WEIGHT_RETENTION', 'RETENTION'];

export default function NewSamplePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [sampleType, setSampleType] = useState('TIME_TEMP');

  async function handleSubmit(formData: FormData) {
    setMessage('');
    startTransition(async () => {
      try {
        const result = await createShelfLifeSample(formData);
        setMessage('Sample created.');
        router.push(`/shelf-life/${result.id}`);
      } catch (err: any) {
        setMessage(err.message || 'Failed to create sample.');
      }
    });
  }

  return (
    <main className="bg-primary" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>New Shelf Life Sample</h1>

        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12 }}>
          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Sample ID</label>
                <input name="sampleId" required placeholder="e.g. SL-AKALA-32-001"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Sample Type</label>
                <select name="sampleType" value={sampleType} onChange={(e) => setSampleType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div>
                <label>Variety</label>
                <select name="variety" required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <option value="">Select variety</option>
                  {VARIETIES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label>Fruit Size</label>
                <input name="fruitSize" type="number" placeholder="14, 18, 22"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>L-Code</label>
                <input name="lCode" placeholder="3204"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Block</label>
                <input name="block" placeholder="22a"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Pick Date</label>
                <input name="pickDate" type="date"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Pick Temp (°C)</label>
                <input name="pickTemp" type="number" step="0.1"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Pack Date</label>
                <input name="packDate" type="date"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Brix</label>
                <input name="brix" type="number" step="0.1"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Freight Type</label>
                <select name="freightType"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <option value="">Select</option>
                  <option value="AIR">AIR</option>
                  <option value="SEA">SEA</option>
                </select>
              </div>

              <div>
                <label>Customer</label>
                <input name="customer"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Pallet Code</label>
                <input name="palletCode"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              <div>
                <label>Week</label>
                <input name="week" type="number"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>

              {sampleType === 'WEIGHT_RETENTION' && (
                <>
                  <div>
                    <label>Moisture %</label>
                    <input name="moisturePct" type="number" step="0.01"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label>Pack Weight (grams)</label>
                    <input name="packWeight" type="number" step="0.01"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
                  </div>
                </>
              )}

              <div>
                <label>Target Temp (°C)</label>
                <input name="targetTemp" type="number" step="0.1" defaultValue={5}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div>
              <label>Notes</label>
              <textarea name="notes" rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', resize: 'vertical' }} />
            </div>

            {message && (
              <p style={{ color: message.includes('created') ? '#2e7d32' : '#c62828', fontSize: '0.9rem' }}>
                {message}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={pending} className="btn btn-primary" style={{ opacity: pending ? 0.6 : 1 }}>
                {pending ? 'Creating…' : 'Create Sample'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
