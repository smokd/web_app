import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { predictShelfLife } from './lib/prediction';
import { validateSampleDates } from './lib/validation';
import { classifyRisk, classifyConfidence } from './lib/risk';
import {
  PredictionVsActual as PredictionSection,
  OverpackCalculator,
  VarietyIntelligenceTable,
  DataQualityPanel,
  SampleStatsCards,
} from './components';

export default async function ShelfLifePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; variety?: string; type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const where: any = {};
  if (params?.status && params.status !== 'ALL') where.status = params.status;
  if (params?.variety) where.variety = params.variety;
  if (params?.type) where.sampleType = params.type;

  // ─── FETCH SAMPLES ───
  const samples = await prisma.shelfLifeSample.findMany({
    where,
    include: {
      observations: { orderBy: { day: 'desc' }, take: 1 },
      weightReadings: { orderBy: { day: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const varieties = await prisma.shelfLifeSample.groupBy({
    by: ['variety'],
    _count: true,
  });

  // ─── COMPUTE PREDICTIONS FOR ACTIVE SAMPLES (server-side) ───
  const activeSamples = samples.filter((s) => s.status === 'ACTIVE');
  const samplePredictions = new Map<string, Awaited<ReturnType<typeof predictShelfLife>>>();

  for (const s of activeSamples.slice(0, 20)) {
    if (s.pickTemp !== null && s.brix !== null) {
      try {
        const pred = await predictShelfLife(
          s.variety,
          s.pickTemp,
          s.brix,
          s.freightType || 'AIR',
          s.week,
          s.packWeight
        );
        samplePredictions.set(s.id, pred);
      } catch {
        // skip if prediction fails
      }
    }
  }

  // ─── STATS ───
  const activeCount = samples.filter((s) => s.status === 'ACTIVE').length;
  const failedCount = samples.filter((s) => s.status === 'FAILED').length;
  const avgShelfLife =
    samples.length > 0
      ? samples.reduce((a, s) => a + (s.totalDays || 0), 0) / samples.length
      : 0;

  // ─── VARIETY INTELLIGENCE ───
  const profiles = await prisma.shelfLifeVarietyProfile.findMany({
    orderBy: { variety: 'asc' },
  });

  const varietyStats = await prisma.shelfLifeSample.groupBy({
    by: ['variety'],
    where: { status: 'FAILED' },
    _count: { status: true },
  });

  const intelligenceData = profiles.map((p) => {
    const stat = varietyStats.find((v) => v.variety === p.variety);
    return {
      variety: p.variety,
      sampleCount: stat?._count?.status ?? 0,
      avgShelfLife: p.avgShelfLifeAir,
      failureRate: p.failureRatePct ? p.failureRatePct / 100 : null,
      avgBrix: p.avgBrix,
      avgPickTemp: p.avgPickTemp,
      riskLevelAir: p.riskLevelAir,
      riskLevelSea: p.riskLevelSea,
      recommendedAirOverpack: p.recommendedAirOverpack,
      recommendedSeaOverpack: p.recommendedSeaOverpack,
    };
  });

  // ─── DATA QUALITY AUDIT ───
  const allSamplesForAudit = await prisma.shelfLifeSample.findMany({
    select: {
      sampleId: true,
      pickDate: true,
      packDate: true,
      pickTemp: true,
      brix: true,
      packWeight: true,
      status: true,
      totalDays: true,
    },
  });

  const qualityIssues: Array<{ sampleId: string; type: 'error' | 'warning'; message: string }> = [];
  allSamplesForAudit.forEach((s) => {
    const dateValidation = validateSampleDates(s.pickDate, s.packDate);
    dateValidation.errors.forEach((msg) =>
      qualityIssues.push({ sampleId: s.sampleId, type: 'error', message: msg })
    );
    dateValidation.warnings.forEach((msg) =>
      qualityIssues.push({ sampleId: s.sampleId, type: 'warning', message: msg })
    );
    if (s.pickTemp === null) {
      qualityIssues.push({ sampleId: s.sampleId, type: 'warning', message: 'Missing pick temperature' });
    }
    if (s.brix === null) {
      qualityIssues.push({ sampleId: s.sampleId, type: 'warning', message: 'Missing Brix' });
    }
    if (s.pickTemp !== null && (s.pickTemp < 5 || s.pickTemp > 50)) {
      qualityIssues.push({ sampleId: s.sampleId, type: 'warning', message: `Suspicious pick temperature: ${s.pickTemp}°C` });
    }
    if (s.brix !== null && (s.brix < 3 || s.brix > 30)) {
      qualityIssues.push({ sampleId: s.sampleId, type: 'warning', message: `Suspicious Brix: ${s.brix}` });
    }
  });

  return (
    <main className="bg-primary" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Shelf Life Tracking</h1>
          <Link href="/shelf-life/new" className="btn btn-primary">+ New Sample</Link>
        </div>

        {/* Section 0: Stats Cards */}
        <div style={{ marginBottom: '1.5rem' }}>
          <SampleStatsCards
            activeCount={activeCount}
            failedThisWeek={failedCount}
            avgShelfLife={avgShelfLife}
          />
        </div>

        {/* Section 1: Sample List */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Sample List</h2>
          <FilterBar params={params} varieties={varieties.map((v) => v.variety)} />

          {samples.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.7 }}>No samples found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Sample ID</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Variety</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '0.6rem' }}>Days</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Predicted</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: '0.6rem' }}>Last Obs</th>
                  <th style={{ padding: '0.6rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {samples.map((s) => {
                  const lastObs = s.observations[0];
                  const lastWeight = s.weightReadings[0];
                  const daysTracked = lastObs?.day || lastWeight?.day || 0;
                  const statusColor =
                    s.status === 'ACTIVE' ? '#3b82f6' :
                    s.status === 'FAILED' ? '#c62828' :
                    s.status === 'COMPLETED' ? '#10b981' : '#f59e0b';

                  const pred = samplePredictions.get(s.id);
                  const predictedDays = pred?.predictedShelfLife;
                  const remaining = predictedDays ? predictedDays - daysTracked : null;
                  const risk = remaining !== null
                    ? remaining <= 2 ? 'HIGH' : remaining <= 5 ? 'MODERATE' : 'LOW'
                    : null;
                  const riskColor =
                    risk === 'HIGH' ? '#c62828' :
                    risk === 'MODERATE' ? '#f59e0b' : '#10b981';

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{s.sampleId}</td>
                      <td style={{ padding: '0.6rem' }}>{s.variety}</td>
                      <td style={{ padding: '0.6rem' }}>{s.sampleType.replace('_', ' ')}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>{daysTracked}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 12,
                          background: statusColor + '20',
                          color: statusColor,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {predictedDays ? (
                          <span style={{ fontWeight: 600 }}>
                            {predictedDays.toFixed(1)}d
                            {remaining !== null && (
                              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 4 }}>
                                ({remaining > 0 ? `${remaining.toFixed(0)} left` : 'overdue'})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.8rem' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {risk ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 12,
                            background: riskColor + '15',
                            color: riskColor,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            {risk}
                          </span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {lastObs ? `Day ${lastObs.day} — ${lastObs.overallStatus || 'N/A'}` : 'No data'}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        <Link href={`/shelf-life/${s.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                          Track
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 2: Predict Shelf Life */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Predict Shelf Life
          </h2>
          <PredictionSection />
        </div>

        {/* Section 3: Shipment Decision Support */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Shipment Decision Support — Overpack Calculator
          </h2>
          <OverpackCalculator />
        </div>

        {/* Section 4: Variety Intelligence */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Variety Intelligence
          </h2>
          <VarietyIntelligenceTable profiles={intelligenceData} />
        </div>

        {/* Section 5: Data Quality */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
            Data Quality & Validation
          </h2>
          <DataQualityPanel
            totalSamples={allSamplesForAudit.length}
            issues={qualityIssues}
          />
        </div>
      </div>
    </main>
  );
}

function FilterBar({ params, varieties }: { params: any; varieties: string[] }) {
  return (
    <form method="GET" action="/shelf-life" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Status</label>
        <select name="status" defaultValue={params?.status || 'ALL'} style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="FAILED">Failed</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Variety</label>
        <select name="variety" defaultValue={params?.variety || ''} style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <option value="">All</option>
          {varieties.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Type</label>
        <select name="type" defaultValue={params?.type || ''} style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}>
          <option value="">All</option>
          <option value="TIME_TEMP">Time-Temp</option>
          <option value="WEIGHT_RETENTION">Weight Retention</option>
          <option value="RETENTION">Retention</option>
        </select>
      </div>
      <button type="submit" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>Filter</button>
    </form>
  );
}
