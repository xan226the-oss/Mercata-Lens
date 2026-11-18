import type { ReactElement } from "react";
import type { DecisionReport } from "../domain/decision";
import type { RankingResult } from "../domain/opportunities";
import { useLanguage } from "../app/LanguageContext";
/**
 * Bounded decision status display (continue / insufficient / pause).
 * 2026-11-18 (usability P0-4): added an explicit "not a purchase advice"
 * boundary banner plus sample caliber (review count / observation window)
 * after 3/10 test participants misread "continue research" as approval to
 * buy stock, and one participant asked which data the conclusion rests on.
 * Documentation pass 2026-11-12.
 */


const STATUS_COPY = {
  continue_research: { label: "Continue research", tone: "continue", description: "Current evidence supports another validation step; it does not establish a commercial conclusion." },
  insufficient_evidence: { label: "Insufficient evidence", tone: "insufficient", description: "A required evidence gate is incomplete or blocked. Do not treat this report as a definitive result." },
  pause: { label: "Pause", tone: "pause", description: "An explicit user-authored stop condition was triggered. Review the condition and decide what evidence is needed next." },
} as const;

const STATUS_COPY_ZH = {
  continue_research: { label: "继续研究", description: "当前证据支持进行下一步验证，不构成任何商业结论。" },
  insufficient_evidence: { label: "证据不足", description: "某个必要证据环节未完成或被阻断。不要把本报告当作确定性结果。" },
  pause: { label: "暂缓", description: "触发了你自行填写的停止条件。请复核该条件，并决定下一步需要哪些证据。" },
} as const;

function rankingLabel(ranking: RankingResult): string {
  if (ranking.status === "winner") return `Leading hypothesis in the configured comparison: ${ranking.winnerId}`;
  if (ranking.status === "no_clear_winner") return "No clear winner under the current-session weights";
  return "Ranking incomplete";
}

export interface DecisionStatusProps {
  report: DecisionReport;
  /** Sample caliber shown next to the status so readers know what the conclusion rests on. */
  sampleCaliber?: { reviewCount: number; productCount: number; observedAt: string } | null;
}

export function DecisionStatus({ report, sampleCaliber }: DecisionStatusProps): ReactElement {
  const { language } = useLanguage();
  const zh = language === "zh";
  const copy = STATUS_COPY[report.status];
  const copyZh = STATUS_COPY_ZH[report.status];
  return (
    <section className={`decision-status decision-status--${copy.tone}`} aria-labelledby="decision-status-title" data-testid="decision-status" role={report.status === "insufficient_evidence" ? "alert" : "status"}>
      <span className="section-kicker">{zh ? "决策状态" : "Decision status"}</span>
      <h2 id="decision-status-title">{zh ? copyZh.label : copy.label}</h2>
      <p>{zh ? copyZh.description : copy.description}</p>
      <p className="decision-status__boundary" data-testid="decision-status-boundary">
        {zh
          ? "⚠ 本结论不是进货、采购或囤货建议。无论显示哪种状态，都只针对当前样本，且必须先完成下方验证计划。"
          : "⚠ This is not advice to purchase, stock, or order. Whatever the status, it applies to the current sample only and the validation plan below must be completed first."}
      </p>
      {sampleCaliber ? (
        <p className="decision-status__caliber" data-testid="decision-status-caliber">
          {zh
            ? `数据口径：基于当前样本 ${sampleCaliber.productCount} 件商品、${sampleCaliber.reviewCount} 条评论；观测日期 ${sampleCaliber.observedAt}。`
            : `Data caliber: based on ${sampleCaliber.productCount} products and ${sampleCaliber.reviewCount} reviews in the current sample; observed ${sampleCaliber.observedAt}.`}
        </p>
      ) : null}
      <p className="decision-status__ranking"><strong>{zh ? "机会比较：" : "Ranking:"}</strong> {rankingLabel(report.ranking)}</p>
      {report.triggeredStopConditions.length > 0 ? (
        <div className="decision-status__trigger" data-testid="triggered-stop-conditions">
          <strong>{zh ? "已触发的停止条件" : "Triggered stop condition"}</strong>
          <ul>{report.triggeredStopConditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}
