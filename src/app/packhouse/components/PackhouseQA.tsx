'use client';

type Reject = {
  rejectType: string;
  rejectKg: number;
  rejectPct?: number;
};

type PackhouseQAProps = {
  processedKg: number;
  rejects: Reject[];
};

export default function PackhouseQA({
  processedKg,
  rejects,
}: PackhouseQAProps) {
  const totalRejectKg = rejects.reduce(
    (sum, reject) =>
      sum + Number(reject.rejectKg || 0),
    0
  );

  const goodKg =
    processedKg - totalRejectKg;

  const rejectPct =
    processedKg > 0
      ? (totalRejectKg / processedKg) * 100
      : 0;

  let status:
    | 'good'
    | 'warning'
    | 'critical';

  let label: string;

  if (rejectPct < 5) {
    status = 'good';
    label = 'Good';
  } else if (rejectPct <= 10) {
    status = 'warning';
    label = 'Warning';
  } else {
    status = 'critical';
    label = 'Critical';
  }

  return (
    <div className="packhouse-qa">

      <div className="packhouse-qa-header">
        <div>
          <h3>Packhouse QA</h3>

          <p>
            Quality analysis for this
            processed load.
          </p>
        </div>

        <span
          className={`packhouse-qa-status packhouse-qa-status-${status}`}
        >
          {label}
        </span>
      </div>


      {/* SUMMARY */}

      <div className="packhouse-qa-summary">

        <div>
          <span>Processed</span>

          <strong>
            {processedKg.toFixed(2)} kg
          </strong>
        </div>

        <div>
          <span>Total Rejects</span>

          <strong>
            {totalRejectKg.toFixed(2)} kg
          </strong>
        </div>

        <div>
          <span>Good Product</span>

          <strong>
            {goodKg.toFixed(2)} kg
          </strong>
        </div>

        <div>
          <span>Reject Rate</span>

          <strong>
            {rejectPct.toFixed(2)}%
          </strong>
        </div>

      </div>


      {/* REJECT BREAKDOWN */}

      <div className="packhouse-qa-breakdown">

        <div className="packhouse-qa-breakdown-header">
          <h4>Reject Breakdown</h4>
        </div>

        {rejects.length === 0 ? (

          <div className="packhouse-qa-empty">
            No packhouse rejects recorded.
          </div>

        ) : (

          <div className="packhouse-qa-list">

            {rejects.map(
              (reject, index) => {

                const rejectKg =
                  Number(
                    reject.rejectKg || 0
                  );

                const pct =
                  processedKg > 0
                    ? (rejectKg /
                        processedKg) *
                      100
                    : 0;

                return (
                  <div
                    key={`${reject.rejectType}-${index}`}
                    className="packhouse-qa-row"
                  >

                    <div className="packhouse-qa-row-name">
                      {reject.rejectType}
                    </div>

                    <div className="packhouse-qa-row-value">
                      {rejectKg.toFixed(2)} kg
                    </div>

                    <div className="packhouse-qa-row-percent">
                      {pct.toFixed(2)}%
                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
}
