import { describe, expect, it } from "vitest";
import {
  PAIN_POINT_IDS,
  PAIN_POINT_RULES,
  PAIN_POINT_RULESET_VERSION,
} from "./painPointRules";
import type { PainPointRule } from "./painPointRules";
import { matchPainPointRule, matchPainPointRules } from "./painPointRules";

describe("pain-point rule catalog", () => {
  it("exposes the approved version, stable IDs, labels, and conservative phrases", () => {
    expect(PAIN_POINT_RULESET_VERSION).toBe("1.0.0");
    expect(PAIN_POINT_IDS).toEqual([
      "hard_to_clean",
      "noise",
      "leakage",
      "pump_lifetime",
      "filter_cost",
      "capacity",
      "pet_acceptance",
    ]);
    expect(PAIN_POINT_RULES.map((rule) => rule.id)).toEqual(PAIN_POINT_IDS);
    expect(PAIN_POINT_RULES).toEqual([
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
    ]);
  });
});

describe("matchPainPointRules", () => {
  it("matches case, punctuation, and whitespace while preserving the exact source slice", () => {
    const text = "Very HARD---to\n\t  clean after a week.";
    const [match] = matchPainPointRules(text).filter(
      (item) => item.painPointId === "hard_to_clean",
    );

    expect(match).toMatchObject({
      painPointId: "hard_to_clean",
      ruleId: "hard_to_clean",
      includePhrase: "hard to clean",
      sourceText: "HARD---to\n\t  clean",
      rulesetVersion: "1.0.0",
    });
    expect(text.slice(match.start, match.end)).toBe(match.sourceText);
  });

  it("does not stem or infer a phrase", () => {
    expect(matchPainPointRules("It is harder to clean.")).toEqual([]);
  });

  it("suppresses only an overlapping exclusion span", () => {
    const noise = matchPainPointRules(
      "It was not noisy at first, but the pump became noisy after a week.",
    ).filter((item) => item.painPointId === "noise");
    const leakage = matchPainPointRules(
      "There were no leaks before, but it leaked yesterday.",
    ).filter((item) => item.painPointId === "leakage");

    expect(noise.map((item) => item.sourceText)).toEqual(["noisy"]);
    expect(leakage.map((item) => item.sourceText)).toEqual(["leaked"]);
    expect(matchPainPointRules("Not noisy. No leaks.")).toEqual([]);
  });

  it("matches pump lifetime and more than one label in one review", () => {
    expect(matchPainPointRules("Pump died after two months.").map(
      (item) => item.painPointId,
    )).toEqual(["pump_lifetime"]);

    expect(matchPainPointRules(
      "Hard to clean, and filter replacements add up.",
    ).map((item) => item.painPointId)).toEqual([
      "hard_to_clean",
      "filter_cost",
    ]);
  });

  it("returns no matches for empty or punctuation-only text", () => {
    expect(matchPainPointRules("")).toEqual([]);
    expect(matchPainPointRules("... -- !!!")).toEqual([]);
  });

  it("does not mutate the configured rule catalog", () => {
    const before = JSON.stringify(PAIN_POINT_RULES);
    matchPainPointRules("Hard to clean and noisy.");
    expect(JSON.stringify(PAIN_POINT_RULES)).toBe(before);
  });

  it("prefers longer source span when normalized token counts tie", () => {
    const rule: PainPointRule = {
      id: "noise",
      labelEn: "Unwanted noise",
      labelZh: "噪音问题",
      includePhrases: ["b c", "a b"],
      excludePhrases: [],
    };

    expect(matchPainPointRule("a--b c", rule)).toEqual([
      expect.objectContaining({
        includePhrase: "a b",
        sourceText: "a--b",
      }),
    ]);
  });

  it("prefers the earlier configured phrase when token count and span tie", () => {
    const rule: PainPointRule = {
      id: "noise",
      labelEn: "Unwanted noise",
      labelZh: "噪音问题",
      includePhrases: ["constant-hum", "constant hum"],
      excludePhrases: [],
    };

    expect(matchPainPointRule("constant hum", rule)).toEqual([
      expect.objectContaining({
        includePhrase: "constant-hum",
        sourceText: "constant hum",
      }),
    ]);
  });
});
