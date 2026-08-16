'use client';

import { Fragment, useMemo, useState } from 'react';

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

function formatChanges(changes: string | null) {
  if (!changes) {
    return 'No change details';
  }

  try {
    return JSON.stringify(
      JSON.parse(changes),
      null,
      2
    );
  } catch {
    return changes;
  }
}

export default function AuditTable({
  logs,
}: {
  logs: AuditLog[];
}) {
  const [expanded, setExpanded] =
    useState<number | null>(null);

  const [actionFilter, setActionFilter] =
    useState('ALL');

  const [entityFilter, setEntityFilter] =
    useState('ALL');

  const [userFilter, setUserFilter] =
    useState('ALL');

  const [search, setSearch] =
    useState('');

  const actions = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => log.action))
      ).sort(),
    [logs]
  );

  const entities = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => log.entity))
      ).sort(),
    [logs]
  );

  const users = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .filter((log) => log.user)
            .map((log) => String(log.user!.id))
        )
      ),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (
        actionFilter !== 'ALL' &&
        log.action !== actionFilter
      ) {
        return false;
      }

      if (
        entityFilter !== 'ALL' &&
        log.entity !== entityFilter
      ) {
        return false;
      }

      if (
        userFilter !== 'ALL' &&
        String(log.user?.id ?? '') !== userFilter
      ) {
        return false;
      }

      if (term) {
        const haystack = [
          log.description ?? '',
          log.entity,
          log.entityId ?? '',
          log.action,
          log.user?.name ?? '',
          log.user?.email ?? '',
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [
    logs,
    actionFilter,
    entityFilter,
    userFilter,
    search,
  ]);

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value)
          }
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        >
          <option value="ALL">
            All actions
          </option>

          {actions.map((action) => (
            <option
              key={action}
              value={action}
            >
              {action}
            </option>
          ))}
        </select>

        <select
          value={entityFilter}
          onChange={(e) =>
            setEntityFilter(e.target.value)
          }
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        >
          <option value="ALL">
            All entities
          </option>

          {entities.map((entity) => (
            <option
              key={entity}
              value={entity}
            >
              {entity}
            </option>
          ))}
        </select>

        <select
          value={userFilter}
          onChange={(e) =>
            setUserFilter(e.target.value)
          }
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        >
          <option value="ALL">
            All users
          </option>

          {users.map((userId) => {
            const user = logs.find(
              (log) =>
                String(log.user?.id) === userId
            )?.user;

            return (
              <option
                key={userId}
                value={userId}
              >
                {user?.name ?? user?.email ?? userId}
              </option>
            );
          })}
        </select>

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search audit trail..."
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        />
      </div>

      {/* Result count */}
      <div
        style={{
          marginBottom: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--muted-foreground)',
        }}
      >
        Showing {filteredLogs.length} of{' '}
        {logs.length} audit records
      </div>

      {!filteredLogs.length ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
        >
          No audit records match your filters.
        </div>
      ) : (
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
              {filteredLogs.map((log) => {
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

                      <td>{log.action}</td>

                      <td>{log.entity}</td>

                      <td>
                        {log.entityId ?? '—'}
                      </td>

                      <td>
                        {log.description ?? '—'}
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
                            {formatChanges(
                              log.changes
                            )}
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
      )}
    </div>
  );
}
