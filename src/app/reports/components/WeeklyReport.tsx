'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

type Harvest = {
  id: number;
  date: string;
  variety: string;
  harvestedKg: number;
  fieldRejectPct: number;

  fieldRejects: Array<{
    rejectType: string;
    rejectKg?: number;
    rejectPct: number;
  }>;

  packhouseLoad?: {
    processedKg: number;

    rejects: Array<{
      rejectType: string;
      rejectKg: number;
      rejectPct: number;
    }>;
  } | null;
};

const COLORS = [
  '#0ac5b2',
  '#2c7ec4',
  '#f0b419',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export default function WeeklyReport({
  data,
}: {
  data: Harvest[];
}) {
  const [view, setView] = useState<
    'overview' | 'variety' | 'daily' | 'defects'
  >('overview');

  /*
   * ==========================================
   * WEEK SUMMARY
   * ==========================================
   */

  const summary = useMemo(() => {
    let harvested = 0;
    let fieldReject = 0;
    let processed = 0;
    let packhouseReject = 0;

    data.forEach((h) => {
      harvested += Number(h.harvestedKg || 0);

      fieldReject += h.fieldRejects.reduce(
        (sum, r) => sum + Number(r.rejectKg || 0),
        0
      );

      processed += Number(
        h.packhouseLoad?.processedKg || 0
      );

      packhouseReject +=
        h.packhouseLoad?.rejects.reduce(
          (sum, r) =>
            sum + Number(r.rejectKg || 0),
          0
        ) || 0;
    });

    return {
      harvested,
      fieldReject,
      processed,
      packhouseReject,

      fieldRejectPct:
        harvested > 0
          ? (fieldReject / harvested) * 100
          : 0,

      packhouseRejectPct:
        processed > 0
          ? (packhouseReject / processed) * 100
          : 0,

      totalLoss:
        fieldReject + packhouseReject,

      overallRejectPct:
        harvested > 0
          ? ((fieldReject + packhouseReject) /
              harvested) *
            100
          : 0,
    };
  }, [data]);

  /*
   * ==========================================
   * VARIETY
   * ==========================================
   */

  const varietyData = useMemo(() => {
    const map = new Map<
      string,
      {
        harvested: number;
        fieldReject: number;
        processed: number;
        packhouseReject: number;
      }
    >();

    data.forEach((h) => {
      const existing =
        map.get(h.variety) || {
          harvested: 0,
          fieldReject: 0,
          processed: 0,
          packhouseReject: 0,
        };

      existing.harvested += Number(
        h.harvestedKg || 0
      );

      existing.fieldReject +=
        h.fieldRejects.reduce(
          (sum, r) =>
            sum + Number(r.rejectKg || 0),
          0
        );

      existing.processed += Number(
        h.packhouseLoad?.processedKg || 0
      );

      existing.packhouseReject +=
        h.packhouseLoad?.rejects.reduce(
          (sum, r) =>
            sum + Number(r.rejectKg || 0),
          0
        ) || 0;

      map.set(h.variety, existing);
    });

    return Array.from(map.entries())
      .map(([variety, values]) => ({
        variety,

        harvested: values.harvested,

        fieldReject: values.fieldReject,

        fieldRejectPct:
          values.harvested > 0
            ? (values.fieldReject /
                values.harvested) *
              100
            : 0,

        processed: values.processed,

        packhouseReject:
          values.packhouseReject,

        packhouseRejectPct:
          values.processed > 0
            ? (values.packhouseReject /
                values.processed) *
              100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.harvested - a.harvested
      );
  }, [data]);

  /*
   * ==========================================
   * DAILY
   * ==========================================
   */

  const dailyData = useMemo(() => {
    const map = new Map<
      string,
      {
        harvested: number;
        fieldReject: number;
        processed: number;
        packhouseReject: number;
      }
    >();

    data.forEach((h) => {
      const existing =
        map.get(h.date) || {
          harvested: 0,
          fieldReject: 0,
          processed: 0,
          packhouseReject: 0,
        };

      existing.harvested += Number(
        h.harvestedKg || 0
      );

      existing.fieldReject +=
        h.fieldRejects.reduce(
          (sum, r) =>
            sum + Number(r.rejectKg || 0),
          0
        );

      existing.processed += Number(
        h.packhouseLoad?.processedKg || 0
      );

      existing.packhouseReject +=
        h.packhouseLoad?.rejects.reduce(
          (sum, r) =>
            sum + Number(r.rejectKg || 0),
          0
        ) || 0;

      map.set(h.date, existing);
    });

    return Array.from(map.entries())
      .map(([date, values]) => ({
        date: date.slice(5),

        harvested: values.harvested,

        fieldReject: values.fieldReject,

        processed: values.processed,

        packhouseReject:
          values.packhouseReject,

        fieldRejectPct:
          values.harvested > 0
            ? (values.fieldReject /
                values.harvested) *
              100
            : 0,

        packhouseRejectPct:
          values.processed > 0
            ? (values.packhouseReject /
                values.processed) *
              100
            : 0,
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );
  }, [data]);

  /*
   * ==========================================
   * DEFECTS
   * ==========================================
   */

  const defectData = useMemo(() => {
    const map = new Map<
      string,
      {
        fieldKg: number;
        packhouseKg: number;
      }
    >();

    data.forEach((h) => {
      /*
       * FIELD DEFECTS
       */

      h.fieldRejects.forEach((reject) => {
        const existing =
          map.get(reject.rejectType) || {
            fieldKg: 0,
            packhouseKg: 0,
          };

        existing.fieldKg += Number(
          reject.rejectKg || 0
        );

        map.set(
          reject.rejectType,
          existing
        );
      });

      /*
       * PACKHOUSE DEFECTS
       */

      h.packhouseLoad?.rejects.forEach(
        (reject) => {
          const existing =
            map.get(reject.rejectType) || {
              fieldKg: 0,
              packhouseKg: 0,
            };

          existing.packhouseKg += Number(
            reject.rejectKg || 0
          );

          map.set(
            reject.rejectType,
            existing
          );
        }
      );
    });

    return Array.from(map.entries())
      .map(([name, values]) => ({
        name,

        fieldKg: values.fieldKg,

        packhouseKg:
          values.packhouseKg,

        totalKg:
          values.fieldKg +
          values.packhouseKg,
      }))
      .sort(
        (a, b) =>
          b.totalKg - a.totalKg
      )
      .slice(0, 8);
  }, [data]);

  /*
   * ==========================================
   * OVERVIEW
   * ==========================================
   */

  return (
    <div className="weekly-report">

      {/* ================================
          NAVIGATION
      ================================= */}

      <div className="report-tabs">

        <button
          onClick={() =>
            setView('overview')
          }
          className={
            view === 'overview'
              ? 'report-tab active'
              : 'report-tab'
          }
        >
          Overview
        </button>

        <button
          onClick={() =>
            setView('variety')
          }
          className={
            view === 'variety'
              ? 'report-tab active'
              : 'report-tab'
          }
        >
          By Variety
        </button>

        <button
          onClick={() =>
            setView('daily')
          }
          className={
            view === 'daily'
              ? 'report-tab active'
              : 'report-tab'
          }
        >
          Daily Trend
        </button>

        <button
          onClick={() =>
            setView('defects')
          }
          className={
            view === 'defects'
              ? 'report-tab active'
              : 'report-tab'
          }
        >
          Defects
        </button>

      </div>


      {/* ================================
          OVERVIEW
      ================================= */}

      {view === 'overview' && (
        <Overview
          summary={summary}
          dailyData={dailyData}
          defectData={defectData}
        />
      )}


      {/* ================================
          VARIETY
      ================================= */}

      {view === 'variety' && (
        <VarietyReport
          data={varietyData}
        />
      )}


      {/* ================================
          DAILY
      ================================= */}

      {view === 'daily' && (
        <DailyReport
          data={dailyData}
        />
      )}


      {/* ================================
          DEFECTS
      ================================= */}

      {view === 'defects' && (
        <DefectReport
          data={defectData}
        />
      )}

    </div>
  );
}


/* =====================================================
   OVERVIEW
===================================================== */

function Overview({
  summary,
  dailyData,
  defectData,
}: any) {
  return (
    <div className="report-section">

      <div className="report-section-header">
        <div>
          <h2>Weekly Overview</h2>
          <p>
            Production and quality performance
          </p>
        </div>
      </div>


      {/* KPI GRID */}

      <div className="report-summary-grid">

        <SummaryCard
          label="Harvested"
          value={`${summary.harvested.toLocaleString()} kg`}
        />

        <SummaryCard
          label="Field Reject"
          value={`${summary.fieldRejectPct.toFixed(2)}%`}
          secondary={`${summary.fieldReject.toLocaleString()} kg`}
        />

        <SummaryCard
          label="Packhouse Processed"
          value={`${summary.processed.toLocaleString()} kg`}
        />

        <SummaryCard
          label="Packhouse Reject"
          value={`${summary.packhouseRejectPct.toFixed(2)}%`}
          secondary={`${summary.packhouseReject.toLocaleString()} kg`}
        />

      </div>


      {/* DAILY CHART */}

      <ReportCard title="Daily Harvest & Processing">

        <ResponsiveContainer
          width="100%"
          height={350}
        >
          <BarChart data={dailyData}>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="harvested"
              name="Harvested Kg"
              fill="#0ac5b2"
            />

            <Bar
              dataKey="processed"
              name="Processed Kg"
              fill="#2c7ec4"
            />

          </BarChart>
        </ResponsiveContainer>

      </ReportCard>


      {/* REJECT TREND */}

      <ReportCard title="Quality Trend">

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <LineChart data={dailyData}>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="fieldRejectPct"
              name="Field Reject %"
              stroke="#ef4444"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="packhouseRejectPct"
              name="Packhouse Reject %"
              stroke="#f0b419"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </ReportCard>


      {/* DEFECT TABLE */}

      <ReportCard title="Top Defects">

        <DefectTable
          data={defectData}
        />

      </ReportCard>

    </div>
  );
}


/* =====================================================
   VARIETY REPORT
===================================================== */

function VarietyReport({
  data,
}: {
  data: any[];
}) {
  return (
    <div className="report-section">

      <ReportCard title="Harvest Performance by Variety">

        <ResponsiveContainer
          width="100%"
          height={400}
        >
          <BarChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis dataKey="variety" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="harvested"
              name="Harvested Kg"
              fill="#0ac5b2"
            />

            <Bar
              dataKey="fieldReject"
              name="Field Reject Kg"
              fill="#ef4444"
            />

            <Bar
              dataKey="packhouseReject"
              name="Packhouse Reject Kg"
              fill="#f0b419"
            />

          </BarChart>
        </ResponsiveContainer>

      </ReportCard>


      <ReportCard title="Variety Quality Summary">

        <div className="report-table-wrapper">

          <table className="report-table">

            <thead>
              <tr>
                <th>Variety</th>
                <th>Harvested</th>
                <th>Field Reject</th>
                <th>Field %</th>
                <th>Processed</th>
                <th>Packhouse Reject</th>
                <th>Packhouse %</th>
              </tr>
            </thead>

            <tbody>

              {data.map((row) => (
                <tr key={row.variety}>

                  <td>
                    <strong>
                      {row.variety}
                    </strong>
                  </td>

                  <td>
                    {row.harvested.toLocaleString()}
                  </td>

                  <td>
                    {row.fieldReject.toLocaleString()}
                  </td>

                  <td>
                    {row.fieldRejectPct.toFixed(2)}%
                  </td>

                  <td>
                    {row.processed.toLocaleString()}
                  </td>

                  <td>
                    {row.packhouseReject.toLocaleString()}
                  </td>

                  <td>
                    {row.packhouseRejectPct.toFixed(2)}%
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </ReportCard>

    </div>
  );
}


/* =====================================================
   DAILY REPORT
===================================================== */

function DailyReport({
  data,
}: {
  data: any[];
}) {
  return (
    <div className="report-section">

      <ReportCard title="Daily Production">

        <ResponsiveContainer
          width="100%"
          height={400}
        >
          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="harvested"
              name="Harvested Kg"
              stroke="#0ac5b2"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="processed"
              name="Processed Kg"
              stroke="#2c7ec4"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </ReportCard>


      <ReportCard title="Daily Reject Rate">

        <ResponsiveContainer
          width="100%"
          height={350}
        >
          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
            />

            <XAxis dataKey="date" />

            <YAxis unit="%" />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="fieldRejectPct"
              name="Field Reject %"
              stroke="#ef4444"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="packhouseRejectPct"
              name="Packhouse Reject %"
              stroke="#f0b419"
              strokeWidth={3}
            />

          </LineChart>
        </ResponsiveContainer>

      </ReportCard>

    </div>
  );
}


/* =====================================================
   DEFECT REPORT
===================================================== */

function DefectReport({
  data,
}: {
  data: any[];
}) {
  return (
    <div className="report-section">

      <ReportCard title="Top Defect Types">

        <ResponsiveContainer
          width="100%"
          height={400}
        >
          <PieChart>

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={140}
              dataKey="totalKg"
              nameKey="name"
              label={({ name, percent }) =>
                `${name}: ${(
                  percent * 100
                ).toFixed(1)}%`
              }
            >

              {data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />
                )
              )}

            </Pie>

            <Tooltip />

          </PieChart>
        </ResponsiveContainer>

      </ReportCard>


      <ReportCard title="Defect Breakdown">

        <DefectTable
          data={data}
        />

      </ReportCard>

    </div>
  );
}


/* =====================================================
   DEFECT TABLE
===================================================== */

function DefectTable({
  data,
}: {
  data: any[];
}) {
  return (
    <div className="report-table-wrapper">

      <table className="report-table">

        <thead>

          <tr>
            <th>Defect</th>
            <th>Field Kg</th>
            <th>Packhouse Kg</th>
            <th>Total Kg</th>
          </tr>

        </thead>

        <tbody>

          {data.map((row) => (
            <tr key={row.name}>

              <td>
                <strong>
                  {row.name}
                </strong>
              </td>

              <td>
                {row.fieldKg.toFixed(2)}
              </td>

              <td>
                {row.packhouseKg.toFixed(2)}
              </td>

              <td>
                <strong>
                  {row.totalKg.toFixed(2)}
                </strong>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}


/* =====================================================
   COMPONENTS
===================================================== */

function SummaryCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="report-summary-card">

      <span>{label}</span>

      <strong>{value}</strong>

      {secondary && (
        <small>{secondary}</small>
      )}

    </div>
  );
}


function ReportCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-card">

      <div className="report-card-header">
        <h3>{title}</h3>
      </div>

      <div className="report-card-body">
        {children}
      </div>

    </section>
  );
}
