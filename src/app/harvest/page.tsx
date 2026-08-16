import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import MonthlyHarvestVerification from "./components/MonthlyHarvestVerification";

import HarvestForm from "./components/HarvestForm";
import HarvestTable from "./components/HarvestTable";

export default async function HarvestPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const date = params?.date || new Date().toISOString().split("T")[0];

  const month = params?.month || date.slice(0, 7);

  const [varieties, weatherOptions, records, monthlyRecords] =
    await Promise.all([
      prisma.variety.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.weatherOption.findMany({
        orderBy: {
          name: "asc",
        },
      }),

      prisma.harvest.findMany({
        where: {
          date: {
            startsWith: date,
          },
        },

        orderBy: {
          id: "asc",
        },

        include: {
          fieldRejects: true,

          packhouseLoad: {
            include: {
              rejects: true,
            },
          },
        },
      }),

      prisma.harvest.findMany({
        where: {
          date: {
            startsWith: month,
          },
        },

        orderBy: [
          {
            date: "asc",
          },
          {
            id: "asc",
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
      }),
    ]);

  return (
    <main className="harvest-page">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="harvest-header">
        <div>
          <h1>Harvest Entry</h1>

          <p>Record blueberry harvest and quality information for the day.</p>
        </div>

        <div className="harvest-date">
          <span>Harvest Date</span>

          <strong>
            {new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>

      {/* =====================================
          HARVEST FORM
      ===================================== */}

      <section className="harvest-section">
        <div className="section-heading">
          <div>
            <h2>New Harvest Record</h2>

            <p>Enter today's production and quality information.</p>
          </div>
        </div>

        <div className="harvest-form-container">
          <HarvestForm
            varieties={varieties}
            weatherOptions={weatherOptions}
            date={date}
          />
        </div>
      </section>

      {/* =====================================
          TODAY'S RECORDS
      ===================================== */}

      <section className="harvest-section">
        <div className="section-heading">
          <div>
            <h2>Today's Harvest Records</h2>

            <p>
              Records entered for{" "}
              {new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="record-count">
            {records.length} {records.length === 1 ? "record" : "records"}
          </div>
        </div>

        <div className="harvest-table-container">
          <HarvestTable
            records={records}
            date={date}
            isAdmin={session.role === "ADMIN"}
            varieties={varieties}
            weatherOptions={weatherOptions}
          />
        </div>
      </section>

      {/* =====================================
    TEMPORARY MONTHLY VERIFICATION
===================================== */}

      <section className="harvest-section">
        <div className="section-heading"></div>
        <div className="harvest-table-container">
          <MonthlyHarvestVerification
            records={monthlyRecords}
            month={month}
            isAdmin={session.role === "ADMIN"}
            varieties={varieties}
            weatherOptions={weatherOptions}
          />
        </div>
      </section>
    </main>
  );
}
