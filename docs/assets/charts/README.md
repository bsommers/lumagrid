# Chart images

[Back to the docs](../../USING.md) | [Guide](../../guide/)

Rendered images of the eleven native Lumagrid charts in both library themes. The files are generated, committed and used by the guide chart pages and the README image strip. Do not edit them by hand.

## Regenerate

```bash
npm run visuals          # build the site, capture all 22 PNG and 18 SVG, assert the site layout
npm run visuals:check    # validate the committed files (no browser needed)
```

`npm run visuals` is on demand only. `scripts/ci.sh` does not run it; the committed files are validated without a browser by `docs/__tests__/visuals.test.ts`.

Useful flags: `--only <chart>[:<theme>]` (for example `--only pie:dark`), `--no-build` (reuse `site/dist`), `--no-site-checks` (skip the landing page layout assertions).

## Browser

The script finds a browser in this order: the `LUMAGRID_CHROME` environment variable (path to a Chrome or Chromium binary), the Playwright-managed Chromium, then `/usr/bin/google-chrome`. It never downloads a browser. The browser version is printed in the run log and is not stored in any committed file.

## Files

Names are `<chart>-<theme>.png` and, for the SVG charts, `<chart>-<theme>.svg`. Themes are `light` and `dark`.

| Chart id | Component | Plugin id | Themes | PNG | SVG |
| --- | --- | --- | --- | --- | --- |
| `bar` | `HorizontalBarChart` | `bar` | light, dark | yes | yes |
| `line` | `LineChart` | `line` | light, dark | yes | yes |
| `pie` | `PieChart` | `pie` | light, dark | yes | yes |
| `force` | `ForceGraph` | `force-graph` | light, dark | yes | yes |
| `choropleth` | `Choropleth` | `choropleth` | light, dark | yes | yes |
| `table` | `DataTable` | `table` | light, dark | yes | no |
| `tree` | `TreeView` | `tree` | light, dark | yes | no |
| `scatter` | `ScatterChart` | `scatter` | light, dark | yes | yes |
| `area` | `AreaChart` | `area` | light, dark | yes | yes |
| `column` | `ColumnChart` | `column` | light, dark | yes | yes |
| `heatmap` | `Heatmap` | `heatmap` | light, dark | yes | yes |

`DataTable` and `TreeView` are HTML, not SVG, so they are PNG only. They are deliberately not wrapped in a `foreignObject`, which renders unreliably outside browsers and would add active-content surface to a committed SVG.

## Notes

- Fonts: the PNGs use Inter, loaded through an `@font-face` alias in the capture page. An SVG opened on its own as an image falls back to Helvetica or Arial because the font is not embedded.
- Each SVG carries a background rectangle in the theme's surface color, so it reads correctly on any page background, and is serialized with its `xmlns` attribute.
- Determinism: fixed viewport 800 x 520, device scale factor 2 (each PNG is 1280 x 800), reduced motion, animations disabled, the force graph seed is 1, fonts are awaited, and all non-local requests are aborted. Two consecutive runs produce byte-identical files.
