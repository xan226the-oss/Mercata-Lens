import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ResearchProvider } from "../research/ResearchContext";
import { DecisionPage } from "./DecisionPage";

describe("DecisionPage", () => {
  it("renders the bounded report route without fabricating data", async () => {
    render(<MemoryRouter initialEntries={["/decision"]}><ResearchProvider><DecisionPage /></ResearchProvider></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Decision & validation plan/i })).toBeInTheDocument());
    expect(screen.getByTestId("decision-no-data")).toHaveTextContent("No active research data is available");
  });
});
