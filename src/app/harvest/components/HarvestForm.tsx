'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createHarvestRecord } from '../actions';
import FieldRejectSection from './FieldRejectSection';
import PackhouseSection from './PackhouseSection';
import WeatherInput, { WeatherData } from './WeatherInput';

type Variety = {
  id: number;
  name: string;
};

type WeatherOpt = {
  id: number;
  name: string;
};

type RejectRow = {
  rejectType: string;
  rejectKg: number;
};

export default function HarvestForm({
  varieties,
  weatherOptions,
  date,
}: {
  varieties: Variety[];
  weatherOptions: WeatherOpt[];
  date: string;
}) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const [variety, setVariety] = useState('');
  const [harvestedKg, setHarvestedKg] = useState('');
  const [blocks, setBlocks] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [notes, setNotes] = useState('');

  const [fieldRejects, setFieldRejects] = useState<RejectRow[]>([]);

  const [processedKg, setProcessedKg] = useState(0);

  const [packhouseRejects, setPackhouseRejects] = useState<RejectRow[]>([]);

  const [weather, setWeather] = useState<WeatherData>({
    condition: '',
    temp: 0,
    lat: null,
    lon: null,
    source: 'manual',
  });

  /* =========================================
     CALCULATIONS
  ========================================= */

  const harvestedNum = Number(harvestedKg) || 0;

  const totalFieldRejectKg = fieldRejects.reduce(
    (sum, row) => sum + (Number(row.rejectKg) || 0),
    0
  );

  const totalFieldRejectPct =
    harvestedNum > 0
      ? (totalFieldRejectKg / harvestedNum) * 100
      : 0;

  const processedPct =
    harvestedNum > 0
      ? (processedKg / harvestedNum) * 100
      : 0;

  /* =========================================
     DATE
  ========================================= */

  function handleDateChange(newDate: string) {
    if (!newDate) return;

    router.push(`/harvest?date=${newDate}`);
  }

  /* =========================================
     SUBMIT
  ========================================= */

  async function handleSubmit(formData: FormData) {
    setMessage('');

    const harvested = Number(harvestedKg) || 0;

    if (harvested <= 0) {
      setMessage('Please enter a valid harvested quantity.');
      return;
    }

    if (totalFieldRejectKg > harvested) {
      setMessage(
        'Field rejects cannot exceed the harvested quantity.'
      );
      return;
    }

    if (processedKg > harvested) {
      setMessage(
        'Processed quantity cannot exceed harvested quantity.'
      );
      return;
    }

    /*
     * Convert field reject KG to percentage
     * before sending to the server.
     */
    const fieldRejectsPct = fieldRejects.map((row) => ({
      rejectType: row.rejectType,
      rejectPct:
        harvested > 0
          ? Math.round(
              ((Number(row.rejectKg) || 0) / harvested) * 10000
            ) / 100
          : 0,
    }));

    formData.set(
      'fieldRejects',
      JSON.stringify(fieldRejectsPct)
    );

    formData.set(
      'packhouse',
      JSON.stringify({
        processedKg,
        rejects: packhouseRejects,
      })
    );

    formData.set('weather', weather.condition);
    formData.set(
      'weatherTemp',
      String(weather.temp ?? '')
    );
    formData.set(
      'weatherLat',
      String(weather.lat ?? '')
    );
    formData.set(
      'weatherLon',
      String(weather.lon ?? '')
    );
    formData.set(
      'weatherSource',
      weather.source
    );

    startTransition(async () => {
      try {
        await createHarvestRecord(formData);

        setMessage('Record saved successfully.');

        /* Reset form */

        setVariety('');
        setHarvestedKg('');
        setBlocks('');
        setSupervisor('');
        setNotes('');

        setFieldRejects([]);

        setProcessedKg(0);
        setPackhouseRejects([]);

        setWeather({
          condition: '',
          temp: 0,
          lat: null,
          lon: null,
          source: 'manual',
        });

        router.refresh();
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : 'Save failed.'
        );
      }
    });
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <form
      id="harvest-form"
      action={handleSubmit}
      className="harvest-form"
    >

      {/* =====================================
          HARVEST DETAILS
      ===================================== */}

      <section className="form-section">

        <div className="form-section-header">
          <div>
            <h3>Harvest Details</h3>

            <p>
              Enter the basic information for this
              harvest.
            </p>
          </div>
        </div>

        <div className="harvest-grid">

          {/* DATE */}

          <div className="form-field">

            <label htmlFor="date">
              Date
            </label>

            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              required
              onChange={(e) =>
                handleDateChange(e.target.value)
              }
              className="form-input"
            />

          </div>


          {/* VARIETY */}

          <div className="form-field">

            <label htmlFor="variety">
              Variety
            </label>

            <select
              id="variety"
              name="variety"
              value={variety}
              onChange={(e) =>
                setVariety(e.target.value)
              }
              required
              className="form-input"
            >
              <option value="" disabled>
                Select variety
              </option>

              {varieties.map((v) => (
                <option
                  key={v.id}
                  value={v.name}
                >
                  {v.name}
                </option>
              ))}
            </select>

          </div>


          {/* HARVESTED KG */}

          <div className="form-field">

            <label htmlFor="harvestedKg">
              Harvested Quantity
            </label>

            <div className="input-with-unit">

              <input
                id="harvestedKg"
                name="harvestedKg"
                type="number"
                min="0"
                step="0.01"
                required
                value={harvestedKg}
                onChange={(e) =>
                  setHarvestedKg(e.target.value)
                }
                className="form-input"
                placeholder="0.00"
              />

              <span>kg</span>

            </div>

          </div>


          {/* BLOCKS */}

          <div className="form-field">

            <label htmlFor="blocks">
              Blocks
            </label>

            <input
              id="blocks"
              name="blocks"
              type="text"
              placeholder="e.g. 14,15,27&29"
              value={blocks}
              onChange={(e) =>
                setBlocks(e.target.value)
              }
              className="form-input"
            />

          </div>


          {/* SUPERVISOR */}

          <div className="form-field">

            <label htmlFor="supervisor">
              Supervisor
            </label>

            <input
              id="supervisor"
              name="supervisor"
              type="text"
              value={supervisor}
              onChange={(e) =>
                setSupervisor(e.target.value)
              }
              className="form-input"
            />

          </div>

        </div>

      </section>


      {/* =====================================
          FIELD QUALITY SUMMARY
      ===================================== */}

      <section className="quality-summary">

        <div>
          <span>
            Field Rejects
          </span>

          <strong>
            {totalFieldRejectKg.toFixed(2)} kg
          </strong>
        </div>

        <div>
          <span>
            Field Reject Rate
          </span>

          <strong>
            {totalFieldRejectPct.toFixed(2)}%
          </strong>
        </div>

        <div>
          <span>
            Harvested
          </span>

          <strong>
            {harvestedNum.toFixed(2)} kg
          </strong>
        </div>

      </section>


      {/* =====================================
          FIELD REJECTS
      ===================================== */}

      <section className="form-section">

        <FieldRejectSection
          fieldRejects={fieldRejects}
          harvestedKg={harvestedNum}
          onChange={setFieldRejects}
        />

      </section>


      {/* =====================================
          PACKHOUSE
      ===================================== */}

      <section className="form-section">

        <div className="form-section-header">

          <div>
            <h3>Packhouse</h3>

            <p>
              Record processed quantity and
              packhouse rejects.
            </p>
          </div>

          <div className="calculated-value">

            <span>Processed</span>

            <strong>
              {processedKg.toFixed(2)} kg
            </strong>

          </div>

        </div>

        <PackhouseSection
          processedKg={processedKg}
          onProcessedKgChange={setProcessedKg}
          rejects={packhouseRejects}
          onRejectsChange={setPackhouseRejects}
        />

      </section>


      {/* =====================================
          WEATHER
      ===================================== */}

      <section className="form-section">

        <div className="form-section-header">

          <div>
            <h3>Weather Conditions</h3>

            <p>
              Record conditions during harvesting.
            </p>
          </div>

        </div>

        <WeatherInput
          value={weather}
          onChange={setWeather}
        />

      </section>


      {/* =====================================
          NOTES
      ===================================== */}

      <section className="form-section">

        <div className="form-field">

          <label htmlFor="notes">
            Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            className="form-input"
            placeholder="Additional observations..."
          />

        </div>

      </section>


      {/* =====================================
          MESSAGE
      ===================================== */}

      {message && (
        <div
          className={
            message.includes('success')
              ? 'form-message success'
              : 'form-message error'
          }
        >
          {message}
        </div>
      )}


      {/* =====================================
          SAVE
      ===================================== */}

      <div className="form-actions">

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary save-button"
        >
          {pending
            ? 'Saving Harvest...'
            : 'Save Harvest Record'}
        </button>

      </div>

    </form>
  );
}
