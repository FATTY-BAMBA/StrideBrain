"use client";
import { useParams } from "next/navigation";
import { isSupportedLocale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
import ui from "@/components/ui/ui.module.css";
export default function PricesLoading() {
  const params = useParams<{ locale?: string }>();
  const locale = isSupportedLocale(params.locale ?? "")
    ? (params.locale as "en" | "zh-TW")
    : "zh-TW";
  return (
    <div className={ui.page} role="status" aria-busy="true">
      {priceListCopy(locale).loading}
    </div>
  );
}
