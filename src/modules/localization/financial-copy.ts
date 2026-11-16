import type { AuthorityState, ObservationType } from "@/modules/projects/domain/project-workspace";
import type { Locale } from "@/modules/localization/config";

const en = {
  observations: {
    QUOTED_PRICE: "Quoted price",
    SUPPLIER_OFFER: "Supplier offer",
    FORECAST_DIRECT_COST: "Forecast direct cost",
    RECONCILED_ACTUAL_COST: "Reconciled actual cost",
  },
  authorities: {
    OBSERVED: "Observed",
    HUMAN_REVIEWED: "Human reviewed",
    APPROVED_COMMERCIAL: "Approved commercial",
    RECONCILED_ACTUAL: "Reconciled actual",
    SUPERSEDED: "Superseded",
    CONFLICTED: "Conflicted",
  },
};
const zhTw = {
  observations: {
    QUOTED_PRICE: "報價",
    SUPPLIER_OFFER: "供應商報價",
    FORECAST_DIRECT_COST: "預估直接成本",
    RECONCILED_ACTUAL_COST: "已核對實際成本",
  },
  authorities: {
    OBSERVED: "已擷取",
    HUMAN_REVIEWED: "已人工檢視",
    APPROVED_COMMERCIAL: "已核准商務紀錄",
    RECONCILED_ACTUAL: "已核對實際紀錄",
    SUPERSEDED: "已由新版取代",
    CONFLICTED: "資料不一致",
  },
};

export function getFinancialCopy(locale: Locale): Readonly<{
  observations: Readonly<Record<ObservationType, string>>;
  authorities: Readonly<Record<AuthorityState, string>>;
}> {
  return locale === "zh-TW" ? zhTw : en;
}
