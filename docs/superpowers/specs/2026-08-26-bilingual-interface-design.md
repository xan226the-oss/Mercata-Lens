# Mercata Lens Bilingual Interface Design

**Date:** 2026-08-26
**Status:** Approved for implementation planning
**Scope:** English and Simplified Chinese presentation layer for the completed local MVP

## 1. Objective

Add an accessible English/Simplified Chinese interface switch to Mercata Lens without changing research data, domain calculations, evidence contracts, routes, exports, or the local-only product boundary.

The application starts in English. A user can switch the complete visible system interface to Simplified Chinese and back during the current browser session. Refreshing the page resets the interface to English. The language choice is not persisted.

## 2. Product boundaries

The bilingual feature translates system-owned presentation text:

- navigation and workspace chrome;
- page titles, descriptions, section labels, buttons, help text, empty states, warnings, errors, status labels, limitations, tables, filters, form labels, and accessibility text;
- known CSV diagnostic explanations and fixed domain status labels;
- display formatting for dates, USD amounts, percentages, and counts.

The feature does not translate or rewrite source and user-authored content:

- CSV column names and technical field identifiers;
- product IDs, review IDs, evidence IDs, ruleset versions, URLs, and enum values;
- product titles, brands, review text, and other imported source values;
- correction reasons, decision conditions, or other user-entered text;
- JSON keys or machine-readable export values.

`Mercata Lens` remains the product name in both languages. The Chinese interface may show `商机镜` as a secondary descriptor. `review_count` continues to mean review count only and must never be translated or presented as sales.

## 3. Architecture

### 3.1 Language state

Add a presentation-only `LanguageProvider` above `ResearchProvider`. It owns one value:

```ts
type Language = "en" | "zh-CN";
```

The initial value is always `en`. The provider does not read or write `localStorage`, `sessionStorage`, cookies, IndexedDB, URL parameters, files, or remote services.

Changing the language must not remount or reset `ResearchProvider`. The active dataset, import diagnostics, review corrections, economics scenarios, opportunity weights, selected evidence, and decision conditions remain unchanged.

### 3.2 Translation contract

Use a centralized, strongly typed dictionary with identical keys for English and Simplified Chinese. The presentation API is:

```ts
t(key, params?)
```

Translation keys describe meaning rather than English wording. Both dictionaries must provide every declared key. Missing, extra, blank, or invalid entries fail automated tests rather than silently rendering an empty string.

Parameter interpolation is explicit and typed for dynamic values such as counts, field names, dates, and scenario names. Dynamic source values are inserted unchanged.

Suggested modules:

- `src/i18n/types.ts`
- `src/i18n/messages.ts`
- `src/i18n/LanguageContext.tsx`
- `src/i18n/useI18n.ts`
- `src/components/LanguageSwitcher.tsx`

### 3.3 Presentation adapters

Fixed domain values remain stable internally and are translated only at rendering boundaries. Presentation adapters cover:

- research and import states;
- module availability and locked reasons;
- data-source labels;
- pain-point labels and evidence metadata;
- economics states and input labels;
- opportunity dimensions and ranking states;
- decision statuses and validation-plan labels;
- known CSV issue codes, fields, and reasons.

Known diagnostics receive a Chinese user-facing explanation while retaining the original technical field and raw English reason in traceable details. Unknown diagnostics remain visible and are labelled as untranslated technical detail; they are never hidden or machine-translated.

## 4. Language switcher

Place one `LanguageSwitcher` in the shared workspace header so every route exposes the same control.

- In English, the control label is `中文`.
- In Chinese, the control label is `English`.
- It is a native button with an accessible name that describes the target language.
- `aria-pressed` or equivalent state text exposes the current selection without relying on color.
- Enter and Space activate the switch.
- Focus remains predictable after switching.

The switcher must use the existing visual system, retain the current desktop layout at 1440×900 and 900×900, and preserve the existing minimum 390×844 no-overflow behavior. No new mobile-specific navigation or layout is introduced.

## 5. Routing and data flow

Existing URLs remain unchanged:

- `/`
- `/quality`
- `/category`
- `/pain-points`
- `/opportunities`
- `/decision`

The implementation must not create duplicate Chinese routes or duplicate page DOM trees. A language change causes presentation rerenders only. It does not navigate, reload Demo data, re-import CSV files, clear form drafts, or recalculate with different inputs.

The JSON export remains a stable English machine contract. Language choice is not added as a persistence or recovery mechanism. The export button and surrounding explanation are translated, but exported keys, enum values, evidence IDs, source text, and user-authored text remain unchanged.

## 6. Formatting

Display formatting follows the selected interface locale:

- English uses `en-US` presentation conventions.
- Chinese uses `zh-CN` presentation conventions.
- Currency remains USD and must retain an explicit dollar or USD meaning.
- Percentages and calculations preserve their existing precision and formulas.
- Formatting changes presentation only; stored values and deterministic exports do not change.

## 7. Error handling

- Missing translation keys fail tests and development checks.
- A translation lookup never returns a silent blank value.
- Known system errors are translated through stable codes or presentation mappings, not by matching arbitrary prose where a structured identifier exists.
- Original diagnostic evidence remains available for auditability.
- No AI model, external translation API, runtime network translation, or generated translation is introduced.

## 8. Testing and acceptance

### 8.1 Dictionary contract

- English and Chinese key sets are identical.
- No value is blank.
- Required interpolation parameters are enforced.
- No production fallback silently conceals a missing key.

### 8.2 Language behavior

- A fresh load is English.
- The switch changes the full visible system interface to Chinese.
- A second switch returns to English.
- Refreshing resets to English.
- No browser persistence API is called.
- The route remains unchanged.

### 8.3 Research-state preservation

Use real `ResearchProvider` integration tests to establish active user-upload data, a correction, edited economics, edited opportunity weights, selected evidence, and decision conditions. Switching language in both directions must preserve all of them.

The same research export produced before and after a language switch must retain the same machine-readable contract and research values.

### 8.4 Route coverage

Verify both languages across Home, Quality, Category, Pain Points, Opportunities, and Decision. Assertions cover navigation, titles, controls, status text, tables, errors, empty states, evidence labels, limitations, and accessibility names.

Source content and user-authored content must remain byte-for-byte unchanged where displayed. Tests must explicitly prevent translating review text, IDs, URLs, CSV fields, correction reasons, and decision conditions.

### 8.5 Browser acceptance

- Complete browser acceptance at 1440×900 and 900×900.
- Preserve the existing 390×844 no-horizontal-overflow regression without adding mobile-specific product behavior.
- Exercise the switch using keyboard Enter and Space.
- Confirm current-language printing on the Decision page.
- Fail on application console errors, page errors, React warnings, duplicate keys, missing translations, and non-favicon resource failures.

## 9. Documentation and delivery

Update the README to describe:

- English default and current-session Chinese switching;
- stable English JSON and CSV contracts;
- untranslated source/user content;
- no persistence and no runtime translation service.

Implementation must follow RED → GREEN, focused tests, full tests, standard build, lint, frozen install, diff check, and browser acceptance. It must use one normal commit per approved implementation task and stop for Codex review.

## 10. Explicit exclusions

This feature does not add:

- automatic browser-language detection;
- persisted language preferences;
- Chinese routes or duplicate mobile DOM;
- translated JSON keys or CSV schemas;
- translation of imported or user-authored evidence;
- backend services, accounts, cloud storage, analytics, AI, scraping, or external APIs;
- new market, category, scoring, recommendation, or commercial claims.
