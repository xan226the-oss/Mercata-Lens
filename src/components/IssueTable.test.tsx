import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import type { ParseIssue } from "../domain/types";
import { IssueTable } from "./IssueTable";

const issues: ParseIssue[] = [
  {
    file: "products",
    row: 4,
    field: "rating",
    code: "invalid_type",
    value: "bad",
    message: "Rating must be a plain number.",
  },
  {
    file: "reviews",
    row: 2,
    field: "product_id",
    code: "invalid_format",
    value: "missing",
    message: "Review references an unknown product.",
  },
  {
    file: "products",
    row: 3,
    field: "price_usd",
    code: "out_of_range",
    value: 0,
    message: "Price must be greater than zero.",
  },
];

describe("IssueTable", () => {
  it("renders one accessible table with complete issue details", () => {
    render(<IssueTable issues={issues} caption="Latest import issues" />);

    const table = screen.getByRole("table", { name: "Latest import issues" });
    expect(table).toBeInTheDocument();
    expect(within(table).getByText("Latest import issues")).toBeInTheDocument();
    expect(screen.getAllByTestId("issue-row")).toHaveLength(3);

    for (const heading of ["File", "Row", "Field", "Bad value", "Reason"]) {
      expect(within(table).getByRole("columnheader", { name: heading })).toBeInTheDocument();
    }

    const ratingRow = screen.getAllByTestId("issue-row")[0];
    expect(within(ratingRow).getByText("Products")).toBeInTheDocument();
    expect(within(ratingRow).getByText("4")).toBeInTheDocument();
    expect(within(ratingRow).getByText("rating")).toBeInTheDocument();
    expect(within(ratingRow).getByText('"bad"')).toBeInTheDocument();
    expect(within(ratingRow).getByText("Rating must be a plain number.")).toBeInTheDocument();

    const reviewsRow = screen.getAllByTestId("issue-row")[1];
    expect(within(reviewsRow).getByText("Reviews")).toBeInTheDocument();
    expect(within(reviewsRow).getByText('"missing"')).toBeInTheDocument();
    expect(within(reviewsRow).getByText("Review references an unknown product.")).toBeInTheDocument();

    const zeroRow = screen.getAllByTestId("issue-row")[2];
    expect(within(zeroRow).getByText("0")).toBeInTheDocument();
  });

  it("preserves a visible data label on every cell for narrow layouts", () => {
    render(<IssueTable issues={issues} caption="Latest import issues" />);

    for (const cell of screen.getAllByRole("cell")) {
      expect(cell).toHaveAttribute("data-label");
      expect(["File", "Row", "Field", "Bad value", "Reason"]).toContain(
        cell.getAttribute("data-label"),
      );
    }
  });
});
