import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import WeeklyReport from './components/WeeklyReport';
import PDFDownloadButton from './components/PDFDownloadButton';

function getWeekStart(dateStr: string): Date {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();

  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);
  d.setHours(0, 0, 0, 0);

  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;

  const pickedDate =
    params?.date ||
    new Date().toISOString().split('T')[0];

  const weekStart = getWeekStart(pickedDate);

  const weekDates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDates.push(formatDate(d));
  }

  const dateFilters = weekDates.map((date) => ({
    date: {
      startsWith: date,
    },
  }));

  const harvests = await prisma.harvest.findMany({
    where: {
      OR: dateFilters,
    },

    include: {
      fieldRejects: true,

      packhouseLoad: {
        include: {
          rejects: true,
        },
      },
    },

    orderBy: {
      date: 'asc',
    },
  });

  /* =========================================
     WEEK SUMMARY
  ========================================= */

  const totalHarvested = harvests.reduce(
    (sum, h) => sum + Number(h.harvestedKg || 0),
    0
  );

  /*
   * Use Harvest.fieldRejectsKg as the primary
   * source because your Harvest model now stores
   * the actual field reject weight.
   */
  const totalFieldRejectKg = harvests.reduce(
    (sum, h) => sum + Number(h.fieldRejectsKg || 0),
    0
  );

  const totalProcessedKg = harvests.reduce(
    (sum, h) =>
      sum + Number(h.packhouseLoad?.processedKg || 0),
    0
  );

  const totalPackhouseRejectKg = harvests.reduce(
    (sum, h) =>
      sum +
      (h.packhouseLoad?.rejects.reduce(
        (rejectSum, r) =>
          rejectSum + Number(r.rejectKg || 0),
        0
      ) || 0),
    0
  );

  const fieldRejectPct =
    totalHarvested > 0
      ? (totalFieldRejectKg / totalHarvested) * 100
      : 0;

  const packhouseRejectPct =
    totalProcessedKg > 0
      ? (totalPackhouseRejectKg / totalProcessedKg) * 100
      : 0;

  const weekEnd = new Date(weekStart);

  weekEnd.setDate(
    weekEnd.getDate() + 6
  );

  return (
    <main className="reports-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="reports-header">

        <div>
          <h1>Weekly Quality Report</h1>

          <p>
            Harvest and quality performance
            for the selected week.
          </p>
        </div>

        <div
          className="report-header-actions"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.75rem',
          }}
        >

          <div className="report-period">

            <span>Reporting Period</span>

            <strong>
              {formatDate(weekStart)}
              {' – '}
              {formatDate(weekEnd)}
            </strong>

          </div>

          {/* PDF DOWNLOAD */}
          <PDFDownloadButton
            data={harvests}
            weekStart={formatDate(weekStart)}
            weekEnd={formatDate(weekEnd)}
          />

        </div>

      </header>


      {/* =====================================
          DATE PICKER
      ===================================== */}

      <WeekPicker
        pickedDate={pickedDate}
      />


      {/* =====================================
          KPI CARDS
      ===================================== */}

      <section className="report-kpis">

        <ReportKpi
          label="Harvested"
          value={`${formatNumber(totalHarvested)} kg`}
        />

        <ReportKpi
          label="Field Reject"
          value={`${fieldRejectPct.toFixed(2)}%`}
          secondary={`${formatNumber(totalFieldRejectKg)} kg`}
        />

        <ReportKpi
          label="Processed"
          value={`${formatNumber(totalProcessedKg)} kg`}
        />

        <ReportKpi
          label="Packhouse Reject"
          value={`${packhouseRejectPct.toFixed(2)}%`}
          secondary={`${formatNumber(totalPackhouseRejectKg)} kg`}
        />

      </section>


      {/* =====================================
          NO DATA
      ===================================== */}

      {harvests.length === 0 ? (

        <div className="report-empty">

          <h2>No harvest data</h2>

          <p>
            There are no harvest records for
            this reporting period.
          </p>

        </div>

      ) : (

        /* =====================================
           REPORT
        ===================================== */

        <WeeklyReport
          data={harvests}
        />

      )}

    </main>
  );
}


/* =========================================
   KPI
========================================= */

function ReportKpi({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="report-kpi">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      {secondary && (
        <small>
          {secondary}
        </small>
      )}

    </div>
  );
}


/* =========================================
   WEEK PICKER
========================================= */

function WeekPicker({
  pickedDate,
}: {
  pickedDate: string;
}) {
  return (
    <form
      method="GET"
      action="/reports"
      className="week-picker"
    >

      <div className="report-date-field">

        <label htmlFor="report-date">
          Select Date
        </label>

        <input
          id="report-date"
          type="date"
          name="date"
          defaultValue={pickedDate}
        />

      </div>

      <button
        type="submit"
        className="btn btn-primary"
      >
        Load Week
      </button>

    </form>
  );
}
