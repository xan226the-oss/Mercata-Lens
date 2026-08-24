import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { EconomicsEditor } from "./EconomicsEditor";
import { createEconomicScenarios } from "../data/economicScenarios";

const fields = [
  ["salePriceCents", "Sale price"],
  ["sourcingCostCents", "Sourcing cost"],
  ["inboundFreightCents", "Inbound freight"],
  ["referralFeeRate", "Referral fee rate"],
  ["fulfillmentCostCents", "Fulfillment cost"],
  ["advertisingCostCents", "Advertising cost"],
  ["returnLossCents", "Return-loss allowance"],
  ["otherCostCents", "Other cost"],
] as const;

describe("EconomicsEditor", () => {
  it("renders three independent accessible scenario fieldsets and provenance", () => {
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={vi.fn()} />);
    expect(screen.getAllByRole("group")).toHaveLength(3);
    for (const [field, label] of fields) {
      expect(screen.getAllByLabelText(label)).toHaveLength(3);
      expect(screen.getAllByText(/Demo assumption:/)).not.toHaveLength(0);
      expect(field).toBeTruthy();
    }
  });

  it("keeps malformed drafts visible while empty emits null", async () => {
    const onReplaceScenario = vi.fn();
    const user = userEvent.setup();
    render(<EconomicsEditor scenarios={createEconomicScenarios("user_upload")} onReplaceScenario={onReplaceScenario} />);
    const salePrice = screen.getAllByLabelText("Sale price")[0];
    await user.type(salePrice, "oops");
    expect(salePrice).toHaveValue("oops");
    expect(screen.getByText(/Enter a finite dollar amount/)).toBeVisible();
    expect(onReplaceScenario).not.toHaveBeenCalled();
    await user.clear(salePrice);
    expect(onReplaceScenario).toHaveBeenCalledTimes(1);
    expect(onReplaceScenario.mock.calls[0][0].inputs.salePriceCents).toBeNull();
  });

  it("converts exact decimal dollar drafts to integer cents without floating-point drift", async () => {
    const onReplaceScenario = vi.fn();
    const user = userEvent.setup();
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={onReplaceScenario} />);
    const salePrice = screen.getAllByLabelText("Sale price")[1];
    for (const [raw, cents] of [["19.99", 1999], ["1.15", 115], ["0.29", 29], ["12.34", 1234], [".29", 29], ["19.", 1900]] as const) {
      await user.clear(salePrice);
      await user.type(salePrice, raw);
      expect(salePrice).toHaveValue(raw);
      expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.salePriceCents).toBe(cents);
    }
  });

  it("covers exact safe integer dollar boundaries", async () => {
    const onReplaceScenario = vi.fn();
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={onReplaceScenario} />);
    const salePrice = screen.getAllByLabelText("Sale price")[1];
    fireEvent.change(salePrice, { target: { value: "90071992547409.91" } });
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.salePriceCents).toBe(Number.MAX_SAFE_INTEGER);
    const callsAfterMax = onReplaceScenario.mock.calls.length;
    fireEvent.change(salePrice, { target: { value: "90071992547409.92" } });
    expect(onReplaceScenario).toHaveBeenCalledTimes(callsAfterMax);
    fireEvent.change(salePrice, { target: { value: "-90071992547409.91" } });
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.salePriceCents).toBe(-Number.MAX_SAFE_INTEGER);
    const callsAfterNegativeMax = onReplaceScenario.mock.calls.length;
    fireEvent.change(salePrice, { target: { value: "-90071992547409.92" } });
    expect(onReplaceScenario).toHaveBeenCalledTimes(callsAfterNegativeMax);
  });

  it("keeps an oversized pure numeric rate draft and reports finite percentage error", async () => {
    const onReplaceScenario = vi.fn();
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={onReplaceScenario} />);
    const rate = screen.getAllByLabelText("Referral fee rate")[1];
    const callsBefore = onReplaceScenario.mock.calls.length;
    const oversizedRate = "9".repeat(400);
    fireEvent.change(rate, { target: { value: oversizedRate } });
    expect(rate).toHaveValue(oversizedRate);
    expect(screen.getByText("Enter a finite percentage.")).toBeVisible();
    expect(onReplaceScenario).toHaveBeenCalledTimes(callsBefore);
  });

  it("rejects finite percentage underflow drafts with accessible errors and preserves the scenario", () => {
    const onReplaceScenario = vi.fn();
    const scenarios = createEconomicScenarios("demo");
    const original = JSON.parse(JSON.stringify(scenarios[1]));
    render(<EconomicsEditor scenarios={scenarios} onReplaceScenario={onReplaceScenario} />);
    const rate = screen.getAllByLabelText("Referral fee rate")[1];
    const underflows = [
      `0.${"0".repeat(323)}1`,
      `0.${"0".repeat(323)}5`,
      `-0.${"0".repeat(323)}1`,
    ];
    for (const raw of underflows) {
      fireEvent.change(rate, { target: { value: raw } });
      expect(rate).toHaveValue(raw);
      expect(rate).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Percentage is too small to represent safely.")).toBeVisible();
      const error = screen.getByText("Percentage is too small to represent safely.");
      expect(rate.getAttribute("aria-describedby")).toContain(error.id);
      expect(onReplaceScenario).not.toHaveBeenCalled();
      expect(scenarios[1]).toEqual(original);
    }
  });
  it("accepts explicit zero percentage values, including the documented -0 contract", () => {
    const onReplaceScenario = vi.fn();
    const scenarios = createEconomicScenarios("demo");
    render(<EconomicsEditor scenarios={scenarios} onReplaceScenario={onReplaceScenario} />);
    const rate = screen.getAllByLabelText("Referral fee rate")[1];
    for (const raw of ["0", "0.0", "0.000", "-0"]) {
      fireEvent.change(rate, { target: { value: raw } });
      expect(Object.is(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.referralFeeRate, -0) || onReplaceScenario.mock.calls.at(-1)?.[0].inputs.referralFeeRate === 0).toBe(true);
    }
    expect(onReplaceScenario).toHaveBeenCalledTimes(4);
  });
  it("submits domain-invalid numeric drafts but blocks precision and unsafe drafts", async () => {
    const onReplaceScenario = vi.fn();
    const user = userEvent.setup();
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={onReplaceScenario} />);
    const salePrice = screen.getAllByLabelText("Sale price")[1];
    await user.clear(salePrice);
    await user.type(salePrice, "-2");
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.salePriceCents).toBe(-200);
    const rate = screen.getAllByLabelText("Referral fee rate")[1];
    await user.clear(rate);
    await user.type(rate, "120");
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.referralFeeRate).toBe(1.2);
    const otherCost = screen.getAllByLabelText("Other cost")[1];
    fireEvent.change(otherCost, { target: { value: "" } });
    const callsAfterEmpty = onReplaceScenario.mock.calls.length;
    fireEvent.change(otherCost, { target: { value: "19.999" } });
    expect(screen.getByText(/at most two decimal places/i)).toBeVisible();
    expect(onReplaceScenario).toHaveBeenCalledTimes(callsAfterEmpty);
    fireEvent.change(otherCost, { target: { value: "1e309" } });
    expect(screen.getByText(/finite dollar amount|safe cents/i)).toBeVisible();
    expect(onReplaceScenario).toHaveBeenCalledTimes(callsAfterEmpty);
  });


});
