import type { ReactElement } from "react";
import type { ParseIssue } from "../domain/types";

interface IssueTableProps {
  issues: ParseIssue[];
  caption: string;
}

const COLUMNS = ["File", "Row", "Field", "Bad value", "Reason"] as const;

type Column = (typeof COLUMNS)[number];

function displayFile(file: ParseIssue["file"]): string {
  return file === "products" ? "Products" : file === "reviews" ? "Reviews" : "Unknown";
}

function displayValue(value: unknown): string {
  return value === undefined ? "—" : JSON.stringify(value);
}

function cellsForIssue(issue: ParseIssue): Record<Column, string> {
  return {
    File: displayFile(issue.file),
    Row: String(issue.row),
    Field: issue.field,
    "Bad value": displayValue(issue.value),
    Reason: issue.message,
  };
}

export function IssueTable({ issues, caption }: IssueTableProps): ReactElement {
  return (
    <div className="issue-table-wrap">
      <table className="issue-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => {
            const cells = cellsForIssue(issue);
            return (
              <tr data-testid="issue-row" key={`${issue.file ?? "unknown"}-${issue.row}-${issue.field}-${index}`}>
                {COLUMNS.map((column) => (
                  <td data-label={column} key={column}>{cells[column]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
