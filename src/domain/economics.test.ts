import { describe, expect, it } from "vitest";
import type { EconomicInputs } from "./types";
import { calculateContribution } from "./economics";

const completeInputs = (): EconomicInputs => ({
  salePriceCents: 3999,
  sourcingCostCents: 1200,
  inboundFreightCents: 300,
  referralFeeRate: 0.15,
  fulfillmentCostCents: 650,
  advertisingCostCents: 400,
  returnLossCents: 100,
  otherCostCents: 49,
});

describe("calculateContribution complete arithmetic", () => {
  it("calculates the approved $39.99 case in integer cents", () => {
    const result = calculateContribution(completeInputs());

    expect(result).toEqual({
      status: "complete",
      contributionCents: 700,
      marginRate: 700 / 3999,
      referralFeeCents: 600,
      totalCostCents: 3299,
      assumptions: [
        "salePriceCents",
        "sourcingCostCents",
        "inboundFreightCents",
        "referralFeeRate",
        "fulfillmentCostCents",
        "advertisingCostCents",
        "returnLossCents",
        "otherCostCents",
      ],
    });
  });

  it("allows zero costs and a negative contribution without invalidating valid inputs", () => {
    const result = calculateContribution({
      ...completeInputs(),
      salePriceCents: 100,
      sourcingCostCents: 80,
      inboundFreightCents: 20,
      referralFeeRate: 0,
      fulfillmentCostCents: 10,
      advertisingCostCents: 0,
      returnLossCents: 0,
      otherCostCents: 0,
    });

    expect(result).toMatchObject({
      status: "complete",
      referralFeeCents: 0,
      totalCostCents: 110,
      contributionCents: -10,
      marginRate: -0.1,
    });
  });

  it("returns a null margin for a zero sale price without NaN or infinity", () => {
    const result = calculateContribution({
      ...completeInputs(),
      salePriceCents: 0,
      sourcingCostCents: 0,
      inboundFreightCents: 0,
      referralFeeRate: 0.5,
      fulfillmentCostCents: 0,
      advertisingCostCents: 0,
      returnLossCents: 0,
      otherCostCents: 0,
    });

    expect(result).toMatchObject({ status: "complete", contributionCents: 0, marginRate: null, referralFeeCents: 0, totalCostCents: 0 });
    if (result.status === "complete") {
      expect(Number.isFinite(result.contributionCents)).toBe(true);
      expect(result.marginRate).toBeNull();
    }
  });
});

describe("calculateContribution incomplete inputs", () => {
  it.each([
    "salePriceCents",
    "sourcingCostCents",
    "inboundFreightCents",
    "referralFeeRate",
    "fulfillmentCostCents",
    "advertisingCostCents",
    "returnLossCents",
    "otherCostCents",
  ] as const)("reports the missing %s field in stable input order", (field) => {
    const inputs = completeInputs();
    inputs[field] = null;
    const result = calculateContribution(inputs);

    expect(result.status).toBe("incomplete");
    if (result.status !== "incomplete") return;
    expect(result.missingFields).toEqual([field]);
    expect(result.partialKnownCostsCents).toBe(
      field === "salePriceCents" || field === "referralFeeRate"
        ? 2699
        : 3299 - (field === "sourcingCostCents" ? 1200 : field === "inboundFreightCents" ? 300 : field === "fulfillmentCostCents" ? 650 : field === "advertisingCostCents" ? 400 : field === "returnLossCents" ? 100 : 49),
    );
  });

  it("returns all missing fields in contract order and never invents amounts", () => {
    const result = calculateContribution({
      salePriceCents: null,
      sourcingCostCents: null,
      inboundFreightCents: null,
      referralFeeRate: null,
      fulfillmentCostCents: null,
      advertisingCostCents: null,
      returnLossCents: null,
      otherCostCents: null,
    });

    expect(result).toEqual({
      status: "incomplete",
      missingFields: [
        "salePriceCents",
        "sourcingCostCents",
        "inboundFreightCents",
        "referralFeeRate",
        "fulfillmentCostCents",
        "advertisingCostCents",
        "returnLossCents",
        "otherCostCents",
      ],
      partialKnownCostsCents: 0,
    });
  });

  it("includes known referral cost only when both referral operands are present", () => {
    const result = calculateContribution({ ...completeInputs(), salePriceCents: null });
    expect(result).toMatchObject({ status: "incomplete", partialKnownCostsCents: 2699 });

    const rateMissing = calculateContribution({ ...completeInputs(), referralFeeRate: null });
    expect(rateMissing).toMatchObject({ status: "incomplete", partialKnownCostsCents: 2699 });
  });
});

describe("calculateContribution invalid inputs", () => {
  it("rejects a complete input when finite cost additions exceed safe integer range", () => {
    const result = calculateContribution({
      ...completeInputs(),
      salePriceCents: Number.MAX_SAFE_INTEGER,
      sourcingCostCents: Number.MAX_SAFE_INTEGER,
      inboundFreightCents: 1,
      fulfillmentCostCents: 0,
      advertisingCostCents: 0,
      returnLossCents: 0,
      otherCostCents: 0,
    });

    expect(result).toEqual({
      status: "invalid",
      issues: [
        {
          field: "inboundFreightCents",
          code: "not_finite",
          message: "inboundFreightCents produces an unsafe total.",
        },
      ],
    });
  });

  it("returns invalid rather than incomplete when known costs overflow with a missing field", () => {
    const result = calculateContribution({
      salePriceCents: null,
      sourcingCostCents: Number.MAX_SAFE_INTEGER,
      inboundFreightCents: Number.MAX_SAFE_INTEGER,
      referralFeeRate: null,
      fulfillmentCostCents: 1,
      advertisingCostCents: null,
      returnLossCents: null,
      otherCostCents: null,
    });

    expect(result).toEqual({
      status: "invalid",
      issues: [
        {
          field: "inboundFreightCents",
          code: "not_finite",
          message: "inboundFreightCents produces an unsafe total.",
        },
      ],
    });
  });

  it("rejects a cent input outside the safe integer range", () => {
    const result = calculateContribution({
      ...completeInputs(),
      otherCostCents: Number.MAX_SAFE_INTEGER + 1,
    });

    expect(result).toEqual({
      status: "invalid",
      issues: [
        {
          field: "otherCostCents",
          code: "not_finite",
          message: "otherCostCents must be a finite safe integer.",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
  });

  it("collects invalid issues in stable input order and takes precedence over incomplete", () => {
    const result = calculateContribution({
      salePriceCents: -1,
      sourcingCostCents: 1.5,
      inboundFreightCents: Number.NaN,
      referralFeeRate: 1.1,
      fulfillmentCostCents: Number.POSITIVE_INFINITY,
      advertisingCostCents: null,
      returnLossCents: -2,
      otherCostCents: null,
    });

    expect(result).toEqual({
      status: "invalid",
      issues: [
        { field: "salePriceCents", code: "negative", message: "salePriceCents must be non-negative." },
        { field: "sourcingCostCents", code: "not_finite", message: "sourcingCostCents must be a finite safe integer." },
        { field: "inboundFreightCents", code: "not_finite", message: "inboundFreightCents must be a finite safe integer." },
        { field: "referralFeeRate", code: "rate_out_of_range", message: "referralFeeRate must be between 0 and 1." },
        { field: "fulfillmentCostCents", code: "not_finite", message: "fulfillmentCostCents must be a finite safe integer." },
        { field: "returnLossCents", code: "negative", message: "returnLossCents must be non-negative." },
      ],
    });
  });

  it("rejects fractional cents, negative rates, and non-finite rates", () => {
    for (const value of [-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = calculateContribution({ ...completeInputs(), salePriceCents: value });
      expect(result.status).toBe("invalid");
    }

    for (const value of [-0.01, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = calculateContribution({ ...completeInputs(), referralFeeRate: value });
      expect(result.status).toBe("invalid");
    }
  });

  it("rounds referral fees with Math.round, including the half-cent boundary", () => {
    const result = calculateContribution({ ...completeInputs(), salePriceCents: 1, referralFeeRate: 0.5 });
    expect(result).toMatchObject({ status: "complete", referralFeeCents: 1, totalCostCents: 2700, contributionCents: -2699 });
  });
});

describe("calculateContribution safety", () => {
  it("does not mutate inputs and returns stable repeated results", () => {
    const inputs = completeInputs();
    const snapshot = structuredClone(inputs);
    const first = calculateContribution(inputs);
    const second = calculateContribution(inputs);

    expect(inputs).toEqual(snapshot);
    expect(second).toEqual(first);
  });
});
