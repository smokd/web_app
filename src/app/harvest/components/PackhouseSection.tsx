"use client";

type RejectRow = {
  rejectType: string;
  inputMode: "KG" | "PERCENT";
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
      },
    ]);
  };

  const updateEntry = (index: number, patch: Partial<PackhouseEntry>) => {
    const next = [...entries];

    next[index] = {
      ...next[index],
      ...patch,
    };

    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const addReject = (entryIndex: number) => {
    const entry = entries[entryIndex];

    if (!entry) return;

    updateEntry(entryIndex, {
      rejects: [
        ...entry.rejects,
        {
          rejectType: "",
          inputMode: "KG",
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

    rejects[rejectIndex] = {
      ...rejects[rejectIndex],
      ...patch,
    };

    updateEntry(entryIndex, { rejects });
  };

  const removeReject = (entryIndex: number, rejectIndex: number) => {
    const entry = entries[entryIndex];

    if (!entry) return;

    updateEntry(entryIndex, {
      rejects: entry.rejects.filter((_, i) => i !== rejectIndex),
    });
  };

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
      {/* HEADER */}
      <div className="packhouse-header">
        <div>
          <h3 className="packhouse-title">Packhouse Processing</h3>

          <p className="packhouse-subtitle">
            Record processed quantity and packhouse quality rejects for each
            variety.
          </p>
        </div>

        <button type="button" onClick={addEntry} className="btn btn-secondary">
          + Add Variety
        </button>
      </div>

      {/* EMPTY STATE */}
      {entries.length === 0 && (
        <div className="packhouse-empty">
          <strong>No packhouse processing recorded.</strong>
          <span>Add a variety to record processed quantity and rejects.</span>
        </div>
      )}

      {/* ENTRIES */}
      <div className="packhouse-entry-list">
        {entries.map((entry, entryIndex) => {
          const processedKg = Number(entry.processedKg) || 0;

          const rejectKg = Number(entry.rejectKg) || 0;

          const goodKg = Math.max(processedKg - rejectKg, 0);

          const rejectPct =
            processedKg > 0 ? (rejectKg / processedKg) * 100 : 0;

          const rejectKgFromBreakdown = entry.rejects.reduce((sum, reject) => {
            const value = Number(reject.inputValue) || 0;

            if (reject.inputMode === "KG") {
              return sum + value;
            }

            return sum;
          }, 0);

          const percentRows = entry.rejects.filter(
            (reject) => reject.inputMode === "PERCENT",
          );

          const percentageTotal = percentRows.reduce(
            (sum, reject) => sum + (Number(reject.inputValue) || 0),
            0,
          );

          const remainingKg = Math.max(rejectKg - rejectKgFromBreakdown, 0);

          const breakdownExceedsTotal = rejectKgFromBreakdown > rejectKg + 0.01;

          return (
            <div key={entryIndex} className="packhouse-entry-card">
              {/* ENTRY HEADER */}
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

              {/* BASIC DATA */}
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

              {/* QUALITY SUMMARY */}
              <div className="packhouse-quality-summary">
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
              </div>

              {/* REJECT BREAKDOWN */}
              <div className="packhouse-reject-section">
                <div className="subsection-header">
                  <div>
                    <h5>Reject Breakdown</h5>

                    <p>
                      Break down the total rejects by defect type using KG or
                      percentage.
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

                {entry.rejects.length === 0 && (
                  <p className="packhouse-no-rejects">
                    No reject types recorded.
                  </p>
                )}

                <div className="packhouse-reject-list">
                  {entry.rejects.map((reject, rejectIndex) => {
                    const value = Number(reject.inputValue) || 0;

                    const calculatedKg =
                      reject.inputMode === "KG"
                        ? value
                        : (rejectKg * value) / 100;

                    const calculatedPct =
                      rejectKg > 0 ? (calculatedKg / rejectKg) * 100 : 0;

                    return (
                      <div key={rejectIndex} className="packhouse-reject-row">
                        {/* TYPE */}
                        <div className="form-field">
                          <label
                            htmlFor={`packhouse-reject-type-${entryIndex}-${rejectIndex}`}
                          >
                            Reject Type
                          </label>

                          <select
                            id={`packhouse-reject-type-${entryIndex}-${rejectIndex}`}
                            value={reject.rejectType}
                            onChange={(event) =>
                              updateReject(entryIndex, rejectIndex, {
                                rejectType: event.target.value,
                              })
                            }
                            className="form-input"
                          >
                            <option value="">Select defect</option>

                            {DEFECT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* MODE */}
                        <div className="form-field packhouse-mode-field">
                          <label
                            htmlFor={`packhouse-reject-mode-${entryIndex}-${rejectIndex}`}
                          >
                            Input
                          </label>

                          <select
                            id={`packhouse-reject-mode-${entryIndex}-${rejectIndex}`}
                            value={reject.inputMode}
                            onChange={(event) =>
                              updateReject(entryIndex, rejectIndex, {
                                inputMode: event.target.value as
                                  | "KG"
                                  | "PERCENT",
                                inputValue: 0,
                              })
                            }
                            className="form-input"
                          >
                            <option value="KG">KG</option>

                            <option value="PERCENT">%</option>
                          </select>
                        </div>

                        {/* VALUE */}
                        <div className="form-field packhouse-value-field">
                          <label
                            htmlFor={`packhouse-reject-value-${entryIndex}-${rejectIndex}`}
                          >
                            {reject.inputMode === "PERCENT"
                              ? "Reject %"
                              : "Rejected Kg"}
                          </label>

                          <div className="input-with-unit">
                            <input
                              id={`packhouse-reject-value-${entryIndex}-${rejectIndex}`}
                              type="number"
                              min="0"
                              max={
                                reject.inputMode === "PERCENT"
                                  ? 100
                                  : rejectKg || undefined
                              }
                              step="0.01"
                              value={
                                reject.inputValue === 0 ? "" : reject.inputValue
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
                              {reject.inputMode === "PERCENT" ? "%" : "kg"}
                            </span>
                          </div>
                        </div>

                        {/* CALCULATED KG */}
                        <div className="form-field">
                          <label>Calculated Kg</label>

                          <div className="calculated-field">
                            {calculatedKg.toFixed(2)} kg
                          </div>
                        </div>

                        {/* REJECT % */}
                        <div className="form-field">
                          <label>Reject %</label>

                          <div className="calculated-field">
                            {calculatedPct.toFixed(2)}%
                          </div>
                        </div>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => removeReject(entryIndex, rejectIndex)}
                          className="remove-defect-btn"
                          aria-label={`Remove ${reject.rejectType || "reject"}`}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* WARNINGS */}
                {breakdownExceedsTotal && (
                  <div className="packhouse-warning">
                    ⚠️ Reject breakdown exceeds the total reject quantity.
                  </div>
                )}

                {percentRows.length > 0 &&
                  Math.abs(percentageTotal - 100) > 0.1 && (
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

      {/* OVERALL SUMMARY */}
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
