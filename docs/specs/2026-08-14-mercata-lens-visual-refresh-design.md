# Mercata Lens Visual Refresh Design

**Date:** 2026-08-14  
**Status:** Approved design  
**Product:** Mercata Lens（商机镜）  
**Scope:** Application shell, Research project home page, and Data quality page

## 1. Purpose

Mercata Lens currently proves its data import and quality-gate workflow, but its interface reads like an engineering validation screen. Large text blocks, weak hierarchy, repeated warnings, and similarly weighted panels make the product harder to understand and less inviting to use.

This refresh gives the product the character of a mature commercial research platform. It must remain evidence-led and restrained: visual polish cannot imply that demo data proves sales, market size, GMV, market share, or product opportunity.

## 2. Design direction

The approved direction is **Light Slate — Commercial Analysis Platform**.

The intended impression is:

- professional and trustworthy;
- modern without looking like a generic AI dashboard;
- structured like business analysis software, not a newspaper or long-form report;
- visually useful without inventing metrics or certainty.

### 2.1 Colour system

- Sidebar: white or very light neutral grey.
- Application background: cool light grey.
- Content surfaces: white.
- Primary accent: restrained slate blue, used for active navigation, primary actions, and selected chart marks.
- Text: dark slate rather than pure black.
- Success: muted green.
- Warning: muted amber.
- Blocking error: restrained red.
- Borders: cool grey with sufficient contrast.

The interface must not use large dark-blue surfaces, neon colours, glowing effects, or decorative gradients.

### 2.2 Typography

- Product and page headings: `Lora`, with `Georgia` and `serif` fallbacks.
- Navigation, body text, buttons, labels, data values, and tables: `IBM Plex Sans`, with system sans-serif fallbacks.

The mixed type system keeps a modest research character in headings while preserving product readability for operational content and numbers. The interface must not use serif typography for all content.

### 2.3 Shape and depth

- Retain the structured dashboard layout from the first concept.
- Reduce corner radius and shadow intensity.
- Use borders and spacing before shadows to establish hierarchy.
- Avoid excessive pills, floating cards, and decorative badges.
- Use flat chart colours and fine guide lines rather than gradients.

## 3. Application shell

### 3.1 Desktop layout

The application uses a light sidebar and a main content area.

The sidebar contains:

1. Mercata Lens / 商机镜 identity;
2. six-step research navigation;
3. active and locked states;
4. a concise evidence rule: review count is a feedback signal, not sales.

The main header contains:

- current market and category;
- current data-source status;
- observation date where available;
- the primary **Import research data** action.

The header must truthfully distinguish:

- Demo data;
- User upload;
- Loading data;
- No active data.

### 3.2 Navigation states

- The active step uses the primary slate-blue accent.
- Available steps remain clearly clickable.
- Locked steps remain non-clickable and state the missing evidence requirement.
- `/quality` remains available when later analysis modules are locked.

The refresh must not alter the existing route or module-availability rules.

## 4. Research project home page

The home page follows the reading order **overview → evidence → next action**.

### 4.1 Research scope

The first section identifies:

- United States market;
- Cat Water Fountain category;
- active source;
- observation date;
- the boundary that review count is not sales.

This content must be concise and must not dominate the page.

### 4.2 Metric strip

Show four descriptive metrics derived from the active dataset:

1. number of products;
2. number of review evidence records;
3. observed price range;
4. represented brand count when available.

Labels must state the evidence boundary. For example, review records must not be labelled customers or sales. If a metric cannot be derived from the active data, display an explicit unavailable state rather than guessing.

### 4.3 Primary analysis area

The main content row contains:

- a price-distribution panel;
- an evidence-readiness panel.

The price panel may show the observed comparison-set distribution and price band. It must state that the pattern does not establish the best launch price or total market distribution.

The evidence-readiness panel displays individual gates, not a fabricated quality score:

- identity and references;
- category sample requirement;
- review sample requirement.

Each gate uses Passed, Warning, or Blocked with supporting counts.

### 4.4 Research themes

Show review topics that the product will investigate, such as:

- pump noise;
- cleaning effort;
- leakage;
- filter cost;
- pet acceptance.

Before the pain-point analysis module is implemented and verified, these must be labelled **research themes** or **topics to investigate**, not confirmed pain points or opportunities.

### 4.5 Research progress

Show:

- completed step;
- current recommended step;
- upcoming or locked steps;
- the evidence required to unlock them.

### 4.6 Decision cautions

Use one compact area for persistent limitations:

- review count is not sales;
- demo data is not live market data;
- economics remains incomplete until its required inputs exist.

Avoid repeating the same limitation across multiple large banners.

### 4.7 Failed import on the home page

The home page shows only a concise failure summary, for example:

> Import failed · 3 blocking issues · Current Demo data was not replaced.

The summary links or guides the user to Data quality for complete diagnostics. The home page must not render a large list of every issue.

## 5. Data quality page

The page separates **the latest import attempt** from **the active valid dataset**. These two states must never be visually merged.

### 5.1 Latest import attempt

When the latest import fails, show:

- failed status;
- total blocking-issue count;
- explicit confirmation that the active research was not replaced;
- a structured issue table.

The table contains:

| Column | Meaning |
| --- | --- |
| File | Products or Reviews CSV |
| Row | Original CSV row number |
| Field | Field that failed validation |
| Bad value | Original rejected value |
| Reason | Plain-language explanation |

The table may later add a repair suggestion, but the first refresh does not introduce automated correction.

### 5.2 Active valid dataset

In a separate section, show:

- active source;
- valid product count;
- valid review count;
- confirmation that a failed import did not replace the active data;
- current quality gates.

The active-data section may say that its own blocking-issue count is zero, but it must be labelled clearly enough that users do not mistake it for the latest failed import result.

### 5.3 Quality gates

Display individual gates using Passed, Warning, and Blocked:

- file structure;
- product identity and duplicates;
- review references;
- sample-size requirements.

Do not create a composite quality score or percentage unless a future product specification defines and validates one.

### 5.4 Module availability

Show the current status and evidence requirement for:

- Category overview;
- Customer pain points;
- Economics;
- Opportunity comparison;
- Decision plan where presented in navigation.

Availability remains driven by the current Task 3 quality contract. The refresh only changes presentation.

## 6. Component boundaries

The visual system should be implemented through focused components:

- `AppShell`: sidebar, header, navigation, and main content frame;
- `PageHeader`: title, short description, metadata, and main action;
- `MetricStrip`: descriptive dataset metrics;
- `AnalysisPanel`: chart or research-analysis container;
- `EvidenceStatus`: individual evidence gates without a composite score;
- `ImportResult`: latest import summary;
- `IssueTable`: structured import diagnostics;
- `ModuleStatus`: module availability and unlock reason.

Components must consume existing ResearchContext and quality contracts rather than duplicating validation logic in UI files.

## 7. Responsive behaviour

### Desktop

- Persistent light sidebar.
- Main content uses readable two-column analysis layouts where appropriate.
- Metrics may appear in a four-column strip.

### Tablet and narrow desktop

- Sidebar may collapse into a compact top navigation.
- Analysis panels stack when their content becomes cramped.
- Metrics become two columns.

### Mobile

- Navigation becomes a compact top control.
- Metrics become one or two columns according to available width.
- Issue tables transform into one card per issue, preserving file, row, field, value, and reason.
- No required content may depend on horizontal scrolling.

## 8. Accessibility and interaction

- Text and icons communicate state; colour alone is insufficient.
- Blocking failures use an alert semantic; informational updates use status semantics.
- Keyboard users can reach all available navigation and actions.
- Locked navigation is not interactive and explains why it is locked.
- Charts include accessible labels or text alternatives.
- Focus styles remain visible.
- Motion is not required for the refresh.

## 9. Required visual states

The implementation and tests must cover:

1. Demo data ready;
2. User upload ready;
3. Demo loading;
4. no active data;
5. import success;
6. import failure while the old dataset remains active;
7. low sample with dependent modules locked;
8. narrow-screen issue diagnostics.

## 10. Scope boundaries

### Included

- light-slate design tokens and typography;
- application shell refresh;
- home-page hierarchy and responsive layout;
- Data quality separation and issue-table presentation;
- reusable presentational components required by those pages;
- visual and behaviour tests for the required states.

### Excluded

- changes to CSV contracts or parsing;
- changes to quality thresholds or module-availability logic;
- Task 4 category-statistics implementation;
- confirmed pain-point extraction;
- economics calculations;
- opportunity scoring;
- AI models;
- backend, authentication, cloud storage, or persistence;
- Amazon scraping or APIs;
- deployment.

Future analysis modules will adopt this visual system as they are implemented. This refresh must not render fabricated Task 4 results merely to fill the interface.

## 11. Acceptance criteria

The refresh is accepted when:

- the interface matches the approved Light Slate direction;
- headings use the approved serif/sans split rather than a single all-serif system;
- the home page prioritises metrics, evidence, and next actions over long prose;
- the latest failed import and the active valid dataset are visually unambiguous;
- issue diagnostics retain file, row, field, bad value, and reason;
- all existing Task 1–3 behaviour and tests remain valid;
- no new data claims or analysis logic are introduced;
- the required states pass focused UI tests, full tests, build, and lint;
- the layout remains usable on desktop and narrow screens.
