/**
 * Data quality check. This step will check required fields, types, ranges,
 * duplicates, and sample size before any analysis may run.
 * No quality rules or findings are implemented at this stage.
 */
export function QualityPage() {
  return (
    <section className="page">
      <h1>Data quality</h1>
      <p>This step checks whether the uploaded dataset is safe to analyze.</p>
    </section>
  );
}
