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

  /* const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const [variety, setVariety] = useState('');
  const [harvestedKg, setHarvestedKg] = useState('');
  const [blocks, setBlocks] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [notes, setNotes] = useState('');

  const [fieldRejects, setFieldRejects] = useState<RejectRow[]>([]); */
  /* MULTIPLE VARIETIES ENTRY DEFINITIONS  */
  type VarietyHarvestEntry = {
    id: string;
    variety: string;
    harvestedKg: string;
    blocks: string;
    fieldRejectInputMode: "KG" | "PERCENT";
    totalFieldRejectKg: string;

    fieldRejects: RejectRow[];
  };

  const createVarietyEntry = (): VarietyHarvestEntry => ({
    id: crypto.randomUUID(),
    variety: "",
    harvestedKg: "",
    blocks: "",
    fieldRejectInputMode: "KG",
    totalFieldRejectKg: "",
    fieldRejects: [],
  });

  const [varietyEntries, setVarietyEntries] = useState<VarietyHarvestEntry[]>([
    createVarietyEntry(),
  ]);

  const [supervisor, setSupervisor] = useState("");
  const [notes, setNotes] = useState("");

  function addVariety() {
    setVarietyEntries((current) => [...current, createVarietyEntry()]);
  }

  function removeVariety(id: string) {
    setVarietyEntries((current) =>
      current.length <= 1
        ? current
        : current.filter((entry) => entry.id !== id),
    );
  }

  function updateVariety(id: string, changes: Partial<VarietyHarvestEntry>) {
    setVarietyEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  }
  /* const [processedKg, setProcessedKg] = useState(0);

  const [packhouseRejects, setPackhouseRejects] = useState<RejectRow[]>([]); */

  type PackhouseEntry = {
    variety: string;
    processedKg: number;
    rejectKg: number;
    rejects: RejectRow[];
  };

  const [packhouseEntries, setPackhouseEntries] = useState<PackhouseEntry[]>(
    [],
  );

  const [weather, setWeather] = useState<WeatherData>({
    condition: "",
    temp: 0,
    lat: null,
    lon: null,
    source: "manual",
  });

  /* =========================================
     CALCULATIONS
  ========================================= */

  /* const harvestedNum = Number(harvestedKg) || 0; */

  /* const totalFieldRejectKg = fieldRejects.reduce(
    (sum, row) => sum + (Number(row.rejectKg) || 0),
    0,
  ); */

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

  /* const totalFieldRejectPct =
    harvestedNum > 0 ? (totalFieldRejectKg / harvestedNum) * 100 : 0; */

  /* const processedPct =
    harvestedNum > 0
      ? (processedKg / harvestedNum) * 100
      : 0; */

  /* =========================================
     DATE
  ========================================= */

  function handleDateChange(newDate: string) {
    if (!newDate) return;

    router.push(`/harvest?date=${newDate}`);
  }

  /* =========================================
     SUBMIT
  ========================================= */

  async function handleSubmit(formData: FormData) {
    setMessage("");

    const totalHarvested = varietyEntries.reduce(
      (sum, entry) => sum + (Number(entry.harvestedKg) || 0),
      0,
    );

    if (totalHarvested <= 0) {
      setMessage("Please enter a valid harvested quantity.");
      return;
    }

    if (totalFieldRejectKg > totalHarvested) {
      setMessage("Field rejects cannot exceed the harvested quantity.");
      return;
    }

    /* if (processedKg > harvested) {
      setMessage(
        'Processed quantity cannot exceed harvested quantity.'
      );
      return;
    } */

    /*
     * Convert field reject KG to percentage
     * before sending to the server.
     */
    /*const fieldRejectsPct = fieldRejects.map((row) => ({
      rejectType: row.rejectType,
      rejectPct:
        harvested > 0
          ? Math.round(
              ((Number(row.rejectKg) || 0) / harvested) * 10000
            ) / 100
          : 0,
    }));
*/
    /* const fieldRejectsData = fieldRejects.map((row) => ({
      rejectType: row.rejectType,
      inputMode: row.inputMode,
      inputValue: Number(row.inputValue) || 0,
    })); */

    const harvestEntries = varietyEntries.map((entry) => ({
      variety: entry.variety,
      harvestedKg: Number(entry.harvestedKg) || 0,
      blocks: entry.blocks,
      fieldRejects: entry.fieldRejects.map((row) => ({
        rejectType: row.rejectType,
        inputMode: row.inputMode,
        inputValue: Number(row.inputValue) || 0,
      })),
    }));

    formData.set("harvestEntries", JSON.stringify(harvestEntries));

    formData.set(
      "packhouse",
      JSON.stringify({
        entries: packhouseEntries,
      }),
    );

    formData.set("weather", weather.condition);
    formData.set("weatherTemp", String(weather.temp ?? ""));
    formData.set("weatherLat", String(weather.lat ?? ""));
    formData.set("weatherLon", String(weather.lon ?? ""));
    formData.set("weatherSource", weather.source);

    startTransition(async () => {
      try {
        await createHarvestRecord(formData);

        setMessage("Record saved successfully.");

        /* Reset form */

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

        /* setProcessedKg(0);
        setPackhouseRejects([]); */
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

        setMessage(error instanceof Error ? error.message : "Save failed.");
      }
    });
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <form id="harvest-form" action={handleSubmit} className="harvest-form">
      {/* =====================================
          HARVEST DETAILS
      ===================================== */}

      <section className="form-section">
        {/*<div className="form-section-header">
          <div>
            <h3>Harvest Details</h3>
            <p>Enter the basic information for today's harvest.</p>
          </div>
        </div> */}

        <div className="harvest-grid">
          {/* DATE */}
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

          {/* SUPERVISOR */}
          <div className="form-field">
            <label htmlFor="supervisor">Supervisor</label>

            <input
              id="supervisor"
              name="supervisor"
              type="text"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="form-input"
              placeholder="Enter supervisor name"
            />
          </div>
        </div>
      </section>

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

            /* const fieldRejectKg = entry.fieldRejects.reduce((sum, row) => {
              const value = Number(row.inputValue) || 0;

              if (row.inputMode === "KG") {
                return sum + value;
              }

              return sum + (harvestedKg * value) / 100;
            }, 0); */

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
                  {/* VARIETY */}
                  <div className="form-field">
                    <label>Variety</label>

                    <select
                      value={entry.variety}
                      onChange={(e) =>
                        updateVariety(entry.id, {
                          variety: e.target.value,
                        })
                      }
                      required
                      className="form-input"
                    >
                      <option value="">Select variety</option>

                      {varieties.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* HARVESTED */}
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
                        required
                        className="form-input"
                        placeholder="0.00"
                      />

                      <span>kg</span>
                    </div>
                  </div>

                  {/* BLOCKS */}
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

                {/* QUALITY SUMMARY
                <div className="variety-quality-summary">
                  <div>
                    <span>Harvested</span>
                    <strong>{harvestedKg.toFixed(2)} kg</strong>
                  </div>

                  <div>
                    <span>Field Rejects</span>
                  </div>

                  <div>
                    <span>Reject Rate</span>
                    <strong>{rejectPct.toFixed(2)}%</strong>
                  </div>

                  <div>
                    <span>Good Harvest</span>
                    <strong>{goodKg.toFixed(2)} kg</strong>
                  </div>
                </div>  */}

                {/* FIELD REJECT BREAKDOWN */}
                <div className="variety-reject-section">
                  <div className="subsection-header">
                    {/*<div>
                      <h5>Field Reject Breakdown</h5>
                      <p>Record the reject breakdown for this variety.</p>
                    </div>

                    <strong>{fieldRejectKg.toFixed(2)} kg rejected</strong> */}
                  </div>

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

                {/* QUALITY SUMMARY */}
                <div className="variety-quality-summary">
                  <div>
                    <span>Harvested</span>
                    <strong>{harvestedKg.toFixed(2)} kg</strong>
                  </div>

                  <div>
                    <span>Field Rejects</span>
                    <strong>{totalFieldRejectKg.toFixed(2)} kg</strong>
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
          FIELD QUALITY SUMMARY
      ===================================== */}

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

      {/* =====================================
          FIELD REJECTS
      ===================================== */}

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

            <strong>
              {packhouseEntries
                .reduce(
                  (sum, entry) => sum + (Number(entry.processedKg) || 0),
                  0,
                )
                .toFixed(2)}{" "}
              kg
            </strong>
          </div>
        </div>

        <PackhouseSection
          entries={packhouseEntries}
          onChange={setPackhouseEntries}
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

        <WeatherInput value={weather} onChange={setWeather} />
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
            onChange={(e) => setNotes(e.target.value)}
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
          {pending ? "Saving Harvest..." : "Save Harvest Record"}
        </button>
      </div>
    </form>
  );
}
