# Manual Category Check

## Scope and source

- Approved application commit checked: `9acd48bdf36d6a3d5681b0aa6c74fe45e85523cf`
- Source: `public/demo/products.csv`
- Records: 12 synthetic Demo products
- Boundary: this calculation checks the current comparison sample only. It does not validate a wider market, sales, demand, profitability, or a recommended price.

## Sorted observed prices

| Order | Product ID | Price (USD) |
| ---: | --- | ---: |
| 1 | `p09` | 24.99 |
| 2 | `p05` | 27.99 |
| 3 | `p01` | 29.99 |
| 4 | `p11` | 30.99 |
| 5 | `p04` | 32.99 |
| 6 | `p02` | 34.99 |
| 7 | `p07` | 36.99 |
| 8 | `p10` | 37.99 |
| 9 | `p12` | 38.99 |
| 10 | `p03` | 39.99 |
| 11 | `p08` | 41.99 |
| 12 | `p06` | 44.99 |

## Manual quartile calculation

The approved rule takes the median of the lower six prices for Q1, the median of all 12 prices, and the median of the upper six prices for Q3.

- Q1: `(29.99 + 30.99) / 2 = 30.49`
- Median: `(34.99 + 36.99) / 2 = 35.99`
- Q3: `(38.99 + 39.99) / 2 = 39.49`
- Observed range: `24.99 to 44.99`

## Manual price-band membership

| Band | Count | Product IDs |
| --- | ---: | --- |
| Up to 30.49 | 3 | `p09`, `p05`, `p01` |
| >30.49 to 35.99 | 3 | `p11`, `p04`, `p02` |
| >35.99 to 39.49 | 3 | `p07`, `p10`, `p12` |
| >39.49 | 3 | `p03`, `p08`, `p06` |

The four counts sum to 12, and every included product ID appears exactly once.

## Browser comparison

At `1440 x 900` on the local Category Overview, the observed median was `$35.99`, the observed price range was `$24.99 – $44.99`, the visible scale was `0 to 12 products in this sample`, and the four displayed price bands each contained `3 / 12 products`. Expanded Calculation evidence displayed cut points `30.49`, `35.99`, and `39.49` and the same contributing product IDs listed above.

The responsive browser check also confirmed the following CSS layout results without changing CSS:

- At `900 x 900`, `matchMedia("(max-width: 900px)").matches` was `true`, `.category-metrics` computed to `379px 379px`, and metric-card left coordinates were `65, 456, 65, 456`, proving two columns across two rows. `.category-distribution-grid` computed to `770px`, and both distribution panels had left coordinate `65`, proving one-column stacking. `scrollWidth` and `clientWidth` were both `900`.
- At `901 x 900`, the media query did not match; `.category-metrics` computed to four columns and `.category-distribution-grid` to two columns, as intended.
- At `390 x 844`, the shell, Home analysis, Category metrics, and Category distributions each computed to one column; file inputs measured `40px` high; `scrollWidth` and `clientWidth` were both `390`.

Keyboard acceptance confirmed available navigation links, `Open Category overview`, both file inputs, and the enabled import button could receive focus. The disabled import button was not reached by normal Tab navigation. On Category, the native Calculation evidence summary received focus; Enter changed the disclosure from closed to open, and Space changed it back to closed. Focus indication was visible on the focused import button.

Result: the manual calculation matched the application output for the synthetic Demo fixture at the recorded starting commit. The earlier 900px layout report was corrected: it had inspected only the number of rendered metric and distribution elements rather than CSS computed grid tracks and element coordinates. That measurement method mistook four metric elements for four columns and two distribution elements for two columns; the corrected CSS/coordinate measurement verifies two metric columns and one distribution column at 900px. This is an acceptance-record correction, not a CSS fix.

## Limitations

- The Demo fixture is synthetic and is not a current marketplace scrape.
- The check validates deterministic calculation and traceability for this fixture only.
- Review counts remain review counts and are not sales.
- The result does not establish wider-market coverage, commercial attractiveness, profitability, or purchase advice.
