/**
 * Start of the research flow. Shows the loaded Demo dataset overview,
 * source truth, and loading/error states. No upload or analysis yet.
 */
import { useResearch } from "../research/ResearchContext";

const DEMO_DISCLAIMER =
  "Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.";

export function HomePage() {
  const { status, dataset, issues, error, loadDemo } = useResearch();

  return (
    <section className="page">
      <h1>Research project</h1>

      {status === "idle" && <p>Waiting to load the demo research data…</p>}

      {status === "loading" && <p aria-live="polite">Loading demo research data…</p>}

      {status === "error" && (
        <div className="home-error" data-testid="home-error">
          <p>Demo data could not be loaded.</p>
          {error ? <p>{error}</p> : null}
          {issues.length > 0 ? (
            <ul>
              {issues.slice(0, 5).map((issue, index) => (
                <li key={index}>
                  Row {issue.row} · {issue.field}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" onClick={loadDemo}>
            Retry loading demo data
          </button>
        </div>
      )}

      {status === "ready" && dataset && (
        <div className="home-overview" data-testid="home-overview">
          <dl className="home-facts">
            <div>
              <dt>Products</dt>
              <dd>{dataset.products.length}</dd>
            </div>
            <div>
              <dt>Reviews</dt>
              <dd>{dataset.reviews.length}</dd>
            </div>
            <div>
              <dt>Source kind</dt>
              <dd>{dataset.sourceKind}</dd>
            </div>
            <div>
              <dt>Imported</dt>
              <dd>{new Date(dataset.importedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{dataset.category}</dd>
            </div>
          </dl>
          <p className="home-disclaimer">{DEMO_DISCLAIMER}</p>
        </div>
      )}
    </section>
  );
}