/**
 * Start of the research flow. Shows the current dataset overview, source
 * truth, and the CSV import UI (two file pickers + explicit confirm).
 * No analysis or statistics beyond the quality gate.
 */
import { useState } from "react";
import { useResearch } from "../research/ResearchContext";
import { StatusBanner } from "../components/StatusBanner";

const DEMO_DISCLAIMER =
  "Curated demo fixture. It does not represent live Amazon inventory, sales, or current market share.";

const UPLOAD_DISCLAIMER =
  "User-uploaded data does not represent sales, demand, or market share.";

const IMPORT_BUTTON_TEXT = "Import and replace current research";
const IMPORT_NOTE =
  "A successful import replaces the current local research with the selected files.";

interface SelectedFile {
  name: string;
}

export function HomePage() {
  const { status, dataset, sourceKind, importState, error, loadDemo, importCsv } =
    useResearch();
  const [productsFile, setProductsFile] = useState<SelectedFile | null>(null);
  const [reviewsFile, setReviewsFile] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const canImport = productsFile !== null && reviewsFile !== null && fileError === null;

  function onPickProducts(file: File | undefined) {
    setFileError(null);
    if (!file) {
      setProductsFile(null);
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setProductsFile(null);
      setFileError(`"${file.name}" is not a .csv file. Only .csv is supported.`);
      return;
    }
    setProductsFile({ name: file.name });
  }

  function onPickReviews(file: File | undefined) {
    setFileError(null);
    if (!file) {
      setReviewsFile(null);
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setReviewsFile(null);
      setFileError(`"${file.name}" is not a .csv file. Only .csv is supported.`);
      return;
    }
    setReviewsFile({ name: file.name });
  }

  function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Prefer the standard File.text(); fall back to FileReader for
    // environments/mocks where text() is unavailable.
    if (typeof file.text === "function") {
      file.text().then(resolve, reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsText(file);
  });
}

function onImport() {
    if (!canImport || !productsFile || !reviewsFile) return;
    // Re-read the current selection through the input elements to get text.
    const pInput = document.getElementById(
      "products-csv-input",
    ) as HTMLInputElement | null;
    const rInput = document.getElementById(
      "reviews-csv-input",
    ) as HTMLInputElement | null;
    const pFile = pInput?.files?.[0];
    const rFile = rInput?.files?.[0];
    if (!pFile || !rFile) return;
    setFileError(null);
    Promise.all([readFileAsText(pFile), readFileAsText(rFile)])
      .then(([productsText, reviewsText]) => {
        importCsv(productsText, reviewsText);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setFileError(`Failed to read files: ${message}`);
      });
  }

  return (
    <section className="page">
      <h1>Research project</h1>

      {status === "idle" && <p>Waiting to load the demo research data…</p>}

      {status === "loading" && <p aria-live="polite">Loading demo research data…</p>}

      {status === "error" && (
        <div className="home-error" data-testid="home-error">
          <p>Demo data could not be loaded.</p>
          {error ? <p>{error}</p> : null}
          <button type="button" onClick={loadDemo}>
            Retry loading demo data
          </button>
        </div>
      )}

      {status === "ready" && dataset && (
        <div className="home-overview" data-testid="home-overview">
          <dl className="home-facts">
            <div>
              <dt>Source</dt>
              <dd>{sourceKind === "demo" ? "Demo data" : sourceKind === "user_upload" ? "User upload" : "No active data"}</dd>
            </div>
            <div>
              <dt>Products</dt>
              <dd>{dataset.products.length}</dd>
            </div>
            <div>
              <dt>Reviews</dt>
              <dd>{dataset.reviews.length}</dd>
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
          <p className="home-disclaimer">
            {sourceKind === "demo" ? DEMO_DISCLAIMER : sourceKind === "user_upload" ? UPLOAD_DISCLAIMER : null}
          </p>
        </div>
      )}

      {/* ---- CSV import ---- */}
      <section className="import-panel" aria-labelledby="import-heading">
        <h2 id="import-heading">Import CSV research data</h2>

        <div className="import-fields">
          <label className="import-field">
            <span className="import-field__label">Products CSV</span>
            <input
              id="products-csv-input"
              type="file"
              accept=".csv,text/csv"
              aria-label="Products CSV"
              onChange={(e) => onPickProducts(e.target.files?.[0])}
            />
            <span className="import-field__name" data-testid="products-file-name">
              {productsFile ? productsFile.name : "No file selected"}
            </span>
          </label>

          <label className="import-field">
            <span className="import-field__label">Reviews CSV</span>
            <input
              id="reviews-csv-input"
              type="file"
              accept=".csv,text/csv"
              aria-label="Reviews CSV"
              onChange={(e) => onPickReviews(e.target.files?.[0])}
            />
            <span className="import-field__name" data-testid="reviews-file-name">
              {reviewsFile ? reviewsFile.name : "No file selected"}
            </span>
          </label>
        </div>

        {fileError && (
          <StatusBanner tone="error" text={fileError} data-testid="import-file-error" />
        )}

        <div className="import-actions">
          <button
            type="button"
            onClick={onImport}
            disabled={!canImport}
            data-testid="import-button"
          >
            {IMPORT_BUTTON_TEXT}
          </button>
          <p className="import-note">{IMPORT_NOTE}</p>
        </div>

        {importState.ok && (
          <StatusBanner tone="success" text="Import succeeded.">
            <ul>
              <li>Source: {sourceKind}</li>
              <li>Products: {dataset?.products.length}</li>
              <li>Reviews: {dataset?.reviews.length}</li>
              <li>Imported at: {new Date(importState.importedAt ?? "").toLocaleString()}</li>
            </ul>
          </StatusBanner>
        )}

        {!importState.ok && importState.error && (
          <StatusBanner tone="error" text={importState.error} data-testid="import-error">
            <ul>
              {importState.issues.map((issue, i) => (
                <li key={i}>
                  [{issue.file ?? "?"} row {issue.row}] {issue.field}: {issue.message} (value: {JSON.stringify(issue.value)})
                </li>
              ))}
            </ul>
          </StatusBanner>
        )}

        <div className="import-samples">
          <span>Sample files (synthetic, not Amazon template data):</span>
          <a href="/demo/products.csv" download>
            products.csv
          </a>
          <a href="/demo/reviews.csv" download>
            reviews.csv
          </a>
        </div>
      </section>
    </section>
  );
}