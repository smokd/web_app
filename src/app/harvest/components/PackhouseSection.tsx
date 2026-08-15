'use client';

type RejectRow = { rejectType: string; rejectKg: number };

export default function PackhouseSection({
  processedKg,
  onProcessedKgChange,
  rejects,
  onRejectsChange,
}: {
  processedKg: number;
  onProcessedKgChange: (v: number) => void;
  rejects: RejectRow[];
  onRejectsChange: (rows: RejectRow[]) => void;
}) {
  const addRow = () => onRejectsChange([...rejects, { rejectType: '', rejectKg: 0 }]);

  const updateRow = (i: number, key: keyof RejectRow, value: string | number) => {
    const next = [...rejects];
    next[i] = { ...next[i], [key]: value };
    onRejectsChange(next);
  };

  const removeRow = (i: number) => onRejectsChange(rejects.filter((_, idx) => idx !== i));

  const totalRejectKg = rejects.reduce((s, r) => s + (Number(r.rejectKg) || 0), 0);
  const totalPct = processedKg > 0 ? (totalRejectKg / processedKg) * 100 : 0;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Packhouse Load</h3>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 160 }}>
          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Processed Kg</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={processedKg}
            onChange={(e) => onProcessedKgChange(parseFloat(e.target.value) || 0)}
            style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Total Rejected Kg</label>
          <div style={{ padding: '0.4rem', background: 'var(--formula-bg, #e8f5e9)', borderRadius: 4, fontWeight: 600 }}>
            {totalRejectKg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Reject %</label>
          <div style={{ padding: '0.4rem', background: 'var(--formula-bg, #e8f5e9)', borderRadius: 4, fontWeight: 600 }}>
            {totalPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Reject Breakdown</span>
        <button type="button" onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
          + Add Reject Type
        </button>
      </div>

      {rejects.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <select
              value={row.rejectType}
              onChange={(e) => updateRow(i, 'rejectType', e.target.value)}
              style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}
            >
              <option value="">— Select —</option>
              <option value="Underipe">Underipe</option>
              <option value="Birds">Birds</option>
              <option value="Soft">Soft</option>
              <option value="Soft point">Soft point</option>
              <option value="Picking Scars">Picking Scars</option>
              <option value="Frost">Frost</option>
              <option value="Stem Retention">Stem Retention</option>
              <option value="Fallen Berries">Fallen Berries</option>
              <option value="Undersize">Undersize</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: 120 }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Rejected Kg</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={row.rejectKg}
              onChange={(e) => updateRow(i, 'rejectKg', parseFloat(e.target.value) || 0)}
              style={{ padding: '0.4rem', borderRadius: 4, border: '1px solid var(--border)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: 80 }}>
            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Auto %</label>
            <div style={{ padding: '0.4rem', background: '#f5f5f5', borderRadius: 4, fontSize: '0.85rem' }}>
              {processedKg > 0 ? ((row.rejectKg / processedKg) * 100).toFixed(2) : '0.00'}%
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeRow(i)}
            style={{ padding: '0.4rem 0.6rem', background: '#c62828', color: '#fff', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
