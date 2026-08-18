import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DataSourceBadge } from "./DataSourceBadge";

describe("DataSourceBadge", () => {
  it("labels synthetic demo evidence without market claims", () => {
    render(<DataSourceBadge sourceKind="demo" />);
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("Synthetic demo");
    expect(screen.getByText(/synthetic demonstration evidence/i)).toBeVisible();
    expect(screen.getByTestId("analysis-source-badge")).not.toHaveTextContent(/amazon|verified market/i);
  });

  it("labels user uploads and preserves sourcing limitations", () => {
    render(<DataSourceBadge sourceKind="user_upload" />);
    expect(screen.getByTestId("analysis-source-badge")).toHaveTextContent("User upload");
    expect(screen.getByText(/retains its own sourcing limitations/i)).toBeVisible();
    expect(screen.getByTestId("analysis-source-badge")).not.toHaveTextContent(/amazon|verified market/i);
  });
});
