import { useState } from "react";

interface ImportPanelProps {
  importCsv: (productsText: string, reviewsText: string) => void;
}

const IMPORT_BUTTON_TEXT = "Import and replace current research";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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

export function ImportPanel({ importCsv }: ImportPanelProps) {
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [reviewsFile, setReviewsFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const canImport = productsFile !== null && reviewsFile !== null && fileError === null;

  function selectFile(file: File | undefined, setFile: (value: File | null) => void) {
    setFileError(null);
    if (!file) {
      setFile(null);
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setFile(null);
      setFileError(`"${file.name}" is not a .csv file. Only .csv is supported.`);
      return;
    }
    setFile(file);
  }

  async function onImport() {
    if (!canImport || !productsFile || !reviewsFile) return;
    setFileError(null);
    try {
      const [productsText, reviewsText] = await Promise.all([
        readFileAsText(productsFile),
        readFileAsText(reviewsFile),
      ]);
      importCsv(productsText, reviewsText);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setFileError(`Failed to read files: ${message}`);
    }
  }

  return (
    <section className="import-panel" aria-labelledby="import-heading">
      <div className="section-heading">
        <span className="section-kicker">Bring your evidence</span>
        <h2 id="import-heading">Import CSV research data</h2>
        <p>Select both files to validate and replace the current local research.</p>
      </div>
      <div className="import-fields">
        <label className="import-field">
          <span className="import-field__label">Products CSV</span>
          <input id="products-csv-input" type="file" accept=".csv,text/csv" aria-label="Products CSV" onChange={(event) => selectFile(event.target.files?.[0], setProductsFile)} />
          <span className="import-field__name" data-testid="products-file-name">{productsFile ? productsFile.name : "No file selected"}</span>
        </label>
        <label className="import-field">
          <span className="import-field__label">Reviews CSV</span>
          <input id="reviews-csv-input" type="file" accept=".csv,text/csv" aria-label="Reviews CSV" onChange={(event) => selectFile(event.target.files?.[0], setReviewsFile)} />
          <span className="import-field__name" data-testid="reviews-file-name">{reviewsFile ? reviewsFile.name : "No file selected"}</span>
        </label>
      </div>
      {fileError ? <div className="status-banner status-banner--error" role="alert" data-testid="import-file-error"><span className="status-banner__label">Blocking error:</span> <span className="status-banner__text">{fileError}</span></div> : null}
      <div className="import-actions">
        <button type="button" onClick={onImport} disabled={!canImport} data-testid="import-button">{IMPORT_BUTTON_TEXT}</button>
        <p className="import-note">{canImport ? "Both files are ready. Import to validate and replace the current research." : "Choose both CSV files to enable import."}</p>
      </div>
      <div className="import-samples">
        <span>Sample files (synthetic, not Amazon template data):</span>
        <a href="/demo/products.csv" download>products.csv</a>
        <a href="/demo/reviews.csv" download>reviews.csv</a>
      </div>
    </section>
  );
}
