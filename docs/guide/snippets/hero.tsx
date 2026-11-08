// Source of the quickstart shown in the site hero. Compiled by `npm run typecheck:site`
// and rendered by site/src/__tests__/hero.test.tsx.

// #region hero
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin, type TransformedData } from 'lumagrid';
import { nativeBarPlugin } from 'lumagrid/viz';
registerPlugin(nativeBarPlugin);
const data: TransformedData = {
  rows: [{ region: 'North', revenue: 12000 }, { region: 'South', revenue: 14200 }],
  fields: [{ key: 'region', type: 'string' }, { key: 'revenue', type: 'number' }],
};
const views = [{ id: 'bar', config: { valueField: 'revenue', labelField: 'region' } }];
export const Example = () => (
  <ThemeProvider theme="dark">
    <WidgetContainer data={data} title="Revenue" width={480} height={300}>
      {(d, w, h) => <ViewSwitcher views={views} data={d} width={w} height={h} />}
    </WidgetContainer>
  </ThemeProvider>
);
// #endregion
