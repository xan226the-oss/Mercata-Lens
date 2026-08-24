import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeightEditor } from "./WeightEditor";

const weights = { demand: 30, supply_gap: 25, economics: 20, differentiation: 15, risk: 10 } as const;

describe("WeightEditor", () => {
  it("renders five labeled numeric controls and the current total", () => {
    render(<WeightEditor weights={weights} onReplaceWeights={() => true} onReset={() => undefined} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(5);
    expect(screen.getByLabelText("Demand weight")).toHaveValue("30");
    expect(screen.getByTestId("weight-total")).toHaveTextContent("100");
  });

  it("keeps invalid raw drafts visible, associates the error, and restores defaults", async () => {
    const user = userEvent.setup();
    const onReplaceWeights = vi.fn(() => true);
    render(<WeightEditor weights={weights} onReplaceWeights={onReplaceWeights} onReset={() => undefined} />);
    const demand = screen.getByLabelText("Demand weight");
    await user.clear(demand);
    await user.type(demand, "oops");
    expect(demand).toHaveValue("oops");
    expect(demand).toHaveAttribute("aria-invalid", "true");
    expect(demand.getAttribute("aria-describedby")).toContain("weight-error-demand");
    expect(onReplaceWeights).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Restore defaults" }));
    expect(screen.getByLabelText("Demand weight")).toHaveValue("30");
  });

  it("restores defaults after a custom valid weight replacement", async () => {
    const user = userEvent.setup();
    const onReplaceWeights = vi.fn(() => true);
    const onReset = vi.fn();
    render(<WeightEditor weights={weights} onReplaceWeights={onReplaceWeights} onReset={onReset} />);
    const demand = screen.getByLabelText("Demand weight");
    await user.clear(demand);
    await user.type(demand, "40");
    const supply = screen.getByLabelText("Supply gap weight");
    await user.clear(supply);
    await user.type(supply, "15");
    expect(onReplaceWeights).toHaveBeenLastCalledWith({ demand: 40, supply_gap: 15, economics: 20, differentiation: 15, risk: 10 });
    await user.click(screen.getByRole("button", { name: "Restore defaults" }));
    expect(onReset).toHaveBeenCalled();
    expect(screen.getByLabelText("Demand weight")).toHaveValue("30");
    expect(screen.getByLabelText("Supply gap weight")).toHaveValue("25");
  });
  it("supports keyboard editing and valid fractional totals", async () => {
    const user = userEvent.setup();
    const onReplaceWeights = vi.fn(() => true);
    render(<WeightEditor weights={weights} onReplaceWeights={onReplaceWeights} onReset={() => undefined} />);
    const demand = screen.getByLabelText("Demand weight");
    await user.clear(demand);
    await user.type(demand, "30.5");
    const supply = screen.getByLabelText("Supply gap weight");
    await user.clear(supply);
    await user.type(supply, "24.5");
    expect(screen.getByTestId("weight-total")).toHaveTextContent("100");
    expect(onReplaceWeights).toHaveBeenCalledWith({ demand: 30.5, supply_gap: 24.5, economics: 20, differentiation: 15, risk: 10 });
  });
});
