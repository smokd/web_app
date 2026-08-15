'use client';

import {
  LineChart, Line, BarChart, Bar, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer as RechartsResponsiveContainer,
} from 'recharts';
import { Card, Grid } from '@/components/ui';

// Dark theme color variables - matching our app's dark color scheme
const CHART_PRIMARY = '#3b82f6';   // Blue - primary chart accent
const CHART_SECONDARY = '#10b981';  // Green - secondary accent
const CHART_TEXT = '#f8fafc';         // Bright text for readability
const CHART_MUTED = '#94a3b8';        // Muted text for axes
const CHART_BG = '#1e293b';            // Card background
const CHART_GRID = '#1e3a5f';         // Grid lines
const CHART_BORDER = '#4a5568';       // Border lines

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
export function HarvestTrendChart({ data }) {
  const chartData = (data || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      kg: d.harvestedKg ?? 0,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={v => [`${v.toLocaleString()} kg`, 'Harvested']}
              contentStyle={{ background: CHART_BG, border: `1px solid ${CHART_BORDER}`, borderRadius: 8, color: CHART_TEXT }}
            />
            <Line type="monotone" dataKey="kg" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 4, fill: CHART_TEXT }} />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 1b. Harvest Trend Chart - Weekly aggregation (already exists in dashboard)
export function HarvestTrendChartB({ data }) {
  // Aggregate harvest data by Sunday-Saturday week
  const weeklyData = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];

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
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        kg: week.harvestedKg,
      };
    });

 return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--green-secondary)"
            />

            <XAxis
              dataKey="date"
              stroke="var(--muted)"
            />

            <YAxis
              stroke="var(--muted)"
              tickFormatter={(value) =>
                `${Number(value).toLocaleString()}`
              }
              label={{
                value: 'Harvest (kg)',
                angle: -90,
                position: 'insideLeft',
                style: {
                  textAnchor: 'middle',
                  fill: 'var(--muted)',
                },
              }}
            />

            <Tooltip
              formatter={(value) =>
                `${Number(value).toLocaleString()} kg`
              }
              labelFormatter={(label) => `Week: ${label}`}
              cursor={{ fill: 'var(--green-secondary)', opacity: 0.15 }}
            />

            <Bar
              dataKey="kg"
              fill={CHART_PRIMARY}
              radius={[4, 4, 0, 0]}   // rounded top corners
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
    const weekKey = weekStart.toISOString().split('T')[0];

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
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        kg: week.harvestedKg,
      };
    });

 return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={v => [`${v.toLocaleString()} kg`, 'Harvested']}
              contentStyle={{ background: CHART_BG, border: `1px solid ${CHART_BORDER}`, borderRadius: 8, color: CHART_TEXT }}
            />
            <Line type="monotone" dataKey="kg" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 4, fill: CHART_TEXT }} />
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
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        totalPct: 0,
        count: 0,
      };
    }

    const pct = Number(item.fieldRejectPct) ?? 0;
    acc[weekKey].totalPct += pct;
    acc[weekKey].count++;

    return acc;
  }, {});

  const chartData = Object.values(weeklyData)
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((week) => {
      const avgPct = week.count > 0 ? (week.totalPct / week.count) : 0;
      const weekStart = new Date(week.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

      return {
        date: `${formatDate(weekStart)}–${formatDate(weekEnd)}`,
        pct: avgPct,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <div style={{ height: 300, background: CHART_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No field reject data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART_MUTED} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip formatter={v => [`${v.toFixed(2)}%`, 'Field Reject']} contentStyle={{
              background: CHART_BG,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 8,
              color: CHART_TEXT,
            }} />
            <Line type="monotone" dataKey="pct" stroke={CHART_SECONDARY} strokeWidth={2} />
          </LineChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 3. Packhouse Reject % Trend Chart - Weekly aggregation (MODIFIED)
export function PackhouseRejectTrendChart({
  data,
  rejectTypes,
}) {
  const weeklyData = data.reduce(
    (acc, item) => {
      const date = new Date(item.date);

      const weekStart =
        getWeekStart(date);

      const weekKey =
        weekStart
          .toISOString()
          .split('T')[0];

      if (!acc[weekKey]) {
        acc[weekKey] = {
          weekStart,
          processedKg: 0,
          rejectKg: 0,
        };
      }

      acc[weekKey].processedKg +=
        Number(
          item.processedKg || 0
        );

      acc[weekKey].rejectKg +=
        Number(
          item.rejectKg || 0
        );

      return acc;
    },
    {}
  );

  const chartData = Object.values(
    weeklyData
  )
    .sort(
      (a, b) =>
        a.weekStart.getTime() -
        b.weekStart.getTime()
    )
    .map((week) => {
      const rejectPct =
        week.processedKg > 0
          ? (week.rejectKg /
              week.processedKg) *
            100
          : 0;

      const weekStart =
        new Date(
          week.weekStart
        );

      const weekEnd =
        new Date(weekStart);

      weekEnd.setDate(
        weekStart.getDate() + 6
      );

      const formatDate = (
        date: Date
      ) =>
        date.toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
          }
        );

      return {
        date: `${formatDate(
          weekStart
        )}–${formatDate(weekEnd)}`,

        pct: rejectPct,

        processedKg:
          week.processedKg,

        rejectKg:
          week.rejectKg,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <div
          style={{
            height: 300,
            background: CHART_BG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          border:
            `1px solid ${CHART_BORDER}`,
        }}
      >
        <RechartsResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke={CHART_GRID}
              strokeDasharray="3 3"
            />

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
              tickFormatter={(value) =>
                `${value}%`
              }
            />

            <Tooltip
              formatter={(
                value,
                name
              ) => {
                if (
                  name === 'Reject Rate'
                ) {
                  return [
                    `${Number(
                      value
                    ).toFixed(2)}%`,
                    'Reject Rate',
                  ];
                }

                return [
                  `${Number(
                    value
                  ).toLocaleString()} kg`,
                  name,
                ];
              }}
              contentStyle={{
                background: CHART_BG,
                border:
                  `1px solid ${CHART_BORDER}`,
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
export function TopRejectReasonsChart({ data,}: {data:RejectReasonData[];}) {
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
        <div style={{ height: 300, background: CHART_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No reject data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="kg" stroke={CHART_MUTED} fontSize={10} />
            <YAxis dataKey="name" width={100} stroke={CHART_MUTED} fontSize={10} />
            <Tooltip formatter={v => [`${v.toLocaleString()} kg`, 'Weight']} contentStyle={{
              background: CHART_BG,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 8,
              color: CHART_TEXT,
            }} />
            <Bar dataKey="kg" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 5. Harvest by Variety Chart - Vertical Bar
export function HarvestByVarietyChart({ data }) {
  const agg = (data || []).reduce((acc, d) => {
    const name = d.variety?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (d.harvestedKg ?? 0);
    return acc;
  }, {});

  const chartData = Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, kg]) => ({ name, kg }));

  if (chartData.length === 0) {
    return (
      <Card>
        <div style={{ height: 300, background: CHART_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No harvest data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="kg" stroke={CHART_MUTED} fontSize={10} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <YAxis dataKey="name" width={100} stroke={CHART_MUTED} fontSize={10} />
            <Tooltip formatter={v => [`${v.toLocaleString()} kg`, 'Harvested']} contentStyle={{
              background: CHART_BG,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 8,
              color: CHART_TEXT,
            }} />
            <Bar dataKey="kg" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}

// 6. Reject Rate by Variety Chart
export function RejectRateByVarietyChart({ data }) {
  const harvestKg = (data || []).reduce((acc, d) => {
    const name = d.variety?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (d.harvestedKg ?? 0);
    return acc;
  }, {});

  const rejectKg = (data || []).reduce((acc, d) => {
    const name = d.variety?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + (d.rejectKg ?? 0);
    return acc;
  }, {});

  const chartData = Object.keys(harvestKg).map(name => ({
    variety: name,
    pct: (harvestKg[name] ?? 0) > 0 ? ((rejectKg[name] ?? 0) / (harvestKg[name] ?? 0)) * 100 : 0,
  })).sort((a, b) => b.pct - a.pct);

  if (chartData.length === 0) {
    return (
      <Card>
        <div style={{ height: 300, background: CHART_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No reject rate data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ height: 300, background: CHART_BG, borderRadius: 12, border: `1px solid ${CHART_BORDER}` }}>
        <RechartsResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="variety" stroke={CHART_MUTED} fontSize={10} />
            <YAxis stroke={CHART_MUTED} fontSize={10} />
            <Tooltip formatter={v => [`${v.toFixed(2)}%`, 'Reject Rate']} contentStyle={{
              background: CHART_BG,
              border: `1px solid ${CHART_BORDER}`,
              borderRadius: 8,
              color: CHART_TEXT,
            }} />
            <Bar dataKey="pct" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
          </BarChart>
        </RechartsResponsiveContainer>
      </div>
    </Card>
  );
}
