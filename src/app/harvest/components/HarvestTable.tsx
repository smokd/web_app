"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHarvestRecord, deleteHarvestRecord } from "../actions.ts";
import { Fragment } from "react";

type FieldReject = {
  id: number;
  rejectType: string;
  rejectPct: number;
  rejectKg: number;
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

//type packhouseLoad: PackhouseLoad[];

type Record = {
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

type Variety = { id: number; name: string };
type Weather = { id: number; name: string };

function fmt2(n: number | null | undefined): string {
  const value = Number(n);

  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export default function HarvestTable({
  records,
  date,
  isAdmin,
  varieties,
  weatherOptions,
}: {
  records: Record[];
  date: string;
  isAdmin: boolean;
  varieties: Variety[];
  weatherOptions: Weather[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function startEdit(record: Record) {
    setEditingId(record.id);
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage("");
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleUpdate(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      try {
        await updateHarvestRecord(formData);
        setEditingId(null);
        setMessage("Record updated.");
        router.refresh();
      } catch (err: any) {
        setMessage(err.message || "Update failed.");
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setMessage("");
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", String(id));
        await deleteHarvestRecord(formData);
        setMessage("Record deleted.");
        router.refresh();
      } catch (err: any) {
        setMessage(err.message || "Delete failed.");
      }
    });
  }

  if (records.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", opacity: 0.7 }}>
        No harvest records for {date}.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Records for {date}</h2>

      {message && (
        <p
          style={{
            marginBottom: "1rem",
            color:
              message.includes("deleted") || message.includes("updated")
                ? "#2e7d32"
                : "#c62828",
          }}
        >
          {message}
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Variety</th>
              <th style={{ textAlign: "right", padding: "0.6rem" }}>
                Harvested
              </th>
              <th style={{ textAlign: "right", padding: "0.6rem" }}>
                Field Rej
              </th>
              <th style={{ textAlign: "right", padding: "0.6rem" }}>Field %</th>
              <th style={{ textAlign: "right", padding: "0.6rem" }}>
                Packhouse
              </th>
              <th style={{ textAlign: "right", padding: "0.6rem" }}>
                Packhouse %
              </th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Blocks</th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Weather</th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>
                Supervisor
              </th>
              <th style={{ textAlign: "left", padding: "0.6rem" }}>Notes</th>
              <th style={{ padding: "0.6rem" }}></th>
              {isAdmin && <th style={{ padding: "0.6rem" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((record) =>
              editingId === record.id ? (
                <EditRow
                  key={record.id}
                  record={record}
                  varieties={varieties}
                  weatherOptions={weatherOptions}
                  onSubmit={handleUpdate}
                  onCancel={cancelEdit}
                  pending={pending}
                  isAdmin={isAdmin}
                />
              ) : (
                <Fragment key={record.id}>
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpand(record.id)}
                  >
                    <td style={{ padding: "0.6rem" }}>{record.variety}</td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      {fmt2(record.harvestedKg)}
                    </td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      {fmt2(record.fieldRejectsKg)}
                    </td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      {fmt2(record.fieldRejectPct * 100)}%
                    </td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      {record.packhouseLoad.length > 0
                        ? fmt2(
                            record.packhouseLoad.reduce(
                              (sum, load) =>
                                sum + (Number(load.processedKg) || 0),
                              0,
                            ),
                          )
                        : "—"}
                    </td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      {record.packhouseLoad.length > 0
                        ? (() => {
                            const processed = record.packhouseLoad.reduce(
                              (sum, load) =>
                                sum + (Number(load.processedKg) || 0),
                              0,
                            );

                            const rejects = record.packhouseLoad.reduce(
                              (sum, load) =>
                                sum +
                                (Array.isArray(load.rejects)
                                  ? load.rejects.reduce(
                                      (rejectSum, reject) =>
                                        rejectSum +
                                        (Number(reject.rejectKg) || 0),
                                      0,
                                    )
                                  : 0),
                              0,
                            );

                            return (
                              fmt2(
                                processed > 0 ? (rejects / processed) * 100 : 0,
                              ) + "%"
                            );
                          })()
                        : "—"}
                    </td>
                    <td style={{ padding: "0.6rem" }}>
                      {record.blocks || "—"}
                    </td>
                    <td style={{ padding: "0.6rem" }}>
                      {record.weather
                        ? `${record.weather}${record.weatherTemp ? ` (${fmt2(record.weatherTemp)}°C)` : ""}`
                        : "—"}
                    </td>
                    <td style={{ padding: "0.6rem" }}>
                      {record.supervisor || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.6rem",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record.notes || "—"}
                    </td>
                    <td style={{ padding: "0.6rem", textAlign: "center" }}>
                      <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                        {expandedId === record.id ? "▲" : "▼"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "0.6rem" }}>
                        <div
                          style={{ display: "flex", gap: "0.5rem" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-secondary"
                            onClick={() => startEdit(record)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleDelete(record.id)}
                            disabled={pending}
                            style={{
                              padding: "0.3rem 0.6rem",
                              fontSize: "0.85rem",
                              background: "#c62828",
                              color: "#fff",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {expandedId === record.id && (
                    <tr>
                      <td
                        colSpan={isAdmin ? 12 : 11}
                        style={{
                          padding: "1rem",
                          background: "rgba(0,0,0,0.02)",
                        }}
                      >
                        {record.fieldRejects.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <strong style={{ fontSize: "0.85rem" }}>
                              Field Defects:
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                                marginTop: "0.25rem",
                              }}
                            >
                              {record.fieldRejects.map((fr) => (
                                <span
                                  key={fr.id}
                                  style={{
                                    fontSize: "0.8rem",
                                    background: "#fff3e0",
                                    padding: "0.15rem 0.4rem",
                                    borderRadius: 4,
                                  }}
                                >
                                  {fr.rejectType}:{" "}
                                  {fmt2(
                                    record.harvestedKg > 0
                                      ? (fr.rejectKg / record.harvestedKg) * 100
                                      : 0,
                                  )}
                                  %
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.packhouseLoad.length > 0 ? (
                          <div>
                            <strong style={{ fontSize: "0.85rem" }}>
                              Packhouse:
                            </strong>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                marginTop: "0.4rem",
                              }}
                            >
                              {record.packhouseLoad.map((load) => (
                                <div
                                  key={load.id}
                                  style={{
                                    padding: "0.5rem",
                                    border: "1px solid var(--border)",
                                    borderRadius: 6,
                                  }}
                                >
                                  <div>
                                    <strong>{load.variety}</strong> —{" "}
                                    {fmt2(load.processedKg)} kg processed
                                  </div>

                                  {load.rejects.length > 0 && (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        flexWrap: "wrap",
                                        marginTop: "0.25rem",
                                      }}
                                    >
                                      {load.rejects.map((reject) => (
                                        <span
                                          key={reject.id}
                                          style={{
                                            fontSize: "0.8rem",
                                            background: "#ffebee",
                                            padding: "0.15rem 0.4rem",
                                            borderRadius: 4,
                                          }}
                                        >
                                          {reject.rejectType}:{" "}
                                          {fmt2(reject.rejectKg)} kg (
                                          {fmt2(reject.rejectPct)}%)
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {record.packhouseLoad.length === 0 &&
                          record.fieldRejects.length === 0 && (
                            <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                              No additional details.
                            </p>
                          )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditRow({
  record,
  varieties,
  weatherOptions,
  onSubmit,
  onCancel,
  pending,
  isAdmin,
}: {
  record: Record;
  varieties: Variety[];
  weatherOptions: Weather[];
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  pending: boolean;
  isAdmin: boolean;
}) {
  const [harvested, setHarvested] = useState(String(record.harvestedKg));
  const [rejects, setRejects] = useState(String(record.fieldRejectsKg));

  const harvestedNum = Number(harvested) || 0;
  const rejectsNum = Number(rejects) || 0;
  const rejectPct =
    harvestedNum > 0 ? ((rejectsNum / harvestedNum) * 100).toFixed(2) : "0.00";

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <td colSpan={isAdmin ? 12 : 11} style={{ padding: "0.6rem" }}>
        <form
          action={onSubmit}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <input type="hidden" name="id" value={record.id} />
          <input type="hidden" name="date" value={record.date} />

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Variety</label>
            <select
              name="variety"
              defaultValue={record.variety}
              required
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            >
              {varieties.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 100 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              Harvested
            </label>
            <input
              name="harvestedKg"
              type="number"
              min="0"
              step="0.01"
              required
              value={harvested}
              onChange={(e) => setHarvested(e.target.value)}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 100 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Rejects</label>
            <input
              name="fieldRejectsKg"
              type="number"
              min="0"
              step="0.01"
              required
              value={rejects}
              onChange={(e) => setRejects(e.target.value)}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 80 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Rej %</label>
            <div
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                background: "var(--formula-bg, #e8f5e9)",
                fontWeight: 600,
                minWidth: 60,
              }}
            >
              {rejectPct}%
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 100 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Blocks</label>
            <input
              name="blocks"
              type="text"
              defaultValue={record.blocks || ""}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Weather</label>
            <select
              name="weather"
              defaultValue={record.weather || ""}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            >
              <option value="">—</option>
              {weatherOptions.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>
              Supervisor
            </label>
            <input
              name="supervisor"
              type="text"
              defaultValue={record.supervisor || ""}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 200,
              flex: 1,
            }}
          >
            <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Notes</label>
            <input
              name="notes"
              type="text"
              maxLength={500}
              defaultValue={record.notes || ""}
              style={{
                padding: "0.4rem",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
              style={{
                padding: "0.4rem 0.8rem",
                fontSize: "0.85rem",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
