"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createHarvestRecord } from "../actions.ts";
import FieldRejectSection from "./FieldRejectSection";
import PackhouseSection from "./PackhouseSection";
import WeatherInput, { WeatherData } from "./WeatherInput";

type Variety = {
  id: number;
  name: string;
};

type WeatherOpt = {
  id: number;
  name: string;
};

type RejectRow = {
  rejectType: string;
  inputMode: "KG" | "PERCENT";
  inputValue: number;
};

type VarietyHarvestEntry = {
  id: string;
  variety: string;
  harvestedKg: string;
  blocks: string;
  fieldRejectInputMode: "KG" | "PERCENT";
  totalFieldRejectKg: string;
  fieldRejects: RejectRow[];
};

type PackhouseEntry = {
  variety: string;
  processedKg: number;
  rejectKg: number;
  rejects: RejectRow[];
  rejectInputMode: "KG" | "PERCENT";
};

export default function HarvestForm({
  varieties,
  weatherOptions,
  date,
}: {
  varieties: Variety[];
  weatherOptions: WeatherOpt[];
  date: string;
}) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  /*
   * =========================================
   * HARVEST ENTRIES
   * =========================================
   */

  const createVarietyEntry = (): VarietyHarvestEntry => ({
    id: crypto.randomUUID(),
    variety: "",
    harvestedKg: "",
    blocks: "",
    fieldRejectInputMode: "PERCENT",
    totalFieldRejectKg: "",
    fieldRejects: [],
  });

  const [varietyEntries, setVarietyEntries] = useState<VarietyHarvestEntry[]>([
    createVarietyEntry(),
  ]);

  const [supervisor, setSupervisor] = useState("");
  const [notes, setNotes] = useState("");

  function addVariety() {
    clearSuccessMessage();
    setVarietyEntries((current) => [...current, createVarietyEntry()]);
  }

  function removeVariety(id: string) {
    clearSuccessMessage();
    setVarietyEntries((current) =>
      current.length <= 1
        ? current
        : current.filter((entry) => entry.id !== id),
    );
  }

  function updateVariety(id: string, changes: Partial<VarietyHarvestEntry>) {
    clearSuccessMessage();
    setVarietyEntries((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...changes,
            }
          : entry,
      ),
    );
  }

  /*
   * =========================================
   * PACKHOUSE ENTRIES
   * =========================================
   */

  const [packhouseEntries, setPackhouseEntries] = useState<PackhouseEntry[]>(
    [],
  );

  /*
   * =========================================
   * WEATHER
   * =========================================
   */

  const [weather, setWeather] = useState<WeatherData>({
    condition: "",
    temp: 0,
    lat: null,
    lon: null,
    source: "manual",
  });

  /*
   * =========================================
   * HARVEST CALCULATIONS
   * =========================================
   */

  const totalHarvestedKg = varietyEntries.reduce(
    (sum, entry) => sum + (Number(entry.harvestedKg) || 0),
    0,
  );

  const totalFieldRejectKg = varietyEntries.reduce((sum, entry) => {
    const harvestedKg = Number(entry.harvestedKg) || 0;

    const fieldRejectKg =
      entry.fieldRejectInputMode === "PERCENT"
        ? Number(entry.totalFieldRejectKg) || 0
        : entry.fieldRejects.reduce(
            (rejectSum, row) => rejectSum + (Number(row.inputValue) || 0),
            0,
          );

    return sum + fieldRejectKg;
  }, 0);

  const totalFieldRejectPct =
    totalHarvestedKg > 0 ? (totalFieldRejectKg / totalHarvestedKg) * 100 : 0;

  const totalGoodKg = Math.max(0, totalHarvestedKg - totalFieldRejectKg);

  /*
   * =========================================
   * PACKHOUSE CALCULATIONS
   * =========================================
   */

  const totalPackhouseProcessedKg = packhouseEntries.reduce(
    (sum, entry) => sum + (Number(entry.processedKg) || 0),
    0,
  );

  const totalPackhouseRejectKg = packhouseEntries.reduce(
    (sum, entry) => sum + (Number(entry.rejectKg) || 0),
    0,
  );

  /*
   * =========================================
   * DATE
   * =========================================
   */

  function handleDateChange(newDate: string) {
    if (!newDate) return;

    router.push(`/harvest?date=${newDate}`);
  }

  /*
   * =========================================
   * SUBMIT
   * =========================================
   */

  function clearSuccessMessage() {
    setMessage((current) =>
      current === "Record saved successfully." ? "" : current,
    );
  }

  async function handleSubmit(formData: FormData) {
    setMessage("");

    /*
     * Validate varieties on the client before
     * sending anything to the server.
     */
    const invalidVariety = varietyEntries.find(
      (entry) =>
        !entry.variety ||
        !Number.isFinite(Number(entry.harvestedKg)) ||
        Number(entry.harvestedKg) <= 0,
    );

    if (invalidVariety) {
      setMessage(
        "Please select a variety and enter a valid harvested quantity.",
      );
      return;
    }

    /*
     * Validate field reject rows before submission.
     *
     * This prevents submitting an intentionally empty
     * reject row and gives the user a useful message
     * without losing the rest of the form.
     */
    for (let entryIndex = 0; entryIndex < varietyEntries.length; entryIndex++) {
      const entry = varietyEntries[entryIndex];

      for (
        let rejectIndex = 0;
        rejectIndex < entry.fieldRejects.length;
        rejectIndex++
      ) {
        const reject = entry.fieldRejects[rejectIndex];

        if (!reject.rejectType.trim()) {
          setMessage(
            `Please select a field reject type for ${entry.variety || `variety ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }

        if (
          !Number.isFinite(Number(reject.inputValue)) ||
          Number(reject.inputValue) < 0
        ) {
          setMessage(
            `Please enter a valid field reject value for ${entry.variety || `variety ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }
      }
    }

    /*
     * Validate packhouse reject rows before submission.
     */
    for (
      let entryIndex = 0;
      entryIndex < packhouseEntries.length;
      entryIndex++
    ) {
      const entry = packhouseEntries[entryIndex];

      for (
        let rejectIndex = 0;
        rejectIndex < entry.rejects.length;
        rejectIndex++
      ) {
        const reject = entry.rejects[rejectIndex];

        if (!reject.rejectType.trim()) {
          setMessage(
            `Please select a packhouse reject type for ${entry.variety || `packhouse entry ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }

        if (
          !Number.isFinite(Number(reject.inputValue)) ||
          Number(reject.inputValue) < 0
        ) {
          setMessage(
            `Please enter a valid packhouse reject value for ${entry.variety || `packhouse entry ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }
      }
    }

    for (let entryIndex = 0; entryIndex < varietyEntries.length; entryIndex++) {
      const entry = varietyEntries[entryIndex];

      if (entry.fieldRejectInputMode === "PERCENT") {
        const percentTotal = entry.fieldRejects.reduce(
          (sum, reject) => sum + (Number(reject.inputValue) || 0),
          0,
        );

        if (
          entry.fieldRejects.length > 0 &&
          Math.abs(percentTotal - 100) > 0.1
        ) {
          setMessage(
            `Field reject percentages for ${entry.variety || `Variety ${entryIndex + 1}`} must total 100%. Current total: ${percentTotal.toFixed(2)}%.`,
          );
          return;
        }
      }

      for (
        let rejectIndex = 0;
        rejectIndex < entry.fieldRejects.length;
        rejectIndex++
      ) {
        const reject = entry.fieldRejects[rejectIndex];

        if (!reject.rejectType.trim()) {
          setMessage(
            `Please select a field reject type for ${entry.variety || `Variety ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }

        if (
          !Number.isFinite(Number(reject.inputValue)) ||
          Number(reject.inputValue) < 0
        ) {
          setMessage(
            `Please enter a valid field reject value for ${entry.variety || `Variety ${entryIndex + 1}`} at reject row ${rejectIndex + 1}.`,
          );
          return;
        }
      }
    }

    const totalHarvested = varietyEntries.reduce(
      (sum, entry) => sum + (Number(entry.harvestedKg) || 0),
      0,
    );

    if (totalHarvested <= 0) {
      setMessage("Please enter a valid harvested quantity.");
      return;
    }

    if (totalFieldRejectKg > totalHarvested + 0.01) {
      setMessage("Field rejects cannot exceed the harvested quantity.");
      return;
    }

    /*
     * Build harvest entries from React state.
     */
    const harvestEntries = varietyEntries.map((entry) => ({
      variety: entry.variety,
      harvestedKg: Number(entry.harvestedKg) || 0,
      blocks: entry.blocks,
      fieldRejectInputMode: entry.fieldRejectInputMode,
      totalFieldRejectKg: Number(entry.totalFieldRejectKg) || 0,
      fieldRejects: entry.fieldRejects.map((row) => ({
        rejectType: row.rejectType,
        inputMode: row.inputMode,
        inputValue: Number(row.inputValue) || 0,
      })),
    }));

    formData.set("harvestEntries", JSON.stringify(harvestEntries));

    /*
     * Build packhouse data from React state.
     */
    formData.set(
      "packhouse",
      JSON.stringify({
        entries: packhouseEntries,
      }),
    );

    /*
     * Weather.
     */
    formData.set("weather", weather.condition);
    formData.set("weatherTemp", String(weather.temp ?? ""));
    formData.set("weatherLat", String(weather.lat ?? ""));
    formData.set("weatherLon", String(weather.lon ?? ""));
    formData.set("weatherSource", weather.source);

    startTransition(async () => {
      try {
        await createHarvestRecord(formData);

        /*
         * ONLY reset the form after successful save.
         */
        setMessage("Record saved successfully.");

        setVarietyEntries([createVarietyEntry()]);
        setSupervisor("");
        setNotes("");
        setPackhouseEntries([]);

        setWeather({
          condition: "",
          temp: 0,
          lat: null,
          lon: null,
          source: "manual",
        });

        router.refresh();
      } catch (error) {
        console.error(error);

        /*
         * IMPORTANT:
         *
         * Do NOT reset any React state here.
         *
         * The user should see the exact same form
         * with all varieties, selections, KG values
         * and reject rows preserved.
         */
        setMessage(
          error instanceof Error
            ? error.message
            : "Save failed. Please check the form and try again.",
        );
      }
    });
  }

  return (
    <form
      id="harvest-form"
      onChange={() => {
        if (message) {
          setMessage("");
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        handleSubmit(formData);
      }}
      className="harvest-form"
    >
      {/* =====================================
          HARVEST DETAILS
      ===================================== */}

      <section className="form-section">
        <div className="harvest-grid">
          <div className="form-field">
            <label htmlFor="date">Harvest Date</label>

            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              required
              onChange={(e) => handleDateChange(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="supervisor">Supervisor</label>

            <input
              id="supervisor"
              name="supervisor"
              type="text"
              value={supervisor}
              onChange={(e) => {
                clearSuccessMessage();
                setSupervisor(e.target.value);
              }}
              className="form-input"
              placeholder="Enter supervisor name"
            />
          </div>
        </div>
      </section>

      {/* =====================================
          HARVEST BY VARIETY
      ===================================== */}

      <section className="form-section variety-section">
        <div className="form-section-header">
          <div>
            <h3>Harvest by Variety</h3>

            <p>
              Add each variety harvested today and record its field rejects
              separately.
            </p>
          </div>

          <div className="calculated-value">
            <span>Total Harvest</span>

            <strong>{totalHarvestedKg.toFixed(2)} kg</strong>
          </div>
        </div>

        <div className="variety-harvest-list">
          {varietyEntries.map((entry, index) => {
            const harvestedKg = Number(entry.harvestedKg) || 0;

            const fieldRejectKg =
              entry.fieldRejectInputMode === "PERCENT"
                ? Number(entry.totalFieldRejectKg) || 0
                : entry.fieldRejects.reduce(
                    (sum, reject) => sum + (Number(reject.inputValue) || 0),
                    0,
                  );

            const rejectPct =
              harvestedKg > 0 ? (fieldRejectKg / harvestedKg) * 100 : 0;

            const goodKg = Math.max(harvestedKg - fieldRejectKg, 0);

            return (
              <div key={entry.id} className="variety-harvest-card">
                <div className="variety-harvest-header">
                  <div>
                    <span className="variety-number">Variety {index + 1}</span>

                    <h4>{entry.variety || "New Variety"}</h4>
                  </div>

                  {varietyEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariety(entry.id)}
                      className="btn btn-danger btn-small"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="harvest-grid">
                  <div className="form-field">
                    <label>Variety</label>

                    <select
                      value={entry.variety}
                      onChange={(e) =>
                        updateVariety(entry.id, {
                          variety: e.target.value,
                        })
                      }
                      className="form-input"
                      required={Number(entry.harvestedKg) > 0}
                    >
                      <option value="">Select variety</option>

                      {varieties.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Harvested Quantity</label>

                    <div className="input-with-unit">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.harvestedKg}
                        onChange={(e) =>
                          updateVariety(entry.id, {
                            harvestedKg: e.target.value,
                          })
                        }
                        className="form-input"
                        placeholder="0.00"
                      />

                      <span>kg</span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Blocks</label>

                    <input
                      type="text"
                      value={entry.blocks}
                      onChange={(e) =>
                        updateVariety(entry.id, {
                          blocks: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="e.g. 14,15,27&29"
                    />
                  </div>
                </div>

                <div className="variety-reject-section">
                  <FieldRejectSection
                    fieldRejects={entry.fieldRejects}
                    harvestedKg={harvestedKg}
                    inputMode={entry.fieldRejectInputMode}
                    totalFieldRejectKg={entry.totalFieldRejectKg}
                    onInputModeChange={(inputMode) =>
                      updateVariety(entry.id, {
                        fieldRejectInputMode: inputMode,
                      })
                    }
                    onTotalFieldRejectKgChange={(totalFieldRejectKg) =>
                      updateVariety(entry.id, {
                        totalFieldRejectKg,
                      })
                    }
                    onChange={(rejects) =>
                      updateVariety(entry.id, {
                        fieldRejects: rejects,
                      })
                    }
                  />
                </div>

                <div className="variety-quality-summary">
                  <div>
                    <span>Harvested</span>

                    <strong>{harvestedKg.toFixed(2)} kg</strong>
                  </div>

                  <div>
                    <span>Field Rejects</span>

                    <strong>{fieldRejectKg.toFixed(2)} kg</strong>
                  </div>

                  <div>
                    <span>Reject Rate</span>

                    <strong>{rejectPct.toFixed(2)}%</strong>
                  </div>

                  <div>
                    <span>Good Harvest</span>

                    <strong>{goodKg.toFixed(2)} kg</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addVariety}
          className="btn btn-secondary add-variety-button"
        >
          + Add Another Variety
        </button>
      </section>

      {/* =====================================
          HARVEST SUMMARY
      ===================================== */}

      {totalHarvestedKg > 0 && (
        <section className="quality-summary">
          <div>
            <span>Total Harvest</span>

            <strong>{totalHarvestedKg.toFixed(2)} kg</strong>
          </div>

          <div>
            <span>Total Field Rejects</span>

            <strong>{totalFieldRejectKg.toFixed(2)} kg</strong>
          </div>

          <div>
            <span>Field Reject Rate</span>

            <strong>{totalFieldRejectPct.toFixed(2)}%</strong>
          </div>

          <div>
            <span>Good Harvest</span>

            <strong>{totalGoodKg.toFixed(2)} kg</strong>
          </div>
        </section>
      )}

      {/* =====================================
          PACKHOUSE
      ===================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <div>
            <h3>Packhouse</h3>

            <p>Record processed quantity and packhouse rejects.</p>
          </div>

          <div className="calculated-value">
            <span>Processed</span>

            <strong>{totalPackhouseProcessedKg.toFixed(2)} kg</strong>
          </div>
        </div>

        <PackhouseSection
          entries={packhouseEntries}
          onChange={(entries) => {
            clearSuccessMessage();
            setPackhouseEntries(entries);
          }}
          varieties={varieties}
        />
      </section>

      {/* =====================================
          WEATHER
      ===================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <div>
            <h3>Weather Conditions</h3>

            <p>Record conditions during harvesting.</p>
          </div>
        </div>

        <WeatherInput
          value={weather}
          onChange={(value) => {
            clearSuccessMessage();
            setWeather(value);
          }}
        />
      </section>

      {/* =====================================
          NOTES
      ===================================== */}

      <section className="form-section">
        <div className="form-field">
          <label htmlFor="notes">Notes</label>

          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) => {
              clearSuccessMessage();
              setNotes(e.target.value);
            }}
            className="form-input"
            placeholder="Additional observations..."
          />
        </div>
      </section>

      {/* =====================================
          MESSAGE
      ===================================== */}

      {message && (
        <div
          className={
            message.includes("success")
              ? "form-message success"
              : "form-message error"
          }
        >
          {message}
        </div>
      )}

      {/* =====================================
          SAVE
      ===================================== */}

      <div className="form-actions">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary save-button"
        >
          {pending ? "Saving..." : "Save Harvest Record"}
        </button>
      </div>
    </form>
  );
}
