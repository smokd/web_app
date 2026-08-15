import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PackhouseQA from './components/PackhouseQA';

import PackhouseForm from './PackhouseForm';

export const dynamic = 'force-dynamic';



export default async function PackhousePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }


  function formatDate(value: unknown) {
  if (!value) {
    return '—';
  }

  const raw = String(value).trim();


  // Expected database format:
  // 2026-07-07 00:00:00

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (!match) {
    console.error(
      'UNRECOGNIZED DATE FORMAT:',
      raw
    );

    return raw;
  }

  const [, year, month, day] =
    match;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthIndex =
    Number(month) - 1;

  if (
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return raw;
  }

  return `${day} ${months[monthIndex]} ${year}`;
}


  const harvests =
    await prisma.harvest.findMany({
      orderBy: [
        {
          date: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      include: {
        fieldRejects: true,

        packhouseLoad: {
          include: {
            rejects: true,
          },
        },
      },
    });








  const awaitingPackhouse =
    harvests.filter(
      (harvest) =>
        !harvest.packhouseLoad
    );

  const processedHarvests =
    harvests.filter(
      (harvest) =>
        !!harvest.packhouseLoad
    );

  const totalAwaitingKg =
    awaitingPackhouse.reduce(
      (sum, harvest) =>
        sum +
        Number(
          harvest.harvestedKg || 0
        ),
      0
    );

  const totalProcessedKg =
    processedHarvests.reduce(
      (sum, harvest) =>
        sum +
        Number(
          harvest.packhouseLoad
            ?.processedKg || 0
        ),
      0
    );

  return (
    <main className="packhouse-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="packhouse-header">

        <div>
          <h1>Packhouse</h1>

          <p>
            Receive, process and record
            packhouse quality information.
          </p>
        </div>

        <div className="packhouse-date">

          <span>Today</span>

          <strong>
            {new Date().toLocaleDateString(
              'en-GB',
              {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }
            )}
          </strong>

        </div>

      </header>


      {/* =====================================
          KPI CARDS
      ===================================== */}

      <section className="dashboard-kpis">

        <div className="dashboard-kpi">

          <span>
            Awaiting Processing
          </span>

          <strong>
            {awaitingPackhouse.length}
          </strong>

          <small>
            Harvest records
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            Awaiting Quantity
          </span>

          <strong>
            {totalAwaitingKg.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}{' '}
            kg
          </strong>

          <small>
            To be processed
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            Processed Records
          </span>

          <strong>
            {processedHarvests.length}
          </strong>

          <small>
            Completed loads
          </small>

        </div>


        <div className="dashboard-kpi">

          <span>
            Processed Quantity
          </span>

          <strong>
            {totalProcessedKg.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            )}{' '}
            kg
          </strong>

          <small>
            Packhouse throughput
          </small>

        </div>

      </section>


      {/* =====================================
          AWAITING PROCESSING
      ===================================== */}

      <section className="packhouse-section">

        <div className="section-heading">

          <div>

            <h2>
              Awaiting Packhouse Processing
            </h2>

            <p>
              Harvest records requiring
              packhouse processing.
            </p>

          </div>

          <div className="record-count">
            {awaitingPackhouse.length}{' '}
            {awaitingPackhouse.length === 1
              ? 'record'
              : 'records'}
          </div>

        </div>


        {awaitingPackhouse.length === 0 ? (

          <div className="packhouse-empty">

            <strong>
              All caught up
            </strong>

            <p>
              There are no harvest records
              waiting for packhouse processing.
            </p>

          </div>

        ) : (

          <div className="packhouse-queue">

            {awaitingPackhouse.map(
              (harvest) => {

                const fieldRejectKg =
                  Number(
                    harvest.fieldRejectsKg ||
                      0
                  );

                const fieldRejectPct =
                  harvest.harvestedKg >
                  0
                    ? (fieldRejectKg /
                        harvest.harvestedKg) *
                      100
                    : 0;

                return (
                  <article
                    key={harvest.id}
                    className="packhouse-queue-card"
                  >

                    <div className="packhouse-queue-header">

                      <div>

                        <div className="packhouse-record-title">

                          Harvest #
                          {harvest.id}

                          <span className="status-badge status-awaiting">
                            Awaiting Processing
                          </span>

                        </div>

                        <p>
                          {harvest.variety}
                        </p>

                      </div>

                      <div className="packhouse-record-date">
                        {formatDate(harvest.date)}
                      </div>

                    </div>


                    <div className="packhouse-record-summary">

                      <div>
                        <span>
                          Harvested
                        </span>

                        <strong>
                          {Number(
                            harvest.harvestedKg
                          ).toFixed(2)}{' '}
                          kg
                        </strong>
                      </div>


                      <div>
                        <span>
                          Field Reject
                        </span>

                        <strong>
                          {fieldRejectKg.toFixed(
                            2
                          )}{' '}
                          kg
                        </strong>

                        <small>
                          {fieldRejectPct.toFixed(
                            2
                          )}
                          %
                        </small>
                      </div>


                      <div>
                        <span>
                          Supervisor
                        </span>

                        <strong>
                          {harvest.supervisor ||
                            '—'}
                        </strong>
                      </div>

                    </div>


                    <div className="packhouse-process-area">

                      <PackhouseForm
                        harvestId={
                          harvest.id
                        }
                        harvestedKg={
                          Number(
                            harvest.harvestedKg
                          )
                        }
                        variety={
                          harvest.variety
                        }
                      />

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>


      {/* =====================================
          RECENTLY PROCESSED
      ===================================== */}

      <section className="packhouse-section">

        <div className="section-heading">

          <div>

            <h2>
              Recently Processed
            </h2>

            <p>
              Packhouse processing records
              already completed.
            </p>

          </div>

          <div className="record-count">
            {processedHarvests.length}{' '}
            {processedHarvests.length === 1
              ? 'record'
              : 'records'}
          </div>

        </div>


        {processedHarvests.length === 0 ? (

          <div className="packhouse-empty">

            <strong>
              No processed records
            </strong>

            <p>
              Packhouse processing records
              will appear here.
            </p>

          </div>

        ) : (

          <div className="dashboard-card">

            <div className="packhouse-table-wrapper">

              <table className="packhouse-table">

                <thead>

                  <tr>

                    <th>
                      Harvest
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Variety
                    </th>

                    <th>
                      Harvested
                    </th>

                    <th>
                      Processed
                    </th>

                    <th>
                      Rejects
                    </th>

                    <th>
                      Reject %
                    </th>

                  </tr>

                </thead>

                <tbody>

  {processedHarvests.map(
    (harvest) => {

      const load =
        harvest.packhouseLoad!;

      const rejectKg =
        load.rejects.reduce(
          (
            sum,
            reject
          ) =>
            sum +
            Number(
              reject.rejectKg || 0
            ),
          0
        );

      const rejectPct =
        load.processedKg > 0
          ? (rejectKg /
              load.processedKg) *
            100
          : 0;

      return (
        <tr key={harvest.id}>

          <td>
            <strong>
              #{harvest.id}
            </strong>
          </td>

          <td>
            {formatDate(
              harvest.date
            )}
          </td>

          <td>
            {harvest.variety}
          </td>

          <td>
            {Number(
              harvest.harvestedKg
            ).toFixed(2)}{' '}
            kg
          </td>

          <td>
            {Number(
              load.processedKg
            ).toFixed(2)}{' '}
            kg
          </td>

          <td>
            {rejectKg.toFixed(2)} kg
          </td>

          <td>
            <span
              className={
                rejectPct < 5
                  ? 'quality-badge quality-good'
                  : rejectPct <= 10
                    ? 'quality-badge quality-warning'
                    : 'quality-badge quality-critical'
              }
            >
              {rejectPct.toFixed(2)}%
            </span>
          </td>

        </tr>
      );
    }
  )}

</tbody>

              </table>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}
