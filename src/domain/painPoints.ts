import type { ResearchDataset, ReviewRecord } from "./types";
import {
  PAIN_POINT_IDS,
  PAIN_POINT_RULES,
  PAIN_POINT_RULESET_VERSION,
  matchPainPointRules,
  type PainPointId,
  type PainPointMatch,
} from "./painPointRules";

export interface PainPointCorrection {
  add: PainPointId[];
  remove: PainPointId[];
  reason: string;
}

export type PainPointCorrections = Record<string, PainPointCorrection>;
export type CorrectionValidity = "none" | "applied" | "ignored_blank_reason";

export interface ReviewClassification {
  reviewId: string;
  productId: string;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
  automaticMatches: PainPointMatch[];
  automaticLabels: PainPointId[];
  effectiveLabels: PainPointId[];
  correction: PainPointCorrection | null;
  correctionValidity: CorrectionValidity;
  addedLabels: PainPointId[];
  removedLabels: PainPointId[];
}

export interface PainPointEvidenceItem {
  reviewId: string;
  productId: string;
  rating: number;
  reviewText: string;
  reviewDate: string | null;
  verifiedPurchase: boolean | null;
  sourceUrl: string;
  automaticMatches: PainPointMatch[];
  manuallyAdded: boolean;
  correctionReason: string | null;
}

export interface PainPointSummary {
  id: PainPointId;
  labelEn: string;
  labelZh: string;
  rulesetVersion: typeof PAIN_POINT_RULESET_VERSION;
  matchedReviewCount: number;
  reviewDenominator: number;
  reviewFraction: number | null;
  productCount: number;
  productIds: string[];
  evidence: PainPointEvidenceItem[];
}

function stableLabels(labels: readonly PainPointId[]): PainPointId[] {
  const selected = new Set(labels);
  return PAIN_POINT_IDS.filter((id) => selected.has(id));
}

function correctionSnapshot(correction: PainPointCorrection): PainPointCorrection {
  return {
    add: stableLabels(correction.add),
    remove: stableLabels(correction.remove),
    reason: correction.reason,
  };
}

export function classifyReview(
  review: ReviewRecord,
  corrections: PainPointCorrections = {},
): ReviewClassification {
  const automaticMatches = matchPainPointRules(review.reviewText);
  const automaticLabels = stableLabels(
    automaticMatches.map((match) => match.painPointId),
  );
  const sourceCorrection = corrections[review.reviewId];

  if (!sourceCorrection) {
    return {
      reviewId: review.reviewId,
      productId: review.productId,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      automaticMatches,
      automaticLabels,
      effectiveLabels: [...automaticLabels],
      correction: null,
      correctionValidity: "none",
      addedLabels: [],
      removedLabels: [],
    };
  }

  const correction = correctionSnapshot(sourceCorrection);
  if (correction.reason.trim() === "") {
    return {
      reviewId: review.reviewId,
      productId: review.productId,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      automaticMatches,
      automaticLabels,
      effectiveLabels: [...automaticLabels],
      correction,
      correctionValidity: "ignored_blank_reason",
      addedLabels: [],
      removedLabels: [],
    };
  }

  const effectiveSet = new Set<PainPointId>([...automaticLabels, ...correction.add]);
  for (const id of correction.remove) effectiveSet.delete(id);
  const effectiveLabels = stableLabels([...effectiveSet]);
  return {
    reviewId: review.reviewId,
    productId: review.productId,
    rulesetVersion: PAIN_POINT_RULESET_VERSION,
    automaticMatches,
    automaticLabels,
    effectiveLabels,
    correction,
    correctionValidity: "applied",
    addedLabels: effectiveLabels.filter((id) => !automaticLabels.includes(id)),
    removedLabels: automaticLabels.filter((id) => !effectiveLabels.includes(id)),
  };
}

export function summarizePainPoints(
  dataset: ResearchDataset,
  corrections: PainPointCorrections = {},
): PainPointSummary[] {
  const classifications = dataset.reviews.map((review) => ({
    review,
    classification: classifyReview(review, corrections),
  }));
  const reviewDenominator = dataset.reviews.length;

  return PAIN_POINT_RULES.map((rule) => {
    const evidence: PainPointEvidenceItem[] = classifications
      .filter(({ classification }) => classification.effectiveLabels.includes(rule.id))
      .map(({ review, classification }) => {
        const manuallyAdded = classification.addedLabels.includes(rule.id);
        return {
          reviewId: review.reviewId,
          productId: review.productId,
          rating: review.rating,
          reviewText: review.reviewText,
          reviewDate: review.reviewDate,
          verifiedPurchase: review.verifiedPurchase,
          sourceUrl: review.sourceUrl,
          automaticMatches: classification.automaticMatches.filter(
            (match) => match.painPointId === rule.id,
          ),
          manuallyAdded,
          correctionReason: manuallyAdded
            ? classification.correction?.reason ?? null
            : null,
        };
      });
    const productIds = [...new Set(evidence.map((item) => item.productId))];

    return {
      id: rule.id,
      labelEn: rule.labelEn,
      labelZh: rule.labelZh,
      rulesetVersion: PAIN_POINT_RULESET_VERSION,
      matchedReviewCount: evidence.length,
      reviewDenominator,
      reviewFraction: reviewDenominator === 0 ? null : evidence.length / reviewDenominator,
      productCount: productIds.length,
      productIds,
      evidence,
    };
  });
}
