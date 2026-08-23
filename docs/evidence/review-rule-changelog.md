# Review rule changelog

## Current baseline: ruleset 1.0.0

- **Version:** `1.0.0`
- **Status:** Unchanged baseline; code-owned by `src/domain/painPointRules.ts`.
- **Date recorded:** 2026-08-23
- **Reason:** Task 5C acceptance records the approved deterministic phrase catalog without claiming that a human audit has been completed.
- **Changed phrases:** None in this acceptance handoff.
- **Before/after examples:** Not applicable because no post-audit rule change exists yet.

The seven-label catalog and stable order remain:

```text
hard_to_clean | noise | leakage | pump_lifetime | filter_cost | capacity | pet_acceptance
```

The matcher remains deterministic and conservative: ASCII letter/digit token matching, case/punctuation/whitespace normalization for comparison, exact original source offsets, configured exclusions, and no stemming, fuzzy matching, semantic inference, translation, sentiment scoring, or AI.

## Future reviewed rule-change entry template

Copy this section for a separately reviewed ruleset change. Do not edit the `1.0.0` baseline above.

```markdown
## Version: 1.x.x

- Date:
- Reason grounded in human-audit evidence:
- Added phrases:
- Removed phrases:
- Boundary or exclusion changes:
- Focused RED test:
- Focused GREEN test:
- Before example:
  - Review text:
  - Previous result:
- After example:
  - Review text:
  - New result:
- Human-audit rows supporting the change:
```

A future change must update the ruleset version, add concrete boundary tests, and be committed separately from the user's completed audit judgments.
