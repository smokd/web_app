"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type Harvest = {
  id: number;
  date: string;
  variety: string;
  harvestedKg: number;
  fieldRejectsKg?: number | null;
  fieldRejectPct?: number | null;

  fieldRejects?: Array<{
    rejectType: string;
    rejectKg?: number | null;
    rejectPct?: number | null;
  }> | null;

  packhouseLoad?: Array<{
    id: number;
    processedKg: number;
    variety: string;
    rejects?: Array<{
      rejectType: string;
      rejectKg?: number | null;
      rejectPct?: number | null;
    }> | null;
  }> | null;
};

type Props = {
  data: Harvest[];
  weekStart: string;
  weekEnd: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
  },

  header: {
    marginBottom: 18,
    borderBottom: "2px solid #166534",
    paddingBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
  },

  subtitle: {
    marginTop: 5,
    color: "#555",
    fontSize: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 18,
    color: "#166534",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  kpi: {
    width: "31%",
    border: "1px solid #ddd",
    borderRadius: 5,
    padding: 8,
  },

  kpiLabel: {
    fontSize: 8,
    color: "#666",
  },

  kpiValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "bold",
  },

  table: {
    width: "100%",
    border: "1px solid #ddd",
  },

  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
    minHeight: 20,
    alignItems: "center",
  },

  tableHeader: {
    backgroundColor: "#f0fdf4",
    fontWeight: "bold",
  },

  cell: {
    padding: 4,
  },

  variety: {
    width: "20%",
  },

  number: {
    width: "16%",
    textAlign: "right",
  },

  smallNumber: {
    width: "12%",
    textAlign: "right",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#777",
    fontSize: 7,
  },
});

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function num(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function getLoads(harvest: Harvest) {
  return Array.isArray(harvest.packhouseLoad) ? harvest.packhouseLoad : [];
}

function getFieldRejectKg(harvest: Harvest): number {
  if (harvest.fieldRejectsKg != null) {
    return num(harvest.fieldRejectsKg);
  }

  const rejects = Array.isArray(harvest.fieldRejects)
    ? harvest.fieldRejects
    : [];

  return rejects.reduce((sum, reject) => {
    if (reject.rejectKg != null) {
      return sum + num(reject.rejectKg);
    }

    return sum + (num(harvest.harvestedKg) * num(reject.rejectPct)) / 100;
  }, 0);
}

function getProcessedKg(harvest: Harvest): number {
  return getLoads(harvest).reduce(
    (sum, load) => sum + num(load.processedKg),
    0,
  );
}

function getPackhouseRejectKg(harvest: Harvest): number {
  return getLoads(harvest).reduce((loadSum, load) => {
    const rejects = Array.isArray(load.rejects) ? load.rejects : [];

    return (
      loadSum + rejects.reduce((sum, reject) => sum + num(reject.rejectKg), 0)
    );
  }, 0);
}

export default function WeeklyReportPDF({ data, weekStart, weekEnd }: Props) {
  const totalHarvested = data.reduce((sum, h) => sum + num(h.harvestedKg), 0);

  const totalFieldRejects = data.reduce(
    (sum, h) => sum + getFieldRejectKg(h),
    0,
  );

  const totalProcessed = data.reduce((sum, h) => sum + getProcessedKg(h), 0);

  const totalPackhouseRejects = data.reduce(
    (sum, h) => sum + getPackhouseRejectKg(h),
    0,
  );

  const fieldRejectPct =
    totalHarvested > 0 ? (totalFieldRejects / totalHarvested) * 100 : 0;

  const packhouseRejectPct =
    totalProcessed > 0 ? (totalPackhouseRejects / totalProcessed) * 100 : 0;

  const varietyMap = new Map<
    string,
    {
      harvested: number;
      fieldRejects: number;
      processed: number;
      packhouseRejects: number;
    }
  >();

  data.forEach((h) => {
    const current = varietyMap.get(h.variety) || {
      harvested: 0,
      fieldRejects: 0,
      processed: 0,
      packhouseRejects: 0,
    };

    /* current.harvested += Number(h.harvestedKg || 0);

    current.fieldRejects += Number(
      h.fieldRejectsKg ||
        h.fieldRejects.reduce(
          (s, r) =>
            s + (Number(h.harvestedKg || 0) * Number(r.rejectPct || 0)) / 100,
          0,
        ),
    );

    current.processed += Number(h.packhouseLoad?.processedKg || 0); */

    current.harvested += num(h.harvestedKg);

    current.fieldRejects += getFieldRejectKg(h);

    current.processed += getProcessedKg(h);

    current.packhouseRejects += getPackhouseRejectKg(h);

    current.packhouseRejects +=
      h.packhouseLoad?.reduce(
        (loadSum, load) =>
          loadSum +
          (Array.isArray(load.rejects)
            ? load.rejects.reduce(
                (rejectSum, reject) => rejectSum + Number(reject.rejectKg || 0),
                0,
              )
            : 0),
        0,
      ) || 0;

    varietyMap.set(h.variety, current);
  });

  const varieties = Array.from(varietyMap.entries());

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Polaris QA — Weekly Harvest Quality Report
          </Text>

          <Text style={styles.subtitle}>
            Reporting period: {weekStart} – {weekEnd}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Weekly Overview</Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Total Harvested</Text>
            <Text style={styles.kpiValue}>
              {round(totalHarvested).toLocaleString()} kg
            </Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Field Rejects</Text>
            <Text style={styles.kpiValue}>
              {round(totalFieldRejects).toLocaleString()} kg
            </Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Field Reject Rate</Text>
            <Text style={styles.kpiValue}>{fieldRejectPct.toFixed(2)}%</Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Packhouse Processed</Text>
            <Text style={styles.kpiValue}>
              {round(totalProcessed).toLocaleString()} kg
            </Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Packhouse Rejects</Text>
            <Text style={styles.kpiValue}>
              {round(totalPackhouseRejects).toLocaleString()} kg
            </Text>
          </View>

          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Packhouse Reject Rate</Text>
            <Text style={styles.kpiValue}>
              {packhouseRejectPct.toFixed(2)}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Performance by Variety</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.variety]}>Variety</Text>

            <Text style={[styles.cell, styles.number]}>Harvested kg</Text>

            <Text style={[styles.cell, styles.number]}>Field Reject kg</Text>

            <Text style={[styles.cell, styles.smallNumber]}>Field %</Text>

            <Text style={[styles.cell, styles.number]}>Processed kg</Text>

            <Text style={[styles.cell, styles.number]}>Pack Reject kg</Text>

            <Text style={[styles.cell, styles.smallNumber]}>Pack %</Text>
          </View>

          {varieties.map(([variety, values]) => {
            const fieldPct =
              values.harvested > 0
                ? (values.fieldRejects / values.harvested) * 100
                : 0;

            const packPct =
              values.processed > 0
                ? (values.packhouseRejects / values.processed) * 100
                : 0;

            return (
              <View key={variety} style={styles.tableRow}>
                <Text style={[styles.cell, styles.variety]}>{variety}</Text>

                <Text style={[styles.cell, styles.number]}>
                  {round(values.harvested).toLocaleString()}
                </Text>

                <Text style={[styles.cell, styles.number]}>
                  {round(values.fieldRejects).toLocaleString()}
                </Text>

                <Text style={[styles.cell, styles.smallNumber]}>
                  {fieldPct.toFixed(2)}%
                </Text>

                <Text style={[styles.cell, styles.number]}>
                  {round(values.processed).toLocaleString()}
                </Text>

                <Text style={[styles.cell, styles.number]}>
                  {round(values.packhouseRejects).toLocaleString()}
                </Text>

                <Text style={[styles.cell, styles.smallNumber]}>
                  {packPct.toFixed(2)}%
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Daily Harvest Summary</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.variety]}>Date</Text>

            <Text style={[styles.cell, styles.number]}>Harvested kg</Text>

            <Text style={[styles.cell, styles.number]}>Field Reject kg</Text>

            <Text style={[styles.cell, styles.number]}>Processed kg</Text>

            <Text style={[styles.cell, styles.number]}>Pack Reject kg</Text>
          </View>

          {Array.from(new Set(data.map((h) => h.date)))
            .sort()
            .map((date) => {
              const rows = data.filter((h) => h.date === date);

              const harvested = rows.reduce(
                (s, h) => s + Number(h.harvestedKg || 0),
                0,
              );

              const fieldRejects = rows.reduce(
                (sum, h) => sum + getFieldRejectKg(h),
                0,
              );

              const processed = rows.reduce(
                (sum, h) => sum + getProcessedKg(h),
                0,
              );

              const rejects = rows.reduce(
                (sum, h) => sum + getPackhouseRejectKg(h),
                0,
              );

              return (
                <View key={date} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.variety]}>{date}</Text>

                  <Text style={[styles.cell, styles.number]}>
                    {round(harvested).toLocaleString()}
                  </Text>

                  <Text style={[styles.cell, styles.number]}>
                    {round(fieldRejects).toLocaleString()}
                  </Text>

                  <Text style={[styles.cell, styles.number]}>
                    {round(processed).toLocaleString()}
                  </Text>

                  <Text style={[styles.cell, styles.number]}>
                    {round(rejects).toLocaleString()}
                  </Text>
                </View>
              );
            })}
        </View>

        <Text style={styles.footer}>
          Polaris QA • Generated from harvest quality data
        </Text>
      </Page>
    </Document>
  );
}
