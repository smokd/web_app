import prisma from "@/lib/prisma";

import {
  HarvestTrendChart,
  FieldRejectTrendChart,
  PackhouseRejectTrendChart,
  TopRejectReasonsChart,
  HarvestByVarietyChart,
} from "@/components/charts";

export default async function Home() {
  /*
   * ==========================================
   * HARVEST DATA
   * ==========================================
   */

  const harvests = await prisma.harvest.findMany({
    orderBy: {
      date: "asc",
    },

    select: {
      date: true,
      harvestedKg: true,
      fieldRejectPct: true,
      variety: true,
      fieldRejectsKg: true,
    },
  });

  const OUTLIER_HARVEST_KG = 30_000; //to remove bulk harvest data, outlier

  const filteredHarvests = harvests.filter(
    (h) => Number(h.harvestedKg || 0) < OUTLIER_HARVEST_KG,
  );

  const fieldRejects = await prisma.fieldReject.findMany({
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      variety: true,
      rejectType: true,
      rejectKg: true,
      rejectPct: true,
    },
  });

  /*
   * ==========================================
   * PACKHOUSE DATA
   * ==========================================
   */

  /* const packhouseRejects =
    await prisma.packhouseReject.findMany({
      orderBy: {
        date: 'asc',
      },

      select: {
        date: true,
        rejectPct: true,
        rejectKg: true,
        rejectType: true,
        variety: true,
      },
    });
    */

  const packhouseLoads = await prisma.packhouseLoad.findMany({
    orderBy: {
      date: "asc",
    },

    select: {
      date: true,
      processedKg: true,
      variety: true,

      rejects: {
        select: {
          rejectType: true,
          rejectKg: true,
          rejectPct: true,
        },
      },
    },
  });

  /*
   * ==========================================
   * REJECT TYPES
   * ==========================================
   */

  const rejectTypes = await prisma.rejectType.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  /*
   * ==========================================
   * FORMAT HARVEST DATA
   * ==========================================
   */

  const harvestData = filteredHarvests.map((h) => {
    const fieldRejectKg = Number(h.fieldRejectsKg || 0);

    const processedKg =
      h.packhouseLoad?.reduce(
        (sum, load) => sum + Number(load.processedKg || 0),
        0,
      ) || 0;

    const packhouseRejectKg =
      h.packhouseLoad?.reduce(
        (sum, load) =>
          sum +
          (load.rejects?.reduce(
            (rejectSum, reject) => rejectSum + Number(reject.rejectKg || 0),
            0,
          ) || 0),
        0,
      ) || 0;

    const totalRejectKg = fieldRejectKg + packhouseRejectKg;

    const exportedKg = Math.max(0, processedKg - packhouseRejectKg);

    return {
      ...h,
      processedKg,
      fieldRejectKg,
      packhouseRejectKg,
      totalRejectKg,
      exportedKg,
      variety: {
        name: h.variety,
      },
    };
  });
  const packhouseData = packhouseLoads.flatMap((load) =>
    load.rejects.map((reject) => ({
      date: load.date,
      variety: {
        name: load.variety,
      },
      rejectType: {
        name: reject.rejectType,
      },
      rejectKg: Number(reject.rejectKg || 0),
      rejectPct: Number(reject.rejectPct || 0),
      processedKg: Number(load.processedKg || 0),
    })),
  );

  /*
   * ==========================================
   * KPI CALCULATIONS
   * ==========================================
   */

  const totalHarvestKg = filteredHarvests.reduce(
    (sum, h) => sum + Number(h.harvestedKg || 0),
    0,
  );

  const totalFieldRejectKg = filteredHarvests.reduce(
    (sum, h) => sum + Number(h.fieldRejectsKg || 0),
    0,
  );

  const fieldRejectPct =
    totalHarvestKg > 0 ? (totalFieldRejectKg / totalHarvestKg) * 100 : 0;

  const totalPackhouseProcessedKg = packhouseLoads.reduce(
    (sum, load) => sum + Number(load.processedKg || 0),
    0,
  );

  const totalPackhouseRejectKg = packhouseLoads.reduce(
    (sum, load) =>
      sum +
      (Array.isArray(load.rejects)
        ? load.rejects.reduce(
            (rejectSum, reject) => rejectSum + Number(reject.rejectKg || 0),
            0,
          )
        : 0),
    0,
  );

  const totalPackhouseGoodKg = Math.max(
    0,
    totalPackhouseProcessedKg - totalPackhouseRejectKg,
  );

  const packhouseRejectPct =
    totalPackhouseProcessedKg > 0
      ? (totalPackhouseRejectKg / totalPackhouseProcessedKg) * 100
      : 0;

  const totalLossKg = totalFieldRejectKg + totalPackhouseRejectKg;

  const goodOutputPct =
    totalPackhouseProcessedKg > 0
      ? (totalPackhouseGoodKg / totalPackhouseProcessedKg) * 100
      : 0;
  /*
   * ==========================================
   * REJECT REASONS DATA
   * ==========================================
   */

  const groupedRejects = Object.values(
    fieldRejects.reduce(
      (acc, item) => {
        if (!acc[item.rejectType]) {
          acc[item.rejectType] = {
            rejectType: item.rejectType,
            rejectKg: 0,
          };
        }

        acc[item.rejectType].rejectKg += Number(item.rejectKg || 0);

        return acc;
      },
      {} as Record<
        string,
        {
          rejectType: string;
          rejectKg: number;
        }
      >,
    ),
  );

  const rejectReasonData = groupedRejects.map((item) => ({
    name: item.rejectType,
    kg: Number(item.rejectKg || 0),
  }));

  const alerts: string[] = [];

  if (fieldRejectPct >= 5) {
    alerts.push(`Field reject rate is ${fieldRejectPct.toFixed(2)}%`);
  }

  if (packhouseRejectPct >= 5) {
    alerts.push(`Packhouse reject rate is ${packhouseRejectPct.toFixed(2)}%`);
  }

  if (totalPackhouseProcessedKg === 0 && totalHarvestKg > 0) {
    alerts.push(
      "Harvest has been recorded but no packhouse processing has been recorded.",
    );
  }

  return (
    <main className="dashboard">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="dashboard-header">
        <div>
          <h1>Blueberry QA Dashboard</h1>

          <p>Harvest, field quality and packhouse performance</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/harvest" className="dashboard-action">
          New Harvest
        </a>

        <a href="/packhouse" className="dashboard-action">
          Packhouse
        </a>

        <a href="/reports" className="dashboard-action">
          Reports
        </a>

        <a href="/verification" className="dashboard-action">
          Verification
        </a>
      </div>

      {/* ======================================
          KPI CARDS
      ====================================== */}

      <section className="dashboard-kpis">
        <div className="dashboard-kpi">
          <span>Total Harvest</span>

          <strong>{totalHarvestKg.toLocaleString()} kg</strong>

          <small>Total harvested</small>
        </div>

        <div className="dashboard-kpi">
          <span>Processed</span>

          <strong>{totalPackhouseProcessedKg.toLocaleString()} kg</strong>

          <small>Packhouse processed</small>
        </div>

        <div className="dashboard-kpi">
          <span>Exportable Product</span>

          <strong>
            {totalPackhouseGoodKg.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            kg
          </strong>

          <small>{goodOutputPct.toFixed(2)}% of harvest.</small>
        </div>

        <div className="dashboard-kpi">
          <span>Field Rejects</span>

          <strong>{totalFieldRejectKg.toLocaleString()} kg</strong>

          <small>{fieldRejectPct.toFixed(2)}% of harvest</small>
        </div>

        <div className="dashboard-kpi">
          <span>Packhouse Rejects</span>

          <strong>{totalPackhouseRejectKg.toLocaleString()} kg</strong>

          <small>{packhouseRejectPct.toFixed(2)}% of processed product</small>
        </div>

        <div className="dashboard-kpi">
          <span>Total Rejects</span>

          <strong>
            {totalLossKg.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            kg
          </strong>

          <small>
            {totalHarvestKg > 0
              ? ((totalLossKg / totalHarvestKg) * 100).toFixed(2)
              : "0.00"}
            % of harvest
          </small>
        </div>
      </section>

      {/* ======================================
          OPERATIONAL ALERTS
      ====================================== */}

      {alerts.length > 0 && (
        <section className="dashboard-card dashboard-alerts">
          <div className="dashboard-card-header">
            <div>
              <h2>Operational Alerts</h2>
              <p>Items requiring attention</p>
            </div>
          </div>

          <div className="dashboard-alert-list">
            {alerts.map((alert, index) => (
              <div key={index} className="dashboard-alert">
                ⚠ {alert}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================
          HARVEST TREND
      ====================================== */}

      <section className="dashboard-card dashboard-wide">
        <div className="dashboard-card-header">
          <div>
            <h2>Harvest Trend</h2>

            <p>Daily blueberry harvest volume</p>
          </div>
        </div>

        <div className="dashboard-chart large">
          <HarvestTrendChart
            data={harvestData}
            packhouseData={packhouseLoads}
          />
        </div>
      </section>

      {/* ======================================
          TWO COLUMN ANALYSIS
      ====================================== */}

      <section className="dashboard-grid">
        {/* FIELD REJECT */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Field Reject Trend</h2>

              <p>Reject percentage over time</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <FieldRejectTrendChart data={harvestData} />
          </div>
        </div>

        {/* VARIETY */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Harvest by Variety</h2>

              <p>Production volume by variety</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <HarvestByVarietyChart data={harvestData} />
          </div>
        </div>
      </section>

      {/* ======================================
          QUALITY ANALYSIS
      ====================================== */}

      <section className="dashboard-grid">
        {/* TOP FIELD REJECTS */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Top Reject Reasons</h2>

              <p>Main field quality issues</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <TopRejectReasonsChart data={rejectReasonData} />
          </div>
        </div>

        {/* PACKHOUSE */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>Packhouse Reject Trend</h2>

              <p>Packhouse quality performance</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <PackhouseRejectTrendChart
              data={packhouseData}
              rejectTypes={rejectTypes}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
