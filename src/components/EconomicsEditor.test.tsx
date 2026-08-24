import { describe, expect, it } from "vitest";
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

  it("keeps malformed and negative drafts visible while emitting empty as null", async () => {
    const onReplaceScenario = vi.fn();
    const user = userEvent.setup();
    render(<EconomicsEditor scenarios={createEconomicScenarios("user_upload")} onReplaceScenario={onReplaceScenario} />);

    const salePrice = screen.getAllByLabelText("Sale price")[0];
    await user.type(salePrice, "oops");
    expect(salePrice).toHaveValue("oops");
    expect(screen.getByText(/Enter a finite dollar amount/)).toBeVisible();

    await user.clear(salePrice);
    expect(salePrice).toHaveValue("");
    expect(onReplaceScenario).toHaveBeenCalled();
    const latest = onReplaceScenario.mock.calls.at(-1)?.[0];
    expect(latest.inputs.salePriceCents).toBeNull();
  });

  it("keeps parseable domain-invalid drafts and unsafe dollars out of the null path", async () => {
    const onReplaceScenario = vi.fn();
    const user = userEvent.setup();
    render(<EconomicsEditor scenarios={createEconomicScenarios("demo")} onReplaceScenario={onReplaceScenario} />);
    const salePrice = screen.getAllByLabelText("Sale price")[1];
    await user.clear(salePrice);
    await user.type(salePrice, "-2");
    expect(salePrice).toHaveValue("-2");
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.salePriceCents).toBe(-200);
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].provenance.salePriceCents?.note).toContain("Current-session");
    const rate = screen.getAllByLabelText("Referral fee rate")[1];
    await user.clear(rate);
    await user.type(rate, "120");
    expect(rate).toHaveValue("120");
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.referralFeeRate).toBe(1.2);
    const huge = screen.getAllByLabelText("Other cost")[1];
    fireEvent.change(huge, { target: { value: "" } });
    const callsAfterClear = onReplaceScenario.mock.calls.length;
    expect(onReplaceScenario.mock.calls.at(-1)?.[0].inputs.otherCostCents).toBeNull();
    fireEvent.change(huge, { target: { value: "1e309" } });
    expect(huge).toHaveValue("1e309");
    expect(screen.getByText(/finite dollar amount|too large|safe cents/i)).toBeVisible();
    expect(onReplaceScenario.mock.calls.slice(callsAfterClear).every(([scenario]) => scenario.inputs.otherCostCents === null)).toBe(true);
  });
});
