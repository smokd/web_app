"use client";

type RejectRow = {
  rejectType: string;
  inputValue: number;
};

type PackhouseEntry = {
  variety: string;
  processedKg: number;
  rejectKg: number;
  rejects: RejectRow[];
  rejectInputMode: "KG" | "PERCENT";
};

type Variety = {
  id: number;
  name: string;
};

const DEFECT_TYPES = [
  "Underripe",
  "Birds",
  "Soft",
  "Soft point",
  "Picking Scars",
  "Frost",
  "Stem Retention",
  "Fallen Berries",
  "Undersize",
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
        variety: "",
        processedKg: 0,
        rejectKg: 0,
        rejects: [],
        rejectInputMode: "KG",
      },
    ]);
  };

  const updateEntry = (index: number, patch: Partial<PackhouseEntry>) => {
    const next = [...entries];

    if (!next[index]) return;

    next[index] = {
      ...next[index],
      ...patch,
    };

    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  /*
   * Reject input mode is selected once per
   * packhouse variety.
   *
   * All reject rows under this variety
   * use the selected mode.
   */
  const handleRejectInputModeChange = (
    entryIndex: number,
    mode: "KG" | "PERCENT",
  ) => {
    updateEntry(entryIndex, {
      rejectInputMode: mode,
    });
  };

  const addReject = (entryIndex: number) => {
    const entry = entries[entryIndex];

    if (!entry) return;

    updateEntry(entryIndex, {
      rejects: [
        ...entry.rejects,
        {
          rejectType: "",
          inputValue: 0,
        },
      ],
    });
  };

  const updateReject = (
    entryIndex: number,
    rejectIndex: number,
    patch: Partial<RejectRow>,
  ) => {
    const entry = entries[entryIndex];

    if (!entry) return;

    const rejects = [...entry.rejects];

    if (!rejects[rejectIndex]) return;

    rejects[rejectIndex] = {
      ...rejects[rejectIndex],
      ...patch,
    };

    updateEntry(entryIndex, {
      rejects,
    });
  };

  const removeReject = (entryIndex: number, rejectIndex: number) => {
    const entry = entries[entryIndex];

    if (!entry) return;

    updateEntry(entryIndex, {
      rejects: entry.rejects.filter((_, i) => i !== rejectIndex),
    });
  };

  /*
   * OVERALL TOTALS
   */

  const totalProcessedKg = entries.reduce(
    (sum, entry) => sum + (Number(entry.processedKg) || 0),
    0,
  );

  const totalRejectKg = entries.reduce(
    (sum, entry) => sum + (Number(entry.rejectKg) || 0),
    0,
  );

  const totalGoodKg = Math.max(totalProcessedKg - totalRejectKg, 0);

  const totalRejectPct =
    totalProcessedKg > 0 ? (totalRejectKg / totalProcessedKg) * 100 : 0;

  return (
    <div className="packhouse-section">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="packhouse-header">
        {/*<div>
          <h3 className="packhouse-title">Packhouse Processing</h3>

          <p className="packhouse-subtitle">
            Record processed quantity and packhouse quality rejects for each
            variety.
          </p>
        </div>*/}

        <button type="button" onClick={addEntry} className="btn btn-secondary">
          + Add Variety
        </button>
      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {entries.length === 0 && (
        <div className="packhouse-empty">
          <strong>No packhouse processing recorded.</strong>

          <span>Add a variety to record processed quantity and rejects.</span>
        </div>
      )}

      {/* =====================================================
          ENTRIES
      ===================================================== */}

      <div className="packhouse-entry-list">
        {entries.map((entry, entryIndex) => {
          const processedKg = Number(entry.processedKg) || 0;

          const rejectKg = Number(entry.rejectKg) || 0;

          const goodKg = Math.max(processedKg - rejectKg, 0);

          const rejectPct =
            processedKg > 0 ? (rejectKg / processedKg) * 100 : 0;

          /*
           * =================================================
           * KG MODE
           *
           * Each row represents an actual KG quantity.
           * Total breakdown = sum of row KG values.
           * =================================================
           */

          const rejectKgFromBreakdown =
            entry.rejectInputMode === "KG"
              ? entry.rejects.reduce(
                  (sum, reject) => sum + (Number(reject.inputValue) || 0),
                  0,
                )
              : 0;

          /*
           * =================================================
           * PERCENT MODE
           *
           * Each row represents a percentage of the
           * TOTAL reject quantity.
           *
           * Example:
           *
           * Total Reject = 100 kg
           * Underripe = 20%
           * Birds = 10%
           *
           * Underripe = 20 kg
           * Birds = 10 kg
           * =================================================
           */

          const percentageTotal =
            entry.rejectInputMode === "PERCENT"
              ? entry.rejects.reduce(
                  (sum, reject) => sum + (Number(reject.inputValue) || 0),
                  0,
                )
              : 0;

          const breakdownExceedsTotal =
            entry.rejectInputMode === "KG" &&
            rejectKgFromBreakdown > rejectKg + 0.01;

          const percentageBreakdownInvalid =
            entry.rejectInputMode === "PERCENT" &&
            entry.rejects.length > 0 &&
            Math.abs(percentageTotal - 100) > 0.1;

          return (
            <div key={entryIndex} className="packhouse-entry-card">
              {/* =================================================
                  ENTRY HEADER
              ================================================= */}

              <div className="packhouse-entry-header">
                <div>
                  <span className="packhouse-entry-number">
                    Packhouse Entry {entryIndex + 1}
                  </span>

                  <h4>{entry.variety || "New Packhouse Entry"}</h4>
                </div>

                <button
                  type="button"
                  onClick={() => removeEntry(entryIndex)}
                  className="btn btn-danger btn-small"
                >
                  Remove
                </button>
              </div>

              {/* =================================================
                  BASIC DATA
              ================================================= */}

              <div className="packhouse-grid">
                {/* VARIETY */}

                <div className="form-field">
                  <label htmlFor={`packhouse-variety-${entryIndex}`}>
                    Variety
                  </label>

                  <select
                    id={`packhouse-variety-${entryIndex}`}
                    value={entry.variety}
                    onChange={(event) =>
                      updateEntry(entryIndex, {
                        variety: event.target.value,
                      })
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select variety</option>

                    {varieties.map((variety) => (
                      <option key={variety.id} value={variety.name}>
                        {variety.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PROCESSED */}

                <div className="form-field">
                  <label htmlFor={`processed-${entryIndex}`}>
                    Processed Quantity
                  </label>

                  <div className="input-with-unit">
                    <input
                      id={`processed-${entryIndex}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.processedKg === 0 ? "" : entry.processedKg}
                      onChange={(event) =>
                        updateEntry(entryIndex, {
                          processedKg:
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                        })
                      }
                      className="form-input"
                      placeholder="0.00"
                    />

                    <span>kg</span>
                  </div>
                </div>

                {/* TOTAL REJECT */}

                <div className="form-field">
                  <label htmlFor={`packhouse-reject-${entryIndex}`}>
                    Total Reject
                  </label>

                  <div className="input-with-unit">
                    <input
                      id={`packhouse-reject-${entryIndex}`}
                      type="number"
                      min="0"
                      max={processedKg || undefined}
                      step="0.01"
                      value={entry.rejectKg === 0 ? "" : entry.rejectKg}
                      onChange={(event) =>
                        updateEntry(entryIndex, {
                          rejectKg:
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value),
                        })
                      }
                      className="form-input"
                      placeholder="0.00"
                    />

                    <span>kg</span>
                  </div>
                </div>
              </div>

              {/* =================================================
                  QUALITY SUMMARY
              ================================================= */}

              {/* <div className="packhouse-quality-summary">
                <div>
                  <span>Processed</span>

                  <strong>{processedKg.toFixed(2)} kg</strong>
                </div>

                <div>
                  <span>Rejects</span>

                  <strong>{rejectKg.toFixed(2)} kg</strong>
                </div>

                <div>
                  <span>Reject Rate</span>

                  <strong>{rejectPct.toFixed(2)}%</strong>
                </div>

                <div>
                  <span>Good Product</span>

                  <strong>{goodKg.toFixed(2)} kg</strong>
                </div>
              </div>  */}

              {/* =====================================================
    PACKHOUSE REJECT BREAKDOWN
===================================================== */}

              <div className="packhouse-reject-section">
                {/* =================================================
      HEADER
  ================================================= */}

                <div className="subsection-header">
                  <div>
                    <h5>Packhouse Reject Breakdown</h5>

                    <p>Record packhouse rejects for this variety.</p>
                  </div>
                </div>

                {/* =================================================
      INPUT MODE
  ================================================= */}

                <div className="field-reject-mode">
                  <label>Reject Input Method</label>

                  <div className="field-reject-mode-options">
                    <button
                      type="button"
                      className={`field-reject-mode-button ${
                        entry.rejectInputMode === "KG" ? "active" : ""
                      }`}
                      onClick={() =>
                        handleRejectInputModeChange(entryIndex, "KG")
                      }
                    >
                      Kilograms (KG)
                    </button>

                    <button
                      type="button"
                      className={`field-reject-mode-button ${
                        entry.rejectInputMode === "PERCENT" ? "active" : ""
                      }`}
                      onClick={() =>
                        handleRejectInputModeChange(entryIndex, "PERCENT")
                      }
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>

                {/* =================================================
      TOTAL REJECT
      ONLY IN PERCENT MODE
  ================================================= */}

                {entry.rejectInputMode === "PERCENT" && (
                  <div className="total-field-reject">
                    <label htmlFor={`total-packhouse-reject-${entryIndex}`}>
                      Total Packhouse Rejects for This Variety
                    </label>

                    <div className="total-field-reject-input">
                      <input
                        id={`total-packhouse-reject-${entryIndex}`}
                        type="number"
                        min="0"
                        max={processedKg || undefined}
                        step="0.01"
                        value={entry.rejectKg === 0 ? "" : entry.rejectKg}
                        onChange={(event) =>
                          updateEntry(entryIndex, {
                            rejectKg:
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value),
                          })
                        }
                        className="form-input"
                        placeholder="0.00"
                      />

                      <span>kg</span>
                    </div>

                    <small>
                      Enter the total rejected quantity for this variety. The
                      percentages below divide this total.
                    </small>
                  </div>
                )}

                {/* =================================================
      ADD REJECT TYPE
  ================================================= */}

                <div className="packhouse-reject-breakdown-header">
                  <div>
                    <h6>Reject Types</h6>

                    <p>
                      {entry.rejectInputMode === "PERCENT"
                        ? "Break down the total rejects by percentage."
                        : "Enter the rejected quantity for each defect in kilograms."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addReject(entryIndex)}
                    className="btn btn-secondary btn-small"
                  >
                    + Add Reject Type
                  </button>
                </div>

                {/* =================================================
      EMPTY STATE
  ================================================= */}

                {entry.rejects.length === 0 && (
                  <p className="packhouse-no-rejects">
                    No reject types recorded.
                  </p>
                )}

                {/* =================================================
      REJECT ROWS
  ================================================= */}

                {entry.rejects.length > 0 && (
                  <div className="field-reject-rows">
                    {entry.rejects.map((reject, rejectIndex) => {
                      const value = Number(reject.inputValue) || 0;

                      /*
                       * KG:
                       * value itself is KG.
                       *
                       * PERCENT:
                       * value is percentage of total reject KG.
                       */

                      const calculatedKg =
                        entry.rejectInputMode === "PERCENT"
                          ? (rejectKg * value) / 100
                          : value;

                      /*
                       * Percentage contribution
                       * to total packhouse rejects.
                       */

                      const calculatedPct =
                        rejectKg > 0 ? (calculatedKg / rejectKg) * 100 : 0;

                      return (
                        <div key={rejectIndex} className="field-reject-row">
                          {/* =====================================
                  DEFECT TYPE
              ===================================== */}

                          <div className="field-reject-type">
                            <label
                              htmlFor={`packhouse-reject-type-${entryIndex}-${rejectIndex}`}
                            >
                              Defect Type
                            </label>

                            <select
                              id={`packhouse-reject-type-${entryIndex}-${rejectIndex}`}
                              value={reject.rejectType}
                              onChange={(event) =>
                                updateReject(entryIndex, rejectIndex, {
                                  rejectType: event.target.value,
                                })
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

                          {/* =====================================
                  INPUT VALUE
              ===================================== */}

                          <div className="field-reject-kg">
                            <label
                              htmlFor={`packhouse-reject-value-${entryIndex}-${rejectIndex}`}
                            >
                              {entry.rejectInputMode === "PERCENT"
                                ? "Reject %"
                                : "Rejected Kg"}
                            </label>

                            <div className="input-with-unit">
                              <input
                                id={`packhouse-reject-value-${entryIndex}-${rejectIndex}`}
                                type="number"
                                min="0"
                                max={
                                  entry.rejectInputMode === "PERCENT"
                                    ? 100
                                    : rejectKg || undefined
                                }
                                step="0.01"
                                value={
                                  reject.inputValue === 0
                                    ? ""
                                    : reject.inputValue
                                }
                                onChange={(event) =>
                                  updateReject(entryIndex, rejectIndex, {
                                    inputValue:
                                      event.target.value === ""
                                        ? 0
                                        : Number(event.target.value),
                                  })
                                }
                                className="form-input"
                                placeholder="0.00"
                              />

                              <span>
                                {entry.rejectInputMode === "PERCENT"
                                  ? "%"
                                  : "kg"}
                              </span>
                            </div>
                          </div>

                          {/* =====================================
                  CALCULATED KG
                  ONLY IN PERCENT MODE
              ===================================== */}

                          {entry.rejectInputMode === "PERCENT" && (
                            <div className="field-reject-calculated">
                              <label>Calculated Kg</label>

                              <div className="reject-percent">
                                {calculatedKg.toFixed(2)} kg
                              </div>
                            </div>
                          )}

                          {/* =====================================
                  REJECT %
                  KG MODE ONLY
              ===================================== */}

                          {entry.rejectInputMode === "KG" && (
                            <div className="field-reject-calculated">
                              <label>Reject %</label>

                              <div className="reject-percent">
                                {calculatedPct.toFixed(2)}%
                              </div>
                            </div>
                          )}

                          {/* =====================================
                  DELETE
              ===================================== */}

                          <button
                            type="button"
                            onClick={() =>
                              removeReject(entryIndex, rejectIndex)
                            }
                            className="remove-defect-btn"
                            aria-label={`Remove ${
                              reject.rejectType || "reject"
                            }`}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* =================================================
      KG WARNING
  ================================================= */}

                {breakdownExceedsTotal && (
                  <div className="packhouse-warning">
                    ⚠️ Reject breakdown exceeds the total reject quantity.
                  </div>
                )}

                {/* =================================================
      PERCENT WARNING
  ================================================= */}

                {percentageBreakdownInvalid && (
                  <div className="packhouse-warning">
                    ⚠️ Percentage reject breakdown must total 100%.
                    <strong> Current: {percentageTotal.toFixed(2)}%</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          OVERALL SUMMARY
      ===================================================== */}

      {entries.length > 0 && (
        <div className="quality-summary packhouse-total-summary">
          <div>
            <span>Total Processed</span>

            <strong>{totalProcessedKg.toFixed(2)} kg</strong>
          </div>

          <div>
            <span>Total Rejects</span>

            <strong>{totalRejectKg.toFixed(2)} kg</strong>
          </div>

          <div>
            <span>Reject Rate</span>

            <strong>{totalRejectPct.toFixed(2)}%</strong>
          </div>

          <div>
            <span>Good Product</span>

            <strong>{totalGoodKg.toFixed(2)} kg</strong>
          </div>
        </div>
      )}
    </div>
  );
}
