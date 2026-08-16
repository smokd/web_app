import { getAuditLogs } from './actions';
import AuditTable from './components/AuditTable';

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div
      style={{
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          marginBottom: '1.5rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          Audit Trail
        </h1>

        <p
          style={{
            marginTop: '0.35rem',
            color: 'var(--muted-foreground)',
          }}
        >
          Track changes made to operational records.
        </p>
      </div>

      <AuditTable logs={logs} />
    </div>
  );
}
