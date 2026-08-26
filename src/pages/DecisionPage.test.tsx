import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import { ResearchProvider, useResearch } from "../research/ResearchContext";
import { DecisionPage } from "./DecisionPage";

const demoDir = path.resolve(__dirname, "../../public/demo");
const productsCsv = fs.readFileSync(path.join(demoDir, "products.csv"), "utf8");
const reviewsCsv = fs.readFileSync(path.join(demoDir, "reviews.csv"), "utf8");

function stubDemoFetch() {
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/demo/products.csv")) return Promise.resolve(new Response(productsCsv, { status: 200 }));
    if (url.endsWith("/demo/reviews.csv")) return Promise.resolve(new Response(reviewsCsv, { status: 200 }));
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as unknown as typeof fetch);
}

beforeEach(() => stubDemoFetch());
afterEach(() => vi.unstubAllGlobals());

function ContextHarness() {
  const research = useResearch();
  return (
    <div>
      <button type="button" onClick={() => research.replaceOpportunityWeights({ demand: 20, supply_gap: 35, economics: 20, differentiation: 15, risk: 10 })}>Set no-clear-winner weights</button>
      <button type="button" onClick={() => research.replaceDecisionConditions({
        continueConditions: ["Continue with traceable evidence"],
        pauseConditions: ["Pause for human review"],
        stopConditions: ["Stop when the evidence gate fails"],
      })}>Set harness conditions</button>
      <button type="button" onClick={() => research.importCsv("invalid", "invalid")}>Import invalid from harness</button>
      <button type="button" onClick={() => research.importCsv(productsCsv, reviewsCsv)}>Import valid from harness</button>
      <button type="button" onClick={() => research.loadDemo()}>Reload Demo from harness</button>
    </div>
  );
}

function renderDecision(withHarness = false) {
  return render(
    <MemoryRouter initialEntries={["/decision"]}>
      <ResearchProvider>
        {withHarness ? <ContextHarness /> : null}
        <DecisionPage />
      </ResearchProvider>
    </MemoryRouter>,
  );
}

describe("DecisionPage", () => {
  it("renders the bounded report route without fabricating data", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)) as unknown as typeof fetch);
    renderDecision();
    expect(screen.getByTestId("decision-no-data")).toHaveTextContent("No active research data is available");
  });

  it("renders the real Demo report with an exact ranking state and bounded claims", async () => {
    renderDecision();
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    expect(screen.getByRole("heading", { name: "Continue research" })).toBeVisible();
    expect(screen.getByText(/Leading hypothesis in the configured comparison: easy_clean/)).toBeVisible();
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByTestId("decision-limitations")).toHaveTextContent("Review counts and pain-point evidence do not establish sales");
    expect(screen.getByText(/sales, demand, market-share, sourcing, pricing, launch, or purchase recommendation/i)).toBeVisible();
    expect(screen.queryByText(/market share is established/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/purchase advice is available/i)).not.toBeInTheDocument();
  });

  it("renders a real no-clear-winner report without fabricating a winner", async () => {
    const user = userEvent.setup();
    renderDecision(true);
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Set no-clear-winner weights" }));
    expect(screen.getByTestId("decision-status")).toHaveTextContent("Continue research");
    expect(screen.getByTestId("decision-status")).toHaveTextContent("No clear winner");
    expect(screen.getByText("Collect discriminating evidence to resolve the opportunity tie.")).toBeVisible();
    expect(screen.queryByText(/Leading hypothesis in the configured comparison:/)).not.toBeInTheDocument();
  });

  it("pauses only for an explicitly selected exact stop condition", async () => {
    const user = userEvent.setup();
    renderDecision();
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    const stop = screen.getByLabelText("Stop conditions");
    await user.clear(stop);
    await user.type(stop, "Stop when the evidence gate fails");
    await user.click(screen.getByLabelText("Stop when the evidence gate fails"));
    expect(screen.getByRole("heading", { name: "Pause" })).toBeVisible();
    await user.click(screen.getByLabelText("Stop when the evidence gate fails"));
    expect(screen.getByRole("heading", { name: "Continue research" })).toBeVisible();
    await user.clear(stop);
    await user.type(stop, "stop when the evidence gate fails");
    expect(screen.getByRole("heading", { name: "Continue research" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Pause" })).not.toBeInTheDocument();
  });

  it("resolves review, economics, assumption, and opposition evidence in the stable focus region", async () => {
    const user = userEvent.setup();
    renderDecision();
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    const evidenceButtons = screen.getAllByRole("button");
    const reviewButton = evidenceButtons.find((button) => button.textContent?.startsWith("review:"));
    const economicsButton = evidenceButtons.find((button) => button.textContent?.startsWith("economics:"));
    const assumptionButton = evidenceButtons.find((button) => button.textContent?.startsWith("assumption:"));
    expect(reviewButton).toBeDefined();
    expect(economicsButton).toBeDefined();
    expect(assumptionButton).toBeDefined();
    await user.click(reviewButton!);
    expect(screen.getByTestId("decision-selected-evidence")).toHaveTextContent("Hard to clean.");
    await user.click(economicsButton!);
    expect(screen.getByTestId("decision-selected-evidence")).toHaveTextContent("Named current-session scenario inputs");
    await user.click(assumptionButton!);
    expect(screen.getByTestId("decision-selected-evidence")).toHaveTextContent("kind: assumption");
    const oppositionHeading = screen.getByRole("heading", { name: "Opposition evidence" });
    const oppositionSection = oppositionHeading.closest("section");
    expect(oppositionSection).not.toBeNull();
    const oppositionButton = oppositionSection!.querySelector("button");
    expect(oppositionButton).not.toBeNull();
    await user.click(oppositionButton!);
    expect(screen.getByTestId("decision-selected-evidence")).toHaveTextContent("kind: assumption");
  });

  it("shows insufficient evidence for a real user-upload replacement and clears it on Demo reload", async () => {
    const user = userEvent.setup();
    renderDecision(true);
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Import valid from harness" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Insufficient evidence" })).toBeVisible());
    expect(screen.getByTestId("decision-missing-data")).toHaveTextContent("Complete the opportunity ranking inputs");
    await user.click(screen.getByRole("button", { name: "Reload Demo from harness" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Continue research" })).toBeVisible());
  });

  it("keeps conditions after failed import and clears them after successful replacement", async () => {
    const user = userEvent.setup();
    renderDecision(true);
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Set harness conditions" }));
    expect(screen.getByTestId("decision-conditions-summary")).toHaveTextContent("Continue with traceable evidence");
    await user.click(screen.getByRole("button", { name: "Import invalid from harness" }));
    expect(screen.getByTestId("decision-conditions-summary")).toHaveTextContent("Stop when the evidence gate fails");
    await user.click(screen.getByRole("button", { name: "Import valid from harness" }));
    await waitFor(() => expect(screen.getByTestId("decision-conditions-summary")).toHaveTextContent("None recorded."));
  });

  it("clears conditions, triggered stop, selected evidence, and restores Demo after reload", async () => {
    const user = userEvent.setup();
    renderDecision(true);
    await waitFor(() => expect(screen.getByTestId("decision-status")).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Set harness conditions" }));
    await user.click(screen.getByLabelText("Stop when the evidence gate fails"));
    expect(screen.getByRole("heading", { name: "Pause" })).toBeVisible();
    const reviewButton = screen.getAllByRole("button").find((button) => button.textContent?.startsWith("review:"));
    expect(reviewButton).toBeDefined();
    await user.click(reviewButton!);
    expect(screen.getByTestId("decision-selected-evidence")).not.toHaveTextContent("Select an evidence reference");
    await user.click(screen.getByRole("button", { name: "Reload Demo from harness" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Continue research" })).toBeVisible());
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByTestId("decision-conditions-summary")).toHaveTextContent("None recorded.");
    expect(screen.getByTestId("decision-selected-evidence")).toHaveTextContent("Select an evidence reference to inspect its source or calculation explanation.");
    expect(screen.queryByTestId("triggered-stop-conditions")).not.toBeInTheDocument();
  });
});
