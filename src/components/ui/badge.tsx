import type { QuoteListStatus } from "@/modules/quotes/domain/quote-list";
import type { Locale } from "@/modules/localization/config";
import { quoteListCopy } from "@/modules/localization/quote-list";
import styles from "./ui.module.css";
const variants: Record<QuoteListStatus, string> = {
  DRAFT: "draft",
  INTERNAL_REVIEW: "review",
  ISSUED: "issued",
  ACCEPTED: "accepted",
  FINAL: "final",
};
export function Badge({ status, locale }: { status: QuoteListStatus; locale: Locale }) {
  return (
    <span className={`${styles.badge} ${styles[variants[status]!]}`} data-status={status}>
      {quoteListCopy(locale)[status]}
    </span>
  );
}
