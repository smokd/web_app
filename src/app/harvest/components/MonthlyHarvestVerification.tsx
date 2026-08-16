'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  updateHarvestRecord,
  deleteHarvestRecord,
} from '../actions.ts';

type FieldReject = {
  id: number;
  rejectType: string;
  rejectKg: number;
  rejectPct: number;
};

type PackhouseReject = {
  id: number;
  rejectType: string;
  rejectKg: number;
  rejectPct: number;
};

type PackhouseLoad = {
  id: number;
  variety: string;
  processedKg: number;
  notes?: string | null;
  rejects: PackhouseReject[];
};

type HarvestRecord = {
  id: number;
  date: string;
  variety: string;
  harvestedKg: number;
  fieldRejectsKg: number;
  fieldRejectPct: number;
  blocks: string | null;
  weather: string | null;
  weatherTemp: number | null;
  supervisor: string | null;
  notes: string | null;
  fieldRejects: FieldReject[];
  packhouseLoad: PackhouseLoad[];
};

type Variety = {
  id: number;
  name: string;
};

type Weather = {
  id: number;
  name: string;
};

function fmtKg(
  value: number | null | undefined
) {
  const kg = Number(value);

  if (!Number.isFinite(kg)) {
    return "0.00";
  }

  return kg.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export default function MonthlyHarvestVerification({
  records,
  month,
  isAdmin,
  varieties,
  weatherOptions,
}: {
  records: HarvestRecord[];
  month: string;
  isAdmin: boolean;
  varieties: Variety[];
  weatherOptions: Weather[];
}) {
  const router = useRouter();

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [pending, setPending] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const totals = useMemo(() => {
    return records.reduce(
      (sum, record) => {
        sum.harvestedKg += record.harvestedKg;
        sum.fieldRejectsKg += record.fieldRejectsKg;

        if (record.packhouseLoad) {
          if (
  Array.isArray(
    record.packhouseLoad
  )
) {
  for (
    const load of
    record.packhouseLoad
  ) {
    sum.packhouseProcessedKg +=
      Number(
        load.processedKg
      ) || 0;

    sum.packhouseRejectsKg +=
      Array.isArray(
        load.rejects
      )
        ? load.rejects.reduce(
            (
              rejectSum,
              reject
            ) =>
              rejectSum +
              (Number(
                reject.rejectKg
              ) || 0),
            0
          )
        : 0;
  }
}
        }

        return sum;
      },
      {
        harvestedKg: 0,
        fieldRejectsKg: 0,
        packhouseProcessedKg: 0,
        packhouseRejectsKg: 0,
      }
    );
  }, [records]);

  const monthlyFieldRejectPct =
    totals.harvestedKg > 0
      ? (totals.fieldRejectsKg /
          totals.harvestedKg) *
        100
      : 0;

  const monthlyPackhouseRejectPct =
    totals.packhouseProcessedKg > 0
      ? (totals.packhouseRejectsKg /
          totals.packhouseProcessedKg) *
        100
      : 0;

  function selectMonth(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedMonth = event.target.value;

    if (!selectedMonth) return;

    router.push(
      `/harvest?month=${selectedMonth}&date=${selectedMonth}-01`
    );
  }

  async function handleUpdate(
    formData: FormData
  ) {
    setPending(true);
    setMessage('');

    try {
      await updateHarvestRecord(formData);

      setEditingId(null);
      setMessage('Record updated.');

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Update failed.'
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: number) {
    if (
      !confirm(
        'Are you sure you want to delete this harvest record?'
      )
    ) {
      return;
    }

    setPending(true);
    setMessage('');

    try {
      const formData = new FormData();

      formData.set('id', String(id));

      await deleteHarvestRecord(formData);

      setMessage('Record deleted.');

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Delete failed.'
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>

      <div
        className="section-heading"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >

        <div>
          <h2>
            Monthly Harvest Verification
          </h2>

          <p>
            Temporary tool for checking entered
            harvest data against the original records.
          </p>
        </div>

        <div>
          <label
            htmlFor="verification-month"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              marginBottom: '0.3rem',
              opacity: 0.7,
            }}
          >
            Select month
          </label>

          <input
            id="verification-month"
            type="month"
            value={month}
            onChange={selectMonth}
            style={{
              padding: '0.5rem',
              borderRadius: 6,
              border: '1px solid var(--border)',
            }}
          />
        </div>

      </div>

      {message && (
        <p
          style={{
            marginBottom: '1rem',
            color:
              message.includes('updated') ||
              message.includes('deleted')
                ? '#2e7d32'
                : '#c62828',
          }}
        >
          {message}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >

        <div>
          <strong>Harvested</strong>
          <div>
            {fmtKg(totals.harvestedKg)} kg
          </div>
        </div>

        <div>
          <strong>Field Rejects</strong>
          <div>
            {fmtKg(totals.fieldRejectsKg)} kg
            {' '}
            ({fmtPct(monthlyFieldRejectPct)}%)
          </div>
        </div>

        <div>
          <strong>Packhouse Processed</strong>
          <div>
            {fmtKg(
              totals.packhouseProcessedKg
            )}{' '}
            kg
          </div>
        </div>

        <div>
          <strong>Packhouse Rejects</strong>
          <div>
            {fmtKg(
              totals.packhouseRejectsKg
            )}{' '}
            kg
            {' '}
            ({fmtPct(
              monthlyPackhouseRejectPct
            )}%)
          </div>
        </div>

      </div>

      {records.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            opacity: 0.7,
          }}
        >
          No harvest records for {month}.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >

            <thead>
              <tr
                style={{
                  borderBottom:
                    '2px solid var(--border)',
                }}
              >
                <th>Date</th>
                <th>Variety</th>
                <th>Harvested</th>
                <th>Field Rej</th>
                <th>Field %</th>
                <th>Packhouse</th>
                <th>Packhouse Rej</th>
                {isAdmin && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>

            <tbody>

              {records.map((record) => {

                if (
                  editingId === record.id
                ) {
                  return (
                    <tr key={record.id}>
                      <td
                        colSpan={
                          isAdmin ? 8 : 7
                        }
                        style={{
                          padding: '1rem',
                        }}
                      >

                        <form
                          action={handleUpdate}
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            alignItems:
                              'flex-end',
                          }}
                        >

                          <input
                            type="hidden"
                            name="id"
                            value={record.id}
                          />

                          <input
                            type="hidden"
                            name="date"
                            value={record.date}
                          />

                          <label>
                            Variety
                            <select
                              name="variety"
                              defaultValue={
                                record.variety
                              }
                            >
                              {varieties.map(
                                (v) => (
                                  <option
                                    key={v.id}
                                    value={v.name}
                                  >
                                    {v.name}
                                  </option>
                                )
                              )}
                            </select>
                          </label>

                          <label>
                            Harvested kg
                            <input
                              name="harvestedKg"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={
                                record.harvestedKg
                              }
                            />
                          </label>

                          <label>
                            Field Reject kg
                            <input
                              name="fieldRejectsKg"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={
                                record.fieldRejectsKg
                              }
                            />
                          </label>

                          <label>
                            Blocks
                            <input
                              name="blocks"
                              type="text"
                              defaultValue={
                                record.blocks || ''
                              }
                            />
                          </label>

                          <label>
                            Weather
                            <select
                              name="weather"
                              defaultValue={
                                record.weather || ''
                              }
                            >
                              <option value="">
                                —
                              </option>

                              {weatherOptions.map(
                                (w) => (
                                  <option
                                    key={w.id}
                                    value={w.name}
                                  >
                                    {w.name}
                                  </option>
                                )
                              )}
                            </select>
                          </label>

                          <label>
                            Supervisor
                            <input
                              name="supervisor"
                              type="text"
                              defaultValue={
                                record.supervisor ||
                                ''
                              }
                            />
                          </label>

                          <label
                            style={{
                              flex: 1,
                              minWidth: 200,
                            }}
                          >
                            Notes
                            <input
                              name="notes"
                              type="text"
                              defaultValue={
                                record.notes || ''
                              }
                            />
                          </label>

                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={pending}
                          >
                            {pending
                              ? 'Saving...'
                              : 'Save'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setEditingId(null)
                            }
                            disabled={pending}
                          >
                            Cancel
                          </button>

                        </form>

                      </td>
                    </tr>
                  );
                }

                const packhouseRejectKg =
  Array.isArray(
    record.packhouseLoad
  )
    ? record.packhouseLoad.reduce(
        (loadSum, load) =>
          loadSum +
          (Array.isArray(
            load.rejects
          )
            ? load.rejects.reduce(
                (
                  rejectSum,
                  reject
                ) =>
                  rejectSum +
                  (Number(
                    reject.rejectKg
                  ) || 0),
                0
              )
            : 0),
        0
      )
    : 0;

                return (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom:
                        '1px solid var(--border)',
                    }}
                  >

                    <td>
                      {record.date}
                    </td>

                    <td>
                      {record.variety}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {fmtKg(
                        record.harvestedKg
                      )}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {fmtKg(
                        record.fieldRejectsKg
                      )}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {fmtPct(
                        record.fieldRejectPct
                      )}
                      %
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {record.packhouseLoad
                        ? fmtKg(
                            record.packhouseLoad
                              .processedKg
                          )
                        : '—'}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {record.packhouseLoad
                        ? fmtKg(
                            packhouseRejectKg
                          )
                        : '—'}
                    </td>

                    {isAdmin && (
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                          }}
                        >

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setEditingId(
                                record.id
                              )
                            }
                            disabled={pending}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn"
                            onClick={() =>
                              handleDelete(
                                record.id
                              )
                            }
                            disabled={pending}
                            style={{
                              background:
                                '#c62828',
                              color: '#fff',
                            }}
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    )}

                  </tr>
                );
              })}

              <tr
                style={{
                  borderTop:
                    '2px solid var(--border)',
                  fontWeight: 700,
                }}
              >

                <td colSpan={2}>
                  MONTH TOTAL
                </td>

                <td
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {fmtKg(
                    totals.harvestedKg
                  )}
                </td>

                <td
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {fmtKg(
                    totals.fieldRejectsKg
                  )}
                </td>

                <td
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {fmtPct(
                    monthlyFieldRejectPct
                  )}
                  %
                </td>

                <td
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {fmtKg(
                    totals.packhouseProcessedKg
                  )}
                </td>

                <td
                  style={{
                    textAlign: 'right',
                  }}
                >
                  {fmtKg(
                    totals.packhouseRejectsKg
                  )}
                </td>

                {isAdmin && (
                  <td />
                )}

              </tr>

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}
