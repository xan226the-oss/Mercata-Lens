/**
 * Accessible status banner. Blocking errors use role="alert";
 * warnings and neutral status use role="status" with readable text.
 */
import type { ReactNode } from "react";

export type StatusBannerTone = "error" | "warning" | "info" | "success";

interface StatusBannerProps {
  tone: StatusBannerTone;
  /** Readable text shown to users and assistive tech. */
  text: string;
  icon?: string;
  children?: ReactNode;
  "data-testid"?: string;
}

const TONE_LABEL: Record<StatusBannerTone, string> = {
  error: "Blocking error",
  warning: "Warning",
  info: "Notice",
  success: "Success",
};

export function StatusBanner({ tone, text, icon, children, "data-testid": testId }: StatusBannerProps) {
  const isError = tone === "error";
  return (
    <div
      className={`status-banner status-banner--${tone}`}
      role={isError ? "alert" : "status"}
      data-testid={testId ?? `status-banner-${tone}`}
    >
      <span className="status-banner__icon" aria-hidden="true">
        {icon ?? (isError ? "⛔" : tone === "warning" ? "⚠" : "ℹ")}
      </span>
      <span className="status-banner__label">{TONE_LABEL[tone]}:</span>{" "}
      <span className="status-banner__text">{text}</span>
      {children ? <div className="status-banner__body">{children}</div> : null}
    </div>
  );
}