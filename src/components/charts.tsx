"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer as RechartsResponsiveContainer,
  ResponsiveContainer,
} from "recharts";
import { Card, Grid } from "@/components/ui";

// Dark theme color variables - matching our app's dark color scheme
const CHART_PRIMARY = "#3b82f6"; // Blue - primary chart accent
const CHART_SECONDARY = "#10b981"; // Green - secondary accent
const CHART_TEXT = "#f8fafc"; // Bright text for readability
const CHART_MUTED = "#94a3b8"; // Muted text for axes
const CHART_BG = "#1e293b"; // Card background
const CHART_GRID = "#1e3a5f"; // Grid lines
const CHART_BORDER = "#4a5568"; // Border lines

// Utility function to get Sunday of the week containing the given date
const getWeekStart = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay(); // Sunday = 0
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
};

type RejectReasonData = {
  name: string;
  kg: number;
};

// 1. Harvest Trend Chart - Line chart (original daily)
/* export function HarvestTrendChart({ data }) {
  const chartData = (data || [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      kg: d.harvestedKg ?? 0,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: CHART_BG,
            color: CHART_TEXT,
          }}
        >
          No harvest data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v.toLocaleString()} kg`, "Harvested"]}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke={CHART_PRIMARY}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_TEXT }}
            />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
} */
export function HarvestTrendChart({
  data,
  packhouseData,
}: {
  data: any[];
  packhouseData: any[];
}) {
  const chartData = Object.values(
    data.reduce(
      (acc, item) => {
        const harvestedKg = Number(item.harvestedKg || 0);

        // Exclude the bulk/outlier harvest record.
        // Adjust this threshold to match your actual bulk record.
        /* if (harvestedKg >= 10000) {
          return acc;
        } */

        const date =
          item.date instanceof Date
            ? item.date.toISOString().slice(0, 10)
            : String(item.date).slice(0, 10);

        if (!acc[date]) {
          acc[date] = {
            date,
            harvestedKg: 0,
            processedKg: 0,
            exportableKg: 0,
            totalRejectKg: 0,
          };
        }

        acc[date].harvestedKg += harvestedKg;

        acc[date].totalRejectKg += Number(item.totalRejectKg || 0);

        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          harvestedKg: number;
          processedKg: number;
          exportableKg: number;
        }
      >,
    ),
  );

  /*
   * PACKHOUSE PRODUCTION
   *
   * Exportable =
   * processed - packhouse rejects
   */

  packhouseData.forEach((load) => {
    const date =
      load.date instanceof Date
        ? load.date.toISOString().slice(0, 10)
        : String(load.date).slice(0, 10);

    if (!chartData.find((item: any) => item.date === date)) {
      chartData.push({
        date,
        harvestedKg: 0,
        processedKg: 0,
        exportableKg: 0,
        totalRejectKg: 0,
      });
    }

    const row = chartData.find((item: any) => item.date === date);

    if (!row) return;

    const processedKg = Number(load.processedKg || 0);

    const rejectedKg = Array.isArray(load.rejects)
      ? load.rejects.reduce(
          (sum: number, reject: any) => sum + Number(reject.rejectKg || 0),
          0,
        )
      : 0;

    row.processedKg += processedKg;

    row.exportableKg += Math.max(0, processedKg - rejectedKg);
  });

  chartData.sort(
    (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const formattedData = chartData.map((item: any) => ({
    ...item,

    label: new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    }),
  }));

  if (formattedData.length === 0) {
    return (
      <div className="dashboard-chart-empty">No production data available.</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={formattedData}
        margin={{
          top: 10,
          right: 20,
          left: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

        <XAxis dataKey="label" tick={{ fontSize: 12 }} />

        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${Number(value).toLocaleString()}`}
        />

        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString()} kg`,
            name,
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />

        <Legend />

        <Line
          type="monotone"
          dataKey="harvestedKg"
          name="Harvested"
          stroke="#0ac5b2"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
        />

        {
          <Line
            type="monotone"
            dataKey="exportableKg"
            name="Exportable Product"
            stroke="#2c7ec4"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        }

        <Line
          type="monotone"
          dataKey="totalRejectKg"
          name="Total Rejects Kg"
          stroke="#ef4444"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
// 1b. Harvest Trend Chart - Weekly aggregation (already exists in dashboard)
export function HarvestTrendChartB({ data }) {
  // Aggregate harvest data by Sunday-Saturday week
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        harvestedKg: 0,
      };
    }

    acc[weekKey].harvestedKg += Number(item.harvestedKg) || 0;

    return acc;
  }, {});

  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((week) => {
      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        kg: week.harvestedKg,
      };
    });

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--green-secondary)"
            />

            <XAxis dataKey="date" stroke="var(--muted)" />

            <YAxis
              stroke="var(--muted)"
              tickFormatter={(value) => `${Number(value).toLocaleString()}`}
              label={{
                value: "Harvest (kg)",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "var(--muted)",
                },
              }}
            />

            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()} kg`}
              labelFormatter={(label) => `Week: ${label}`}
              cursor={{ fill: "var(--green-secondary)", opacity: 0.15 }}
            />

            <Bar
              dataKey="kg"
              fill={CHART_PRIMARY}
              radius={[4, 4, 0, 0]} // rounded top corners
              stroke={CHART_PRIMARY}
              strokeWidth={1}
            />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 1c. Harvest Trend Chart - Weekly aggregation (already exists in dashboard)
export function HarvestTrendChartC({ data }) {
  // Aggregate harvest data by Sunday-Saturday week
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        harvestedKg: 0,
      };
    }

    acc[weekKey].harvestedKg += Number(item.harvestedKg) || 0;

    return acc;
  }, {});

  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((week) => {
      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        kg: week.harvestedKg,
      };
    });

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v.toLocaleString()} kg`, "Harvested"]}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke={CHART_PRIMARY}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_TEXT }}
            />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 2. Field Reject % Trend Chart - Weekly aggregation (MODIFIED)
export function FieldRejectTrendChart({ data }) {
  // Aggregate field reject data by Sunday-Saturday week
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        harvestedKg: 0,
        fieldRejectsKg: 0,
      };
    }

    acc[weekKey].harvestedKg += Number(item.harvestedKg) || 0;

    acc[weekKey].fieldRejectsKg += Number(item.fieldRejectsKg) || 0;

    return acc;
  }, {});

  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((week) => {
      const weightedPct =
        week.harvestedKg > 0
          ? (week.fieldRejectsKg / week.harvestedKg) * 100
          : 0;

      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        pct: weightedPct,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No field reject data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v.toFixed(2)}%`, "Field Reject"]}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />
            <Line
              type="monotone"
              dataKey="pct"
              stroke={CHART_SECONDARY}
              strokeWidth={2}
            />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 3. Packhouse Reject % Trend Chart - Weekly aggregation (MODIFIED)
export function PackhouseRejectTrendChart({ data, rejectTypes }) {
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);

    const weekStart = getWeekStart(date);

    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        processedKg: 0,
        rejectKg: 0,
      };
    }

    acc[weekKey].processedKg += Number(item.processedKg || 0);

    acc[weekKey].rejectKg += Number(item.rejectKg || 0);

    return acc;
  }, {});

  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((week) => {
      const rejectPct =
        week.processedKg > 0 ? (week.rejectKg / week.processedKg) * 100 : 0;

      const weekStart = new Date(week.weekStart);

      const weekEnd = new Date(weekStart);

      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,

        pct: rejectPct,

        processedKg: week.processedKg,

        rejectKg: week.rejectKg,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: CHART_MUTED,
          }}
        >
          No packhouse data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              formatter={(value, name) => {
                if (name === "Reject Rate") {
                  return [`${Number(value).toFixed(2)}%`, "Reject Rate"];
                }

                return [`${Number(value).toLocaleString()} kg`, name];
              }}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />

            <Line
              type="monotone"
              dataKey="pct"
              name="Reject Rate"
              stroke={CHART_SECONDARY}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 4. Top Reject Reasons Chart - Horizontal Bar
export function TopRejectReasonsChart({ data }: { data: RejectReasonData[] }) {
  /*const agg = (data || []).reduce((acc, d) => {
    const name = d.rejectType?.name || 'Other';
    acc[name] = (acc[name] || 0) + (d.rejectKg ?? 0);
    return acc;
  }, {});
  */

  /*const chartData = Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, kg]) => ({ name, kg }));
    */

  const chartData = (data ?? [])
    .filter((item) => item.kg > 0)
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No reject data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.15}
              horizontal={false}
            />

            <XAxis type="number" />

            <YAxis type="category" dataKey="name" width={110} />

            <Tooltip />

            <Bar
              dataKey="kg"
              name="Rejects"
              fill="#ef4444"
              radius={[0, 5, 5, 0]}
              barSize={24}
            />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 5. Harvest by Variety Chart - Vertical Bar
export function HarvestByVarietyChart({ data }) {
  const grouped = (data || []).reduce((acc, item) => {
    const variety = item?.variety?.name || item?.variety || "Unknown";

    if (!acc[variety]) {
      acc[variety] = 0;
    }

    acc[variety] += Number(item.harvestedKg || 0);

    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([name, kg]) => ({
      name,
      kg: Number(kg),
    }))
    .sort((a, b) => b.kg - a.kg);

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: CHART_MUTED,
          }}
        >
          No harvest data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke={CHART_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => Number(value).toLocaleString()}
            />

            <Tooltip
              formatter={(value) => [
                `${Number(value).toLocaleString()} kg`,
                "Harvested",
              ]}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />

            <Bar dataKey="kg" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 6. Reject Rate by Variety Chart
export function RejectRateByVarietyChart({ data }) {
  const harvestKg = (data || []).reduce((acc, d) => {
    const name = d.variety?.name || "Unknown";
    acc[name] = (acc[name] || 0) + (d.harvestedKg ?? 0);
    return acc;
  }, {});

  const rejectKg = (data || []).reduce((acc, d) => {
    const name = d.variety?.name || "Unknown";
    acc[name] = (acc[name] || 0) + (d.rejectKg ?? 0);
    return acc;
  }, {});

  const chartData = Object.keys(harvestKg)
    .map((name) => ({
      variety: name,
      pct:
        (harvestKg[name] ?? 0) > 0
          ? ((rejectKg[name] ?? 0) / (harvestKg[name] ?? 0)) * 100
          : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No reject rate data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          height: 300,
          background: CHART_BG,
          borderRadius: 12,
          border: `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
          >
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="variety" stroke={CHART_MUTED} fontSize={10} />
            <YAxis stroke={CHART_MUTED} fontSize={10} />
            <Tooltip
              formatter={(v) => [`${v.toFixed(2)}%`, "Reject Rate"]}
              contentStyle={{
                background: CHART_BG,
                border: `1px solid ${CHART_BORDER}`,
                borderRadius: 8,
                color: CHART_TEXT,
              }}
            />
            <Bar dataKey="pct" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}
