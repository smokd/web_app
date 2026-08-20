"use client";

type Row = {
  rejectType: string;
  inputValue: number;
};

const DEFECT_TYPES = [
  "Underripe",
  "Birds",
  "Soft",
  "Picking Scars",
  "Blemish",
  "Undersize",
  "Beards",
  "Stem retention",
];

type InputMode = "KG" | "PERCENT";

type FieldRejectSectionProps = {
  fieldRejects: Row[];
  harvestedKg: number;

  inputMode: InputMode;
  totalFieldRejectKg: string;

  onInputModeChange: (mode: InputMode) => void;
  onTotalFieldRejectKgChange: (value: string) => void;
  onChange: (rows: Row[]) => void;
};

export default function FieldRejectSection({
  fieldRejects,
  harvestedKg,
  inputMode,
  totalFieldRejectKg,
  onInputModeChange,
  onTotalFieldRejectKgChange,
  onChange,
}: FieldRejectSectionProps) {
  /* =========================================================
     ROW ACTIONS
  ========================================================= */

  const addRow = () => {
    onChange([
      ...fieldRejects,
      {
        rejectType: "",
        inputValue: 0,
      },
    ]);
  };

  const updateRow = (index: number, key: keyof Row, value: string | number) => {
    const next = [...fieldRejects];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(fieldRejects.filter((_, i) => i !== index));
  };

  /* =========================================================
     TOTAL REJECT KG
  ========================================================= */

  const enteredTotalKg =
    inputMode === "PERCENT"
      ? Number(totalFieldRejectKg) || 0
      : fieldRejects.reduce(
          (sum, row) => sum + (Number(row.inputValue) || 0),
          0,
        );

  /*
   * Prevent negative display values.
   */
  const totalKg = Math.max(enteredTotalKg, 0);

  /* =========================================================
     VARIETY REJECT RATE
  =========================================================
     This is ALWAYS based on this variety's harvested quantity.
  ========================================================= */

  const rejectRatePct = harvestedKg > 0 ? (totalKg / harvestedKg) * 100 : 0;

  const goodKg = Math.max(harvestedKg - totalKg, 0);

  /* =========================================================
     PERCENTAGE BREAKDOWN
  ========================================================= */

  const breakdownPct =
    inputMode === "PERCENT"
      ? fieldRejects.reduce(
          (sum, row) => sum + (Number(row.inputValue) || 0),
          0,
        )
      : 0;

  const breakdownExceedsLimit =
    inputMode === "PERCENT" && breakdownPct > 100.01;

  const rejectExceedsHarvest = totalKg > harvestedKg + 0.01;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="field-reject-section">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="field-reject-header">
        <div>
          <h3 className="field-reject-title">Field Reject Breakdown</h3>

          <p>Record field rejects for this variety only.</p>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="btn btn-secondary add-defect-btn"
        >
          + Add Defect
        </button>
      </div>

      {/* =====================================================
          INPUT MODE
      ===================================================== */}

      <div className="field-reject-mode">
        <label htmlFor="field-reject-input-mode">Reject Input Method</label>

        <div className="field-reject-mode-options">
          <button
            type="button"
            className={`field-reject-mode-button ${
              inputMode === "KG" ? "active" : ""
            }`}
            onClick={() => onInputModeChange("KG")}
          >
            Kilograms (KG)
          </button>

          <button
            type="button"
            className={`field-reject-mode-button ${
              inputMode === "PERCENT" ? "active" : ""
            }`}
            onClick={() => onInputModeChange("PERCENT")}
          >
            Percentage (%)
          </button>
        </div>
      </div>

      {/* =====================================================
          TOTAL REJECT
          ONLY AVAILABLE IN PERCENT MODE
      ===================================================== */}

      {inputMode === "PERCENT" && (
        <div className="total-field-reject">
          <label htmlFor="total-field-reject">
            Total Field Rejects for This Variety
          </label>

          <div className="total-field-reject-input">
            <input
              id="total-field-reject"
              type="number"
              min="0"
              step="0.01"
              value={totalFieldRejectKg}
              onChange={(event) =>
                onTotalFieldRejectKgChange(event.target.value)
              }
              className="form-input reject-number-input"
              placeholder="0.00"
            />

            <span>kg</span>
          </div>

          <small>
            Enter the total rejected quantity for this variety. The percentages
            below divide this total.
          </small>
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {fieldRejects.length === 0 && (
        <p className="field-reject-empty">No field defects recorded.</p>
      )}

      {/* =====================================================
          DEFECT ROWS
      ===================================================== */}

      {fieldRejects.length > 0 && (
        <div className="field-reject-rows">
          {fieldRejects.map((row, index) => {
            const value = Number(row.inputValue) || 0;

            /*
             * In KG mode:
             *   value itself is KG.
             *
             * In PERCENT mode:
             *   value is percentage of total variety rejects.
             */
            const calculatedKg =
              inputMode === "PERCENT" ? (totalKg * value) / 100 : value;

            return (
              <div key={index} className="field-reject-row">
                {/* =================================================
                    DEFECT TYPE
                ================================================= */}

                <div className="field-reject-type">
                  <label htmlFor={`reject-type-${index}`}>Defect Type</label>

                  <select
                    id={`reject-type-${index}`}
                    value={row.rejectType}
                    onChange={(event) =>
                      updateRow(index, "rejectType", event.target.value)
                    }
                  >
                    <option value="">— Select —</option>

                    {DEFECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* =================================================
                    INPUT VALUE
                ================================================= */}

                <div className="field-reject-kg">
                  <label htmlFor={`reject-value-${index}`}>
                    {inputMode === "PERCENT" ? "Reject %" : "Rejected Kg"}
                  </label>

                  <input
                    id={`reject-value-${index}`}
                    type="number"
                    className="form-input reject-number-input"
                    min="0"
                    max={inputMode === "PERCENT" ? 100 : undefined}
                    step="0.01"
                    value={row.inputValue === 0 ? "" : row.inputValue}
                    onChange={(event) =>
                      updateRow(
                        index,
                        "inputValue",
                        event.target.value === ""
                          ? 0
                          : Number(event.target.value),
                      )
                    }
                    placeholder="0.00"
                  />
                </div>

                {/* =================================================
                    CALCULATED KG
                ================================================= */}

                {inputMode === "PERCENT" && (
                  <div className="field-reject-calculated">
                    <label>Calculated Kg</label>

                    <div className="reject-percent">
                      {calculatedKg.toFixed(2)} kg
                    </div>
                  </div>
                )}

                {/* =================================================
                    DELETE
                ================================================= */}

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="remove-defect-btn"
                  aria-label={`Remove ${row.rejectType || "defect"}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      {fieldRejects.length > 0 && (
        <div
          className={`field-reject-summary ${
            rejectExceedsHarvest || breakdownExceedsLimit
              ? "reject-warning"
              : ""
          }`}
        >
          <div>
            <span>Total Field Reject</span>

            <strong>{totalKg.toFixed(2)} kg</strong>
          </div>

          <div>
            <span>Reject Rate</span>

            <strong>{rejectRatePct.toFixed(2)}%</strong>
          </div>

          {inputMode === "PERCENT" && (
            <div>
              <span>Breakdown Total</span>

              <strong>{breakdownPct.toFixed(2)}%</strong>
            </div>
          )}

          <div>
            <span>Good Harvest</span>

            <strong>{goodKg.toFixed(2)} kg</strong>
          </div>

          {/* =================================================
              WARNINGS
          ================================================= */}

          {rejectExceedsHarvest && (
            <div className="reject-warning-message">
              ⚠️ Field rejects cannot exceed this variety&apos;s harvested
              quantity.
            </div>
          )}

          {breakdownExceedsLimit && (
            <div className="reject-warning-message">
              ⚠️ Reject breakdown percentages cannot exceed 100%.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
