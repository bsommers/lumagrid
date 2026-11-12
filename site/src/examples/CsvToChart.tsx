import React, { useMemo, useState } from 'react';
import { groupBy } from 'lumagrid';
import type { ThemeDefinition } from 'lumagrid';
import { DataTable, HorizontalBarChart } from 'lumagrid/viz';
import { parseCsv } from '../lib/csv';
import { Panel, Surface } from './common';

export const SAMPLE_CSV = `region,product,revenue
North,Widgets,4200
North,Gadgets,3100
South,Widgets,5200
South,Gadgets,4400
East,Widgets,2600
West,Gadgets,3900
West,Widgets,3300`;

const H = 260;

export function CsvToChart({ theme }: { theme: ThemeDefinition }): React.ReactElement {
  const [text, setText] = useState(SAMPLE_CSV);
  const result = useMemo(() => {
    const parsed = parseCsv(text);
    if (!parsed.ok) return parsed;
    const label = parsed.data.fields.find((f) => f.type === 'string');
    const value = parsed.data.fields.find((f) => f.type === 'number');
    if (!label || !value) {
      return { ok: false as const, error: 'Need one text column to group by and one numeric column to add up.' };
    }
    try {
      const grouped = groupBy(label.key, value.key).transform(parsed.data);
      return { ok: true as const, data: parsed.data, grouped, label: label.key, value: value.key };
    } catch {
      return { ok: false as const, error: 'Those values could not be grouped. Check the columns and try again.' };
    }
  }, [text]);

  return (
    <Panel
      id="ex-csv"
      title="CSV to chart"
      lead="Edit the CSV. The first text column is grouped and the first numeric column is summed with the groupBy transform."
    >
      <div className="lg-ex-field lg-ex-field-col">
        <label htmlFor="ex-csv-input">CSV data</label>
        <textarea
          id="ex-csv-input"
          className="lg-ex-textarea"
          rows={9}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={!result.ok}
          aria-describedby="ex-csv-status"
        />
      </div>
      <p
        id="ex-csv-status"
        className={result.ok ? 'lg-ex-live' : 'lg-ex-live lg-ex-error'}
        role="status"
        aria-live="polite"
      >
        {result.ok
          ? `Parsed ${result.data.rows.length} rows into ${result.grouped.rows.length} groups of ${result.label} by ${result.value}.`
          : result.error}
      </p>
      {result.ok && (
        <div className="lg-ex-dash-grid">
          <div className="lg-ex-widget">
            <h4 className="lg-ex-widget-title">{`${result.value} by ${result.label}`}</h4>
            <Surface theme={theme} height={H} label="csv-bar">
              {(w) => (
                <HorizontalBarChart
                  data={result.grouped}
                  width={w}
                  height={H}
                  theme={theme}
                  labelField={result.label}
                  valueField={result.value}
                />
              )}
            </Surface>
          </div>
          <div className="lg-ex-widget">
            <h4 className="lg-ex-widget-title">Parsed rows</h4>
            <Surface theme={theme} height={H} label="csv-table">
              {(w) => <DataTable data={result.data} width={w} height={H} theme={theme} />}
            </Surface>
          </div>
        </div>
      )}
    </Panel>
  );
}
