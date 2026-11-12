import React, { useMemo, useState } from 'react';
import { groupBy } from 'lumagrid';
import type { ThemeDefinition, TransformedData } from 'lumagrid';
import { DataTable, HorizontalBarChart, LineChart, PieChart } from 'lumagrid/viz';
import { Panel, Surface, salesFields, salesRows } from './common';

const REGIONS = ['All', 'North', 'South', 'East', 'West'];
const H = 240;

function money(n: number): string {
  return `$${n.toFixed(1)}k`;
}

export function Dashboard({ theme }: { theme: ThemeDefinition }): React.ReactElement {
  const [region, setRegion] = useState('All');
  const view = useMemo(() => {
    const rows = region === 'All' ? salesRows : salesRows.filter((r) => r['region'] === region);
    const detail: TransformedData = { rows, fields: salesFields };
    const byRegion = groupBy('region', 'revenue').transform(detail);
    const revenue = rows.reduce((s, r) => s + Number(r['revenue']), 0);
    const units = rows.reduce((s, r) => s + Number(r['units']), 0);
    const top = [...byRegion.rows].sort((a, b) => Number(b['revenue']) - Number(a['revenue']))[0];
    return { detail, byRegion, revenue, units, top: String(top?.['region'] ?? 'n/a'), count: rows.length };
  }, [region]);

  const kpis = [
    { label: 'Revenue', value: money(view.revenue) },
    { label: 'Units', value: view.units.toLocaleString() },
    { label: 'Avg per row', value: money(view.revenue / Math.max(view.count, 1)) },
    { label: 'Top region', value: view.top },
  ];

  return (
    <Panel
      id="ex-dash"
      title="Sales dashboard"
      lead="KPI tiles, a trend line, a bar, a pie and a table, all fed by one dataset. The region filter updates every widget."
    >
      <div className="lg-ex-field">
        <label htmlFor="ex-dash-region">Region</label>
        <select id="ex-dash-region" value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <p className="lg-ex-live" role="status" aria-live="polite">
        {`Showing ${region === 'All' ? 'all regions' : region}: revenue ${money(view.revenue)}, ${view.units.toLocaleString()} units.`}
      </p>
      <ul className="lg-ex-kpis" aria-label="Key figures">
        {kpis.map((k) => (
          <li key={k.label} className="lg-ex-kpi" style={{ background: theme.surface.surface, color: theme.text.primary, borderColor: theme.surface.border }}>
            <span className="lg-ex-kpi-label" style={{ color: theme.text.secondary }}>{k.label}</span>
            <strong className="lg-ex-kpi-value">{k.value}</strong>
          </li>
        ))}
      </ul>
      <div className="lg-ex-dash-grid">
        <div className="lg-ex-widget">
          <h4 className="lg-ex-widget-title">Revenue trend</h4>
          <Surface theme={theme} height={H} label="dash-line">
            {(w) => <LineChart data={view.detail} width={w} height={H} theme={theme} labelField="month" valueField="revenue" colorField="region" />}
          </Surface>
        </div>
        <div className="lg-ex-widget">
          <h4 className="lg-ex-widget-title">Revenue by region</h4>
          <Surface theme={theme} height={H} label="dash-bar">
            {(w) => <HorizontalBarChart data={view.byRegion} width={w} height={H} theme={theme} labelField="region" valueField="revenue" />}
          </Surface>
        </div>
        <div className="lg-ex-widget">
          <h4 className="lg-ex-widget-title">Share of revenue</h4>
          <Surface theme={theme} height={H} label="dash-pie">
            {(w) => <PieChart data={view.byRegion} width={w} height={H} theme={theme} labelField="region" valueField="revenue" />}
          </Surface>
        </div>
        <div className="lg-ex-widget">
          <h4 className="lg-ex-widget-title">Detail</h4>
          <Surface theme={theme} height={H} label="dash-table">
            {(w) => <DataTable data={view.detail} width={w} height={H} theme={theme} />}
          </Surface>
        </div>
      </div>
    </Panel>
  );
}
