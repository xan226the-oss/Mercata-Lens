import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(/Enter a non-negative dollar amount/)).toBeVisible();

    await user.clear(salePrice);
    expect(salePrice).toHaveValue("");
    expect(onReplaceScenario).toHaveBeenCalled();
    const latest = onReplaceScenario.mock.calls.at(-1)?.[0];
    expect(latest.inputs.salePriceCents).toBeNull();
  });
});
