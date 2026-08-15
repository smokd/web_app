'use client';

type Row = {
  rejectType: string;
  rejectKg: number;
};

const DEFECT_TYPES = [
  'Underripe',
  'Birds',
  'Soft',
  'Picking Scars',
  'Blemish',
  'Undersize',
  'Beards',
  'Stem retention',
];

export default function FieldRejectSection({
  fieldRejects,
  harvestedKg,
  onChange,
}: {
  fieldRejects: Row[];
  harvestedKg: number;
  onChange: (rows: Row[]) => void;
}) {
  const addRow = () => {
    onChange([
      ...fieldRejects,
      {
        rejectType: '',
        rejectKg: 0,
      },
    ]);
  };

  const updateRow = (
    index: number,
    key: keyof Row,
    value: string | number
  ) => {
    const next = [...fieldRejects];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(
      fieldRejects.filter(
        (_, i) => i !== index
      )
    );
  };

  /*
   * Total rejected KG
   */
  const totalKg = fieldRejects.reduce(
    (sum, row) =>
      sum + (Number(row.rejectKg) || 0),
    0
  );

  /*
   * Total reject percentage
   */
  const totalPct =
    harvestedKg > 0
      ? (totalKg / harvestedKg) * 100
      : 0;

  return (
    <div className="field-reject-section">

      {/* Header */}
      <div className="field-reject-header">

        <h3 className="field-reject-title">
          Field Reject Analysis
        </h3>

        <button
          type="button"
          onClick={addRow}
          className="btn btn-secondary add-defect-btn"
        >
          + Add Defect
        </button>

      </div>

      {/* Empty state */}
      {fieldRejects.length === 0 && (
        <p className="field-reject-empty">
          No field defects recorded.
        </p>
      )}

      {/* Rows */}
      <div className="field-reject-rows">

        {fieldRejects.map((row, index) => {

          const autoPct =
            harvestedKg > 0
              ? ((Number(row.rejectKg) || 0) /
                  harvestedKg) *
                100
              : 0;

          return (
            <div
              key={index}
              className="field-reject-row"
            >

              {/* Defect Type */}
              <div className="field-reject-type">
                <label>
                  Defect Type
                </label>

                <select
                  value={row.rejectType}
                  onChange={(e) =>
                    updateRow(
                      index,
                      'rejectType',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    — Select —
                  </option>

                  {DEFECT_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* KG */}
              <div className="field-reject-kg">
                <label>
                  Rejected Kg
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    row.rejectKg === 0
                      ? ''
                      : row.rejectKg
                  }
                  onChange={(e) =>
                    updateRow(
                      index,
                      'rejectKg',
                      e.target.value === ''
                        ? 0
                        : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                />
              </div>

              {/* Percentage */}
              <div className="field-reject-percent">
                <label>
                  Auto %
                </label>

                <div className="reject-percent">
                  {autoPct.toFixed(2)}%
                </div>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() =>
                  removeRow(index)
                }
                className="remove-defect-btn"
                aria-label={`Remove ${row.rejectType || 'defect'}`}
              >
                ✕
              </button>

            </div>
          );
        })}

      </div>

      {/* Summary */}
      {fieldRejects.length > 0 && (
        <div
          className={`field-reject-summary ${
            totalPct > 100
              ? 'reject-warning'
              : ''
          }`}
        >
          <div>
            <span>
              Total Field Reject
            </span>

            <strong>
              {totalKg.toFixed(2)} kg
            </strong>
          </div>

          <div>
            <span>
              Total Reject %
            </span>

            <strong>
              {totalPct.toFixed(2)}%
            </strong>
          </div>

          {totalPct > 100 && (
            <div className="reject-warning-message">
              ⚠️ Field rejects exceed 100% of harvested
              quantity.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
