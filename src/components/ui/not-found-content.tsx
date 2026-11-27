import Link from "next/link";
import type { Locale } from "@/modules/localization/config";
import { designSystemCopy } from "@/modules/localization/design-system";
import { PageHeader } from "./page-header";
import styles from "./ui.module.css";
export function NotFoundContent({ locale }: { locale: Locale }) {
  const copy = designSystemCopy(locale);
  return (
    <div className={styles.page}>
      <PageHeader context="StrideBrain" title={copy.notFound} description={copy.unavailable} />
      <div>
        <Link className={`${styles.button} ${styles.primary}`} href={`/${locale}`}>
          {copy.home}
        </Link>
      </div>
    </div>
  );
}
