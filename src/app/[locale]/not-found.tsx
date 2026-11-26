"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import styles from "@/components/ui/ui.module.css";
export default function NotFound() {
  const locale = useParams<{ locale: string }>().locale === "en" ? "en" : "zh-TW";
  return (
    <div className={styles.page}>
      <PageHeader
        context="StrideBrain"
        title={locale === "en" ? "Page not found" : "找不到頁面"}
        description={locale === "en" ? "This page is unavailable." : "目前無法開啟此頁面。"}
      />
      <div>
        <Link className={`${styles.button} ${styles.primary}`} href={`/${locale}`}>
          {locale === "en" ? "Back to Home" : "返回首頁"}
        </Link>
      </div>
    </div>
  );
}
