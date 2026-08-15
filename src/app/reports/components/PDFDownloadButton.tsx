'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import WeeklyReportPDF from './WeeklyReportPDF';

export default function PDFDownloadButton({
  data,
  weekStart,
  weekEnd,
}: {
  data: any[];
  weekStart: string;
  weekEnd: string;
}) {
  const [ready, setReady] = useState(false);

  return (
    <PDFDownloadLink
      document={
        <WeeklyReportPDF
          data={data}
          weekStart={weekStart}
          weekEnd={weekEnd}
        />
      }
      fileName={`polaris-qa-weekly-report-${weekStart}.pdf`}
      onClick={() => setReady(true)}
      style={{
        display: 'inline-block',
        padding: '0.6rem 1rem',
        borderRadius: 6,
        background: '#166534',
        color: '#fff',
        textDecoration: 'none',
        fontWeight: 600,
      }}
    >
      {({ loading }) =>
        loading || !ready
          ? 'Generate PDF'
          : 'Download PDF'
      }
    </PDFDownloadLink>
  );
}
