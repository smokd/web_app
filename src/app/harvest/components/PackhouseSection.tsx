'use client';

type RejectRow = {
  rejectType: string;
  inputMode: 'KG' | 'PERCENT';
  inputValue: number;
};

type PackhouseEntry = {
  variety: string;
  processedKg: number;
  rejectKg: number;
  rejects: RejectRow[];
};

type Variety = {
  id: number;
  name: string;
};

const DEFECT_TYPES = [
  'Underripe',
  'Birds',
  'Soft',
  'Soft point',
  'Picking Scars',
  'Frost',
  'Stem Retention',
  'Fallen Berries',
  'Undersize',
];

export default function PackhouseSection({
  entries,
  onChange,
  varieties,
}: {
  entries: PackhouseEntry[];
  onChange: (entries: PackhouseEntry[]) => void;
  varieties: Variety[];
}) {
  const addEntry = () => {
    onChange([
      ...entries,
      {
        variety: '',
        processedKg: 0,
        rejectKg: 0,
        rejects: [],
      },
    ]);
  };

  const updateEntry = (
    index: number,
    patch: Partial<PackhouseEntry>
  ) => {
    const next = [...entries];

    next[index] = {
      ...next[index],
      ...patch,
    };

    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(
      entries.filter((_, i) => i !== index)
    );
  };

  const addReject = (entryIndex: number) => {
    const entry = entries[entryIndex];

    updateEntry(entryIndex, {
      rejects: [
        ...entry.rejects,
        {
          rejectType: '',
          inputMode: 'KG',
          inputValue: 0,
        },
      ],
    });
  };

  const updateReject = (
    entryIndex: number,
    rejectIndex: number,
    patch: Partial<RejectRow>
  ) => {
    const entry = entries[entryIndex];

    const rejects = [...entry.rejects];

    rejects[rejectIndex] = {
      ...rejects[rejectIndex],
      ...patch,
    };

    updateEntry(entryIndex, {
      rejects,
    });
  };

  const removeReject = (
    entryIndex: number,
    rejectIndex: number
  ) => {
    const entry = entries[entryIndex];

    updateEntry(entryIndex, {
      rejects: entry.rejects.filter(
        (_, i) => i !== rejectIndex
      ),
    });
  };

  const totalProcessedKg = entries.reduce(
    (sum, entry) =>
      sum +
      (Number(entry.processedKg) || 0),
    0
  );

  const totalRejectKg = entries.reduce(
    (sum, entry) =>
      sum +
      (Number(entry.rejectKg) || 0),
    0
  );

  const totalRejectPct =
    totalProcessedKg > 0
      ? (totalRejectKg / totalProcessedKg) * 100
      : 0;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Packhouse Processing
        </h3>

        <button
          type="button"
          onClick={addEntry}
          className="btn btn-secondary"
        >
          + Add Packhouse Entry
        </button>
      </div>

      {entries.length === 0 && (
        <p
          style={{
            opacity: 0.65,
            fontSize: '0.9rem',
          }}
        >
          No packhouse processing recorded.
        </p>
      )}

      {entries.map((entry, entryIndex) => {
        const entryRejectKg =
          entry.rejects.reduce(
            (sum, reject) => {
              const value =
                Number(reject.inputValue) || 0;

              if (
                reject.inputMode === 'KG'
              ) {
                return sum + value;
              }

              return sum;
            },
            0
          );

        const percentageRows =
          entry.rejects.filter(
            reject =>
              reject.inputMode ===
              'PERCENT'
          );

        const percentageTotal =
          percentageRows.reduce(
            (sum, reject) =>
              sum +
              (Number(
                reject.inputValue
              ) || 0),
            0
          );

        const remainingKg = Math.max(
          0,
          (Number(entry.rejectKg) || 0) -
            entryRejectKg
        );

        return (
          <div
            key={entryIndex}
            style={{
              border:
                '1px solid var(--border)',
              borderRadius: 8,
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-end',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <label
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                >
                  Variety
                </label>

                <select
                  value={entry.variety}
                  onChange={e =>
                    updateEntry(
                      entryIndex,
                      {
                        variety:
                          e.target.value,
                      }
                    )
                  }
                  style={{
                    padding: '0.4rem',
                    borderRadius: 4,
                    border:
                      '1px solid var(--border)',
                  }}
                >
                  <option value="">
                    — Select variety —
                  </option>

                  {varieties.map(
                    variety => (
                      <option
                        key={variety.id}
                        value={
                          variety.name
                        }
                      >
                        {variety.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 150,
                }}
              >
                <label
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                >
                  Processed Kg
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    entry.processedKg === 0
                      ? ''
                      : entry.processedKg
                  }
                  onChange={e =>
                    updateEntry(
                      entryIndex,
                      {
                        processedKg:
                          e.target.value ===
                          ''
                            ? 0
                            : Number(
                                e.target.value
                              ),
                      }
                    )
                  }
                  style={{
                    padding: '0.4rem',
                    borderRadius: 4,
                    border:
                      '1px solid var(--border)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 150,
                }}
              >
                <label
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                >
                  Total Reject Kg
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    entry.rejectKg === 0
                      ? ''
                      : entry.rejectKg
                  }
                  onChange={e =>
                    updateEntry(
                      entryIndex,
                      {
                        rejectKg:
                          e.target.value ===
                          ''
                            ? 0
                            : Number(
                                e.target.value
                              ),
                      }
                    )
                  }
                  style={{
                    padding: '0.4rem',
                    borderRadius: 4,
                    border:
                      '1px solid var(--border)',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  removeEntry(
                    entryIndex
                  )
                }
                style={{
                  padding:
                    '0.4rem 0.6rem',
                  background:
                    '#c62828',
                  color: '#fff',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom:
                  '0.5rem',
              }}
            >
              <strong>
                Reject Breakdown
              </strong>

              <button
                type="button"
                onClick={() =>
                  addReject(
                    entryIndex
                  )
                }
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                }}
              >
                + Add Reject Type
              </button>
            </div>

            {entry.rejects.map(
              (reject, rejectIndex) => {
                const calculatedKg =
                  reject.inputMode ===
                  'KG'
                    ? Number(
                        reject.inputValue
                      ) || 0
                    : remainingKg *
                      ((Number(
                        reject.inputValue
                      ) || 0) /
                        100);

                const rejectPct =
                  entry.rejectKg >
                  0
                    ? (calculatedKg /
                        entry.rejectKg) *
                      100
                    : 0;

                return (
                  <div
                    key={rejectIndex}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems:
                        'flex-end',
                      marginBottom:
                        '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        flex: 1,
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        Reject Type
                      </label>

                      <select
                        value={
                          reject.rejectType
                        }
                        onChange={e =>
                          updateReject(
                            entryIndex,
                            rejectIndex,
                            {
                              rejectType:
                                e.target
                                  .value,
                            }
                          )
                        }
                        style={{
                          padding:
                            '0.4rem',
                          borderRadius:
                            4,
                          border:
                            '1px solid var(--border)',
                        }}
                      >
                        <option value="">
                          — Select —
                        </option>

                        {DEFECT_TYPES.map(
                          type => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        width: 100,
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        Mode
                      </label>

                      <select
                        value={
                          reject.inputMode
                        }
                        onChange={e =>
                          updateReject(
                            entryIndex,
                            rejectIndex,
                            {
                              inputMode:
                                e.target
                                  .value as
                                  | 'KG'
                                  | 'PERCENT',
                            }
                          )
                        }
                        style={{
                          padding:
                            '0.4rem',
                          borderRadius:
                            4,
                          border:
                            '1px solid var(--border)',
                        }}
                      >
                        <option value="KG">
                          KG
                        </option>
                        <option value="PERCENT">
                          %
                        </option>
                      </select>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        width: 120,
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        Value
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={
                          reject.inputMode ===
                          'PERCENT'
                            ? 100
                            : undefined
                        }
                        value={
                          reject.inputValue ===
                          0
                            ? ''
                            : reject.inputValue
                        }
                        onChange={e =>
                          updateReject(
                            entryIndex,
                            rejectIndex,
                            {
                              inputValue:
                                e.target
                                  .value ===
                                ''
                                  ? 0
                                  : Number(
                                      e.target
                                        .value
                                    ),
                            }
                          )
                        }
                        style={{
                          padding:
                            '0.4rem',
                          borderRadius:
                            4,
                          border:
                            '1px solid var(--border)',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: 110,
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        Calculated Kg
                      </label>

                      <div
                        style={{
                          padding:
                            '0.4rem',
                          background:
                            'var(--formula-bg, #e8f5e9)',
                          borderRadius:
                            4,
                        }}
                      >
                        {calculatedKg.toFixed(
                          2
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        width: 90,
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.75rem',
                          opacity: 0.7,
                        }}
                      >
                        % Reject
                      </label>

                      <div
                        style={{
                          padding:
                            '0.4rem',
                          background:
                            'var(--formula-bg, #e8f5e9)',
                          borderRadius:
                            4,
                        }}
                      >
                        {rejectPct.toFixed(
                          2
                        )}
                        %
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeReject(
                          entryIndex,
                          rejectIndex
                        )
                      }
                      style={{
                        padding:
                          '0.4rem 0.6rem',
                        background:
                          '#c62828',
                        color: '#fff',
                        borderRadius: 4,
                        border: 'none',
                        cursor:
                          'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              }
            )}

            {percentageRows.length >
              0 &&
              Math.abs(
                percentageTotal - 100
              ) > 0.1 && (
                <div
                  style={{
                    color: '#c62828',
                    fontSize:
                      '0.8rem',
                    marginTop:
                      '0.5rem',
                  }}
                >
                  Percentage reject
                  breakdown must total
                  100%.
                </div>
              )}
          </div>
        );
      })}

      {entries.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            padding: '0.75rem',
            background:
              'var(--formula-bg, #e8f5e9)',
            borderRadius: 6,
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                opacity: 0.7,
              }}
            >
              Total Processed
            </span>

            <strong>
              {totalProcessedKg.toFixed(
                2
              )}{' '}
              kg
            </strong>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                opacity: 0.7,
              }}
            >
              Total Reject
            </span>

            <strong>
              {totalRejectKg.toFixed(
                2
              )}{' '}
              kg
            </strong>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                opacity: 0.7,
              }}
            >
              Reject %
            </span>

            <strong>
              {totalRejectPct.toFixed(
                2
              )}
              %
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
