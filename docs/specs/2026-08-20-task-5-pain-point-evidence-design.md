# Mercata Lens Product Task 5: Rule-Matched Pain-Point Evidence Design

- Date: 2026-08-20
- Approved base HEAD: `e77b7dfc684e31ed76f33a37d7658094e6ceed94`
- Product task: Task 5, Rule-Based Pain-Point Evidence and Human Corrections
- This document covers: the complete Task 5 product boundary and delivery sequence

## 1. Goal

Task 5 turns English review text in the active local dataset into inspectable, deterministic research signals. Every displayed label must be traceable to an exact source-text span and a versioned phrase rule, or to an explicit human correction with a required reason.

This is a review-triage aid. A phrase match is not proof that a pain point is prevalent in the wider market, that a reviewer represents a customer segment, or that an opportunity exists. The product must call the results **rule-matched pain-point evidence**, **review signals**, or similarly bounded language. It must not present them as confirmed customer needs, demand, market prevalence, purchase intent, or product advice.

## 2. Delivery sequence

Product Task 5 is split into three independently reviewed changes:

1. **Task 5A — deterministic classification and summary contracts**: versioned phrase rules, exact source-span matching, correction precedence, aggregation, traceability, and domain tests only;
2. **Task 5B — evidence-first page and session corrections**: Pain Points page, source evidence, current-session add/remove controls, required correction reasons, and integration tests;
3. **Task 5C — audit handoff and final acceptance**: blank 50-review audit template and deterministic sampling order, rule changelog, responsive/accessibility acceptance, accurate README, and a separately authored human-audit handoff.

Each subtask receives its own design, implementation plan, WorkBuddy task sheet, ordinary commit, and Codex review. Task 5B cannot start before Task 5A is `APPROVED`; Task 5C cannot start before Task 5B is `APPROVED`. Task 6 economics and every later product task remain out of scope throughout Task 5.

## 3. Approved evidence labels

Task 5 uses exactly these seven review-signal labels:

- `hard_to_clean` — cleaning difficulty;
- `noise` — unwanted noise;
- `leakage` — leaking water;
- `pump_lifetime` — pump failure or deterioration;
- `filter_cost` — replacement-filter cost burden;
- `capacity` — insufficient capacity or refill burden;
- `pet_acceptance` — a pet avoiding, rejecting, or fearing the fountain.

The catalog order above is stable in domain output and presentation. New labels, semantic models, stemming, fuzzy matching, sentiment scoring, or inferred synonyms require a later reviewed ruleset change; WorkBuddy may not add them opportunistically.

Labels represent complaint-oriented evidence. Positive statements such as `easy to clean`, `quiet`, `no leaks`, `low-cost filters`, `large capacity`, or `my cat loves it` must not be counted merely because they mention the same topic.

## 4. Data and provenance boundary

Task 5 analyzes only `ReviewRecord` objects already present in the active validated `ResearchDataset` and links them only to products in that dataset. It does not fetch reviews, infer missing review text, translate non-English text, contact an external service, or inspect a live marketplace.

For Demo data, the interface and documentation must state that the reviews are synthetic fixtures. For user uploads, the interface must state that results inherit the upload's unknown or user-controlled collection method and do not establish wider-market coverage.

`reviewCount` on a product remains a displayed review count. Task 5 uses actual imported review records as its classification denominator and must never substitute product `reviewCount`, or reinterpret either value as sales, customers, demand, velocity, popularity, or market share.

## 5. Deterministic rules and traceability

The ruleset is code-owned and versioned. Task 5A begins at `PAIN_POINT_RULESET_VERSION = "1.0.0"`. Matching is case-insensitive and normalizes punctuation and repeated whitespace through token boundaries while retaining original source offsets. It does not stem words, use fuzzy distance, infer semantic equivalence, or call AI.

Every automatic match must expose:

- review ID and product ID;
- pain-point ID and rule ID;
- ruleset version;
- configured include phrase;
- the exact substring from the original English review;
- start and end offsets into the original review text.

An exclusion phrase suppresses only an overlapping include match for the same rule. It is not a whole-review veto. This prevents `not noisy` from becoming a noise complaint without hiding a separate explicit complaint elsewhere in the same review.

Overlapping include matches for the same label resolve deterministically: retain the longest match; ties resolve by configured phrase order and then source position. A review counts at most once per label even when it contains multiple retained spans. The spans remain visible as evidence.

## 6. Human-correction boundary

A correction is keyed by `reviewId` and contains deduplicated `add` and `remove` label lists plus a non-blank reason. Corrections change the effective labels used by summaries but never erase the automatic-match record.

Precedence is deterministic:

1. calculate automatic matches;
2. apply valid manual additions;
3. apply valid manual removals last;
4. if the same label appears in both lists, removal wins.

A blank-reason correction is invalid and must not alter effective labels. The domain result exposes that it was ignored rather than silently accepting it.

Task 5B stores corrections only inside the current `ResearchProvider` memory session. They are not saved to localStorage, IndexedDB, a file, backend, cache, or cloud service. Successful replacement of the active dataset, including loading Demo data or a successful CSV import, clears all prior corrections so review IDs cannot leak between datasets. A failed import preserves both the active dataset and its corrections. Reloading the application clears corrections.

This session behavior is not product persistence. Local persistence, export, restore, schema migration, and recovery remain assigned to their later dedicated task.

## 7. Summary semantics

Task 5A returns all seven labels in stable order, including zero-match rows. For each label it provides:

- effective matched-review count;
- denominator equal to the number of actual review records in the active dataset;
- raw fraction, or `null` when the denominator is zero;
- distinct linked-product count and product IDs;
- review evidence containing automatic spans and/or manual-add reasons;
- ruleset version.

One review may contribute to multiple labels, so label counts are not mutually exclusive and must not be added into a total complaint count. Percentages describe only the share of actual review records in the active local sample carrying each effective label. They do not estimate market prevalence.

The quality gate remains authoritative for route availability: fewer than 10 valid linked reviews keeps the Pain Points module locked. Availability means only that the sample meets the minimum inspection threshold. It is not a finding that pain points exist or that research should advance commercially.

## 8. Task 5B page contract

The Pain Points page is evidence-first. It must show:

- active source kind and actual review denominator;
- ruleset version and a concise method statement;
- all seven stable summary rows with count, denominator, bounded percentage, and distinct-product coverage;
- evidence records with original English review text, review ID, product ID, rating, source URL, matched phrase and rule identity;
- a visible distinction between automatic evidence, manual additions, and labels manually removed from the effective result;
- manual add/remove controls with a required non-blank reason;
- Demo or user-upload limitations and the statement that review signals are not sales, demand, or wider-market prevalence.

The page must not rank labels as business opportunities, calculate severity from star rating, call the largest count a top market pain point, recommend product changes, or hide zero-count labels. Sorting is the approved stable catalog order, not descending count.

All source links must use the existing record URL without claiming that the URL was fetched or independently verified. Missing optional dates or purchase-verification values remain unknown; the UI must not invent replacements.

## 9. Task 5C human audit and acceptance

Task 5C creates `docs/evidence/review-audit.csv` with exactly these columns:

```text
review_id,system_labels,human_labels,outcome,notes,auditor,date
```

`outcome` is one of `correct`, `false_positive`, `missed_label`, or `unclear`. WorkBuddy may create the blank template and a deterministic 50-review sampling order, but it must leave `human_labels`, `outcome`, `notes`, `auditor`, and `date` blank. WorkBuddy and Codex must not impersonate the human auditor or fill outcomes from the system output.

The user performs the audit personally. Completed human audit data, if supplied, is committed separately as `docs: record review classification audit`. Any reported audit baseline uses raw outcome counts with the denominator and unresolved rows; it must not cherry-pick a success percentage. A weak or incomplete audit is reported as such.

Every post-audit rule change must be documented in `docs/evidence/review-rule-changelog.md` with version, date, reason, changed phrases, and concrete before/after examples. A rule change requires focused RED/GREEN evidence and a ruleset-version change. Audit completion is not required to claim Task 5A or 5B implementation complete, but it is required before claiming the original 50-review human-validation gate complete.

Task 5C also covers:

- semantic and keyboard acceptance of evidence disclosures and correction controls;
- real-browser checks at `1440 x 900`, `900 x 900`, and `390 x 844`;
- wrapping of long English reviews, phrases, IDs, URLs, and reasons without horizontal overflow;
- console/runtime warning checks and development-server cleanup;
- README reconciliation describing the implemented capability and remaining limits.

Observed browser states, automated-test states, and human-audit evidence must be reported separately.

## 10. Product status and downstream boundaries

Task 5 does not create a commercial score or decision. It may communicate only:

- `insufficient_evidence` when the approved quality threshold is not met;
- `continue_research` when the module is available for inspection;
- no `pause` result unless a later approved decision rule explicitly supports it.

`continue_research` means “inspect the rule-matched evidence,” not “build, source, launch, or buy.” Task 5 must not implement economics, supply-gap assumptions, opportunity scoring, weighted rankings, decision drafting, inventory advice, AI classification, scraping, external APIs, backend services, login, persistence, analytics, deployment, or production validation.

## 11. Verification and stopping rules

Every subtask follows genuine RED → GREEN for new behavior, focused tests, the full test suite, production build, TypeScript lint, frozen-lockfile installation, `git diff --check`, changed-file inspection, an ordinary commit, and a clean final worktree. An already passing assertion is reported as added coverage, not fabricated RED evidence.

If implementation exposes a conflict with the validated dataset contract, quality threshold, correction reset policy, or factual wording in this design, WorkBuddy must stop and report it. It may not silently broaden the task.

Product Task 5 closes only after 5A, 5B, and 5C each receive Codex `APPROVED`. The human 50-review audit remains explicitly incomplete until the user supplies genuine judgments, even if all code and acceptance checks pass.
