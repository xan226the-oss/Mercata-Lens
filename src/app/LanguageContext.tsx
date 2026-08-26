import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "zh";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage: () => setLanguage((current) => current === "en" ? "zh" : "en") }),
    [language],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const defaultLanguageValue: LanguageContextValue = {
  language: "en",
  setLanguage: () => undefined,
  toggleLanguage: () => undefined,
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? defaultLanguageValue;
}

export const LANGUAGE_COPY = {
  en: {
    brandCn: "商机镜",
    market: "US market",
    category: "Cat Water Fountain",
    demoData: "Demo data",
    userUpload: "User upload",
    loadingData: "Loading data",
    noActiveData: "No active data",
    evidenceRule: "Review count is not sales",
    localResearch: "Local, free, evidence-driven research.",
    languageLabel: "中文",
    languageAria: "Switch language",
    nav: ["Research project", "Data quality", "Category overview", "Customer pain points", "Opportunity comparison", "Decision & validation plan"],
  },
  zh: {
    brandCn: "商机镜",
    market: "美国市场",
    category: "猫咪饮水机",
    demoData: "演示数据",
    userUpload: "用户上传",
    loadingData: "数据加载中",
    noActiveData: "暂无有效数据",
    evidenceRule: "评论数量不等于销量",
    localResearch: "本地、免费、以证据为基础的研究。",
    languageLabel: "English",
    languageAria: "切换语言",
    nav: ["研究项目", "数据质量", "品类概览", "客户痛点", "商机比较", "决策与验证计划"],
  },
} as const;

export function copyFor(language: Language) {
  return LANGUAGE_COPY[language];
}
