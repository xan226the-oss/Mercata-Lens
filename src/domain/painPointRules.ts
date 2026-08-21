export const PAIN_POINT_RULESET_VERSION = "1.0.0" as const;

export const PAIN_POINT_IDS = [
  "hard_to_clean",
  "noise",
  "leakage",
  "pump_lifetime",
  "filter_cost",
  "capacity",
  "pet_acceptance",
] as const;

export type PainPointId = (typeof PAIN_POINT_IDS)[number];

export interface PainPointRule {
  id: PainPointId;
  labelEn: string;
  labelZh: string;
  includePhrases: readonly string[];
  excludePhrases: readonly string[];
}

export interface PainPointMatch {
  painPointId: PainPointId;
  ruleId: PainPointId;
  includePhrase: string;
  sourceText: string;
  start: number;
  end: number;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
}

export const PAIN_POINT_RULES = [
  {
    id: "hard_to_clean",
    labelEn: "Cleaning difficulty",
    labelZh: "清洁困难",
    includePhrases: [
      "hard to clean",
      "cleaning takes forever",
      "pain to clean",
      "not the easiest to clean",
      "awkward to clean",
      "awkward to take apart",
    ],
    excludePhrases: ["not hard to clean"],
  },
  {
    id: "noise",
    labelEn: "Unwanted noise",
    labelZh: "噪音问题",
    includePhrases: ["noisy", "loud splashing", "not as quiet", "constant hum"],
    excludePhrases: ["not noisy", "no noise"],
  },
  {
    id: "leakage",
    labelEn: "Water leakage",
    labelZh: "漏水问题",
    includePhrases: ["leak", "leaks", "leaked", "leaking", "leakage"],
    excludePhrases: ["no leak", "no leaks", "no leakage", "not leaking"],
  },
  {
    id: "pump_lifetime",
    labelEn: "Pump lifetime",
    labelZh: "水泵寿命",
    includePhrases: [
      "pump died",
      "pump stopped working",
      "pump became weak",
      "pump got clogged and stopped",
    ],
    excludePhrases: [],
  },
  {
    id: "filter_cost",
    labelEn: "Filter replacement cost",
    labelZh: "滤芯更换成本",
    includePhrases: [
      "filter replacements add up",
      "replacement filters are pricey",
      "recurring expense",
      "expensive side",
    ],
    excludePhrases: [],
  },
  {
    id: "capacity",
    labelEn: "Capacity or refill burden",
    labelZh: "容量或补水负担",
    includePhrases: [
      "too small",
      "smaller than expected",
      "needs refilling every day",
      "refills more often",
    ],
    excludePhrases: [],
  },
  {
    id: "pet_acceptance",
    labelEn: "Pet acceptance",
    labelZh: "宠物接受度",
    includePhrases: [
      "ignores it completely",
      "was scared",
      "only one of my three cats uses it",
    ],
    excludePhrases: [],
  },
] as const satisfies readonly PainPointRule[];

interface TextToken {
  normalized: string;
  start: number;
  end: number;
}

interface MatchCandidate extends PainPointMatch {
  phraseIndex: number;
  tokenCount: number;
}

function tokenize(text: string): TextToken[] {
  return [...text.matchAll(/[A-Za-z0-9]+/g)].map((match) => ({
    normalized: match[0].toLowerCase(),
    start: match.index!,
    end: match.index! + match[0].length,
  }));
}

function phraseSpans(
  reviewText: string,
  reviewTokens: TextToken[],
  phrase: string,
): Array<{ start: number; end: number; sourceText: string; tokenCount: number }> {
  const phraseTokens = tokenize(phrase).map((token) => token.normalized);
  if (phraseTokens.length === 0) return [];

  const spans: Array<{
    start: number;
    end: number;
    sourceText: string;
    tokenCount: number;
  }> = [];
  for (let startIndex = 0; startIndex <= reviewTokens.length - phraseTokens.length; startIndex += 1) {
    const matches = phraseTokens.every(
      (token, offset) => reviewTokens[startIndex + offset].normalized === token,
    );
    if (!matches) continue;
    const first = reviewTokens[startIndex];
    const last = reviewTokens[startIndex + phraseTokens.length - 1];
    spans.push({
      start: first.start,
      end: last.end,
      sourceText: reviewText.slice(first.start, last.end),
      tokenCount: phraseTokens.length,
    });
  }
  return spans;
}

function overlaps(
  left: { start: number; end: number },
  right: { start: number; end: number },
): boolean {
  return left.start < right.end && right.start < left.end;
}

export function matchPainPointRule(
  reviewText: string,
  rule: PainPointRule,
): PainPointMatch[] {
  const reviewTokens = tokenize(reviewText);
  if (reviewTokens.length === 0) return [];

  const exclusions = rule.excludePhrases.flatMap((phrase) =>
    phraseSpans(reviewText, reviewTokens, phrase),
  );
  const candidates: MatchCandidate[] = rule.includePhrases.flatMap(
    (includePhrase, phraseIndex) =>
      phraseSpans(reviewText, reviewTokens, includePhrase).map((span) => ({
        painPointId: rule.id,
        ruleId: rule.id,
        includePhrase,
        sourceText: span.sourceText,
        start: span.start,
        end: span.end,
        rulesetVersion: PAIN_POINT_RULESET_VERSION,
        phraseIndex,
        tokenCount: span.tokenCount,
      })),
  ).filter((candidate) => !exclusions.some((excluded) => overlaps(candidate, excluded)));

  const preferred = [...candidates].sort(
    (a, b) =>
      b.tokenCount - a.tokenCount ||
      (b.end - b.start) - (a.end - a.start) ||
      a.phraseIndex - b.phraseIndex ||
      a.start - b.start,
  );
  const selected: MatchCandidate[] = [];
  for (const candidate of preferred) {
    if (!selected.some((existing) => overlaps(candidate, existing))) {
      selected.push(candidate);
    }
  }

  return selected
    .sort((a, b) => a.start - b.start)
    .map((candidate) => ({
      painPointId: candidate.painPointId,
      ruleId: candidate.ruleId,
      includePhrase: candidate.includePhrase,
      sourceText: candidate.sourceText,
      start: candidate.start,
      end: candidate.end,
      rulesetVersion: candidate.rulesetVersion,
    }));
}

export function matchPainPointRules(reviewText: string): PainPointMatch[] {
  return PAIN_POINT_RULES.flatMap((rule) => matchPainPointRule(reviewText, rule));
}
