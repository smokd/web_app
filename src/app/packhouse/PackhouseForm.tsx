'use client';

import {
  useState,
  useTransition,
} from 'react';

import { createPackhouseLoad } from './actions';

type RejectRow = {
  rejectType: string;
  rejectKg: number;
};

const DEFECT_TYPES = [
  'Underripe',
  'Birds',
  'Soft',
  'Soft point',
  'Picking Scars',
  'Frost',
  'Fallen Berries',
  'Undersize',
  'Stem Retention',
];

export default function PackhouseForm({
  harvestId,
  harvestedKg,
  variety,
}: {
  harvestId: number;
  harvestedKg: number;
  variety: string;
}) {

  const [
    pending,
    startTransition,
  ] = useTransition();

  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const [
    processedKg,
    setProcessedKg,
  ] = useState('');

  const [
    rejects,
    setRejects,
  ] = useState<RejectRow[]>([]);

  const [
    notes,
    setNotes,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    saved,
    setSaved,
  ] = useState(false);


  /* =========================================
     CALCULATIONS
  ========================================= */

  const processed =
    Number(processedKg) || 0;

  const totalRejectKg =
    rejects.reduce(
      (sum, row) =>
        sum +
        (Number(row.rejectKg) || 0),
      0
    );

  const rejectPct =
    processed > 0
      ? (totalRejectKg /
          processed) *
        100
      : 0;

  const goodKg =
    processed - totalRejectKg;

  const processedPct =
    harvestedKg > 0
      ? (processed /
          harvestedKg) *
        100
      : 0;


  /* =========================================
     REJECT ROWS
  ========================================= */

  function addReject() {

    setRejects(
      (current) => [
        ...current,
        {
          rejectType: '',
          rejectKg: 0,
        },
      ]
    );
  }


  function updateReject(
    index: number,
    field: keyof RejectRow,
    value: string | number
  ) {

    setRejects(
      (current) =>
        current.map(
          (row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  [field]:
                    value,
                }
              : row
        )
    );
  }


  function removeReject(
    index: number
  ) {

    setRejects(
      (current) =>
        current.filter(
          (_, rowIndex) =>
            rowIndex !== index
        )
    );
  }


  /* =========================================
     SUBMIT
  ========================================= */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setMessage('');

    if (processed <= 0) {

      setMessage(
        'Please enter a valid processed quantity.'
      );

      return;
    }

    if (
      processed >
      harvestedKg
    ) {

      setMessage(
        'Processed quantity cannot exceed harvested quantity.'
      );

      return;
    }

    if (
      totalRejectKg >
      processed
    ) {

      setMessage(
        'Packhouse rejects cannot exceed processed quantity.'
      );

      return;
    }

    const invalid =
      rejects.find(
        (row) =>
          !row.rejectType.trim() ||
          Number(row.rejectKg) < 0
      );

    if (invalid) {

      setMessage(
        'Please complete all reject rows.'
      );

      return;
    }

    const formData =
      new FormData();

    formData.set(
      'harvestId',
      String(harvestId)
    );

    formData.set(
      'processedKg',
      String(processed)
    );

    formData.set(
      'rejects',
      JSON.stringify(rejects)
    );

    formData.set(
      'notes',
      notes
    );

    startTransition(
      async () => {

        try {

          await createPackhouseLoad(
            formData
          );

          setMessage(
            'Packhouse record saved successfully.'
          );

          setSaved(true);

        } catch (error) {

          setMessage(
            error instanceof Error
              ? error.message
              : 'Save failed.'
          );
        }
      }
    );
  }


  /* =========================================
     SAVED STATE
  ========================================= */

  if (saved) {

    return (
      <div className="packhouse-saved">

        <div>
          <strong>
            Packhouse Processing
            Recorded
          </strong>

          <p>
            {processed.toFixed(2)} kg
            processed with{' '}
            {totalRejectKg.toFixed(
              2
            )}{' '}
            kg rejected.
          </p>
        </div>

        <span className="status-badge status-complete">
          Completed
        </span>

      </div>
    );
  }


  /* =========================================
     COLLAPSED STATE
  ========================================= */

  if (!expanded) {

    return (
      <div className="packhouse-start">

        <div>

          <span>
            Packhouse processing
          </span>

          <strong>
            Not yet recorded
          </strong>

        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            setExpanded(true)
          }
        >
          Process Harvest
        </button>

      </div>
    );
  }


  /* =========================================
     FORM
  ========================================= */

  return (
    <form
      className="packhouse-form"
      onSubmit={handleSubmit}
    >

      {/* HEADER */}

      <div className="packhouse-form-header">

        <div>

          <h3>
            Packhouse Processing
          </h3>

          <p>
            {variety} · Harvest #
            {harvestId}
          </p>

        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setExpanded(false)
          }
        >
          Cancel
        </button>

      </div>


      {/* QUANTITY */}

      <div className="packhouse-form-grid">

        <div className="form-field">

          <label>
            Harvested Quantity
          </label>

          <div className="calculated-value">

            {harvestedKg.toFixed(2)} kg

          </div>

        </div>


        <div className="form-field">

          <label>
            Processed Quantity
          </label>

          <div className="input-with-unit">

            <input
              type="number"
              min="0"
              step="0.01"
              value={processedKg}
              onChange={(event) =>
                setProcessedKg(
                  event.target.value
                )
              }
              className="form-input"
              placeholder="0.00"
              required
            />

            <span>
              kg
            </span>

          </div>

        </div>


        <div className="form-field">

          <label>
            Processing %
          </label>

          <div className="calculated-value">

            {processedPct.toFixed(
              2
            )}
            %

          </div>

        </div>

      </div>


      {/* QUALITY SUMMARY */}

      <div className="quality-summary">

        <div>

          <span>
            Processed
          </span>

          <strong>
            {processed.toFixed(2)}
            {' '}kg
          </strong>

        </div>

        <div>

          <span>
            Rejects
          </span>

          <strong>
            {totalRejectKg.toFixed(
              2
            )}{' '}
            kg
          </strong>

        </div>

        <div>

          <span>
            Reject Rate
          </span>

          <strong>
            {rejectPct.toFixed(
              2
            )}
            %
          </strong>

        </div>

        <div>

          <span>
            Good Product
          </span>

          <strong>
            {goodKg.toFixed(
              2
            )}{' '}
            kg
          </strong>

        </div>

      </div>


      {/* REJECT BREAKDOWN */}

      <div className="form-section">

        <div className="form-section-header">

          <div>

            <h3>
              Packhouse Reject Analysis
            </h3>

            <p>
              Record rejected product
              by defect type.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addReject}
          >
            + Add Defect
          </button>

        </div>


        {rejects.length === 0 && (

          <p className="field-reject-empty">
            No packhouse defects
            recorded.
          </p>

        )}


        <div className="field-reject-rows">

          {rejects.map(
            (row, index) => {

              const autoPct =
                processed > 0
                  ? (row.rejectKg /
                      processed) *
                    100
                  : 0;

              return (
                <div
                  key={index}
                  className="field-reject-row"
                >

                  <div className="field-reject-type">

                    <label>
                      Defect Type
                    </label>

                    <select
                      value={
                        row.rejectType
                      }
                      onChange={(
                        event
                      ) =>
                        updateReject(
                          index,
                          'rejectType',
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        — Select —
                      </option>

                      {DEFECT_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        )
                      )}

                    </select>

                  </div>


                  <div className="field-reject-kg">

                    <label>
                      Rejected Kg
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        row.rejectKg ===
                        0
                          ? ''
                          : row.rejectKg
                      }
                      onChange={(
                        event
                      ) =>
                        updateReject(
                          index,
                          'rejectKg',
                          event.target
                            .value ===
                            ''
                            ? 0
                            : Number(
                                event
                                  .target
                                  .value
                              )
                        )
                      }
                      placeholder="0.00"
                    />

                  </div>


                  <div className="field-reject-percent">

                    <label>
                      Auto %
                    </label>

                    <div className="reject-percent">
                      {autoPct.toFixed(
                        2
                      )}
                      %
                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      removeReject(
                        index
                      )
                    }
                    className="remove-defect-btn"
                    aria-label="Remove defect"
                  >
                    ✕
                  </button>

                </div>
              );
            }
          )}

        </div>

      </div>


      {/* NOTES */}

      <div className="form-section">

        <div className="form-field">

          <label>
            Packhouse Notes
          </label>

          <textarea
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            className="form-input"
            placeholder="Additional packhouse observations..."
          />

        </div>

      </div>


      {/* MESSAGE */}

      {message && (

        <div
          className={
            message.includes(
              'successfully'
            )
              ? 'form-message success'
              : 'form-message error'
          }
        >
          {message}
        </div>

      )}


      {/* ACTION */}

      <div className="form-actions">

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary save-button"
        >
          {pending
            ? 'Saving Processing...'
            : 'Save Packhouse Processing'}
        </button>

      </div>

    </form>
  );
}
