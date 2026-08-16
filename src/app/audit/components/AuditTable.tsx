'use client';

import { useState } from 'react';
import { Fragment } from 'react';

type AuditLog = {
  id: number;
  createdAt: Date | string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  changes: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
};

function formatDate(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditTable({
  logs,
}: {
  logs: AuditLog[];
}) {
  const [expanded, setExpanded] =
    useState<number | null>(null);

  if (!logs.length) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        No audit records found.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Record</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const isExpanded =
              expanded === log.id;

            return (
              <Fragment key={log.id}>
                <tr
                  onClick={() =>
                    setExpanded(
                      isExpanded
                        ? null
                        : log.id
                    )
                  }
                  style={{
                    cursor: 'pointer',
                    borderTop:
                      '1px solid var(--border)',
                  }}
                >
                  <td>
                    {formatDate(
                      log.createdAt
                    )}
                  </td>

                  <td>
                    {log.user?.name ??
                      'System'}
                  </td>

                  <td>
                    {log.action}
                  </td>

                  <td>
                    {log.entity}
                  </td>

                  <td>
                    {log.entityId ??
                      '—'}
                  </td>

                  <td>
                    {log.description ??
                      '—'}
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '1rem',
                        background:
                          'var(--muted)',
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace:
                            'pre-wrap',
                          overflowX:
                            'auto',
                        }}
                      >
                        {log.changes
                          ? JSON.stringify(
                              JSON.parse(
                                log.changes
                              ),
                              null,
                              2
                            )
                          : 'No change details'}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
