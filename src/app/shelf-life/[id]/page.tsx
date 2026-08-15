import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import DailyTrackingForm from '../components/DailyTrackingForm';
import WeightLossChart from '../components/WeightLossChart';
import DefectChart from '../components/DefectChart';
import StatusBadge from '../components/StatusBadge';

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const sample = await prisma.shelfLifeSample.findUnique({
    where: { id },
    include: {
      observations: { orderBy: { day: 'asc' } },
      weightReadings: { orderBy: { day: 'asc' } },
    },
  });

  if (!sample) redirect('/shelf-life');

  const daysTracked = Math.max(
    sample.observations.length > 0 ? sample.observations[sample.observations.length - 1].day : 0,
    sample.weightReadings.length > 0 ? sample.weightReadings[sample.weightReadings.length - 1].day : 0
  );

  const nextDay = daysTracked + 1;

  // Predict failure day for weight retention
  let predictedFailureDay: number | null = null;
  if (sample.sampleType === 'WEIGHT_RETENTION' && sample.weightReadings.length >= 3) {
    const readings = sample.weightReadings;
    const last = readings[readings.length - 1];
    const slope = last.lossRatePctDay || 0;
    if (slope > 0) {
      const daysTo10Pct = (10 - (last.weightLossPct || 0)) / slope;
      predictedFailureDay = Math.round(last.day + daysTo10Pct);
    }
  }

  // KIRRA sea warning
  const showKirraWarning = sample.variety === 'KIRRA' && sample.freightType === 'SEA';
  const showTempWarning = sample.pickTemp && sample.pickTemp > 30;
  const showLateSeasonWarning = sample.week && sample.week >= 27;

  return (
    <main className="bg-primary" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Sample {sample.sampleId}</h1>
            <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{sample.variety} | {sample.sampleType.replace('_', ' ')} | Day {daysTracked} of tracking</p>
          </div>
          <Link href="/shelf-life" className="btn btn-secondary">← Back</Link>
        </div>

        {showKirraWarning && (
          <div style={{ padding: '0.75rem 1rem', background: '#fff3e0', borderRadius: 8, marginBottom: '1rem', borderLeft: '4px solid #f59e0b' }}>
            ⚠️ <strong>KIRRA on SEA freight</strong> — high risk variety. Monitor closely.
          </div>
        )}
        {showTempWarning && (
          <div style={{ padding: '0.75rem 1rem', background: '#ffebee', borderRadius: 8, marginBottom: '1rem', borderLeft: '4px solid #c62828' }}>
            🌡️ <strong>Pick temp {sample.pickTemp}°C</strong> — exceeds 30°C threshold. Expect accelerated degradation.
          </div>
        )}
        {showLateSeasonWarning && (
          <div style={{ padding: '0.75rem 1rem', background: '#e8f5e9', borderRadius: 8, marginBottom: '1rem', borderLeft: '4px solid #2e7d32' }}>
            📅 <strong>Late season (Week {sample.week})</strong> — expect accelerated degradation.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Info Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Sample Info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>Size:</strong> {sample.fruitSize || '—'}</div>
              <div><strong>L-Code:</strong> {sample.lCode || '—'}</div>
              <div><strong>Block:</strong> {sample.block || '—'}</div>
              <div><strong>Pick Date:</strong> {sample.pickDate || '—'}</div>
              <div><strong>Pick Temp:</strong> {sample.pickTemp ? `${sample.pickTemp}°C` : '—'}</div>
              <div><strong>Pack Date:</strong> {sample.packDate || '—'}</div>
              <div><strong>Brix:</strong> {sample.brix || '—'}</div>
              <div><strong>Freight:</strong> {sample.freightType || '—'}</div>
              <div><strong>Customer:</strong> {sample.customer || '—'}</div>
              <div><strong>Pallet:</strong> {sample.palletCode || '—'}</div>
              <div><strong>Week:</strong> {sample.week || '—'}</div>
              <div><strong>Target Temp:</strong> {sample.targetTemp}°C</div>
              {sample.sampleType === 'WEIGHT_RETENTION' && (
                <>
                  <div><strong>Moisture:</strong> {sample.moisturePct ? `${sample.moisturePct}%` : '—'}</div>
                  <div><strong>Pack Weight:</strong> {sample.packWeight ? `${sample.packWeight}g` : '—'}</div>
                </>
              )}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <StatusBadge status={sample.status} />
              {predictedFailureDay && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                  Predicted failure: Day {predictedFailureDay}
                </span>
              )}
            </div>
          </div>

          {/* Tracking Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Day {nextDay} Entry</h3>
            <DailyTrackingForm sample={sample} nextDay={nextDay} />
          </div>
        </div>

        {/* Charts */}
        {sample.sampleType === 'WEIGHT_RETENTION' && sample.weightReadings.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Weight Loss Curve</h3>
            <WeightLossChart readings={sample.weightReadings} variety={sample.variety} />
          </div>
        )}

        {sample.observations.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Defect Accumulation</h3>
            <DefectChart observations={sample.observations} />
          </div>
        )}

        {/* Observation History */}
        {sample.observations.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Observation History</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem' }}>Day</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem' }}>Shrivel</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem' }}>Soft</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem' }}>Collapsed</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem' }}>Total</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sample.observations.map((obs) => (
                  <tr key={obs.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.4rem' }}>{obs.day}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'right' }}>{obs.shrivelCount}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'right' }}>{obs.softCount}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'right' }}>{obs.collapsedCount}</td>
                    <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600 }}>{obs.totalDefects}</td>
                    <td style={{ padding: '0.4rem' }}>
                      <span style={{
                        color: obs.overallStatus === 'GOOD' ? '#10b981' : obs.overallStatus === 'FAIR' ? '#f59e0b' : '#c62828',
                        fontWeight: 600,
                      }}>
                        {obs.overallStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.4rem' }}>{obs.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
