"use client";
import { useParams } from "next/navigation";
import { NotFoundContent } from "@/components/ui/not-found-content";
export default function NotFound() {
  const locale = useParams<{ locale: string }>().locale === "en" ? "en" : "zh-TW";
  return <NotFoundContent locale={locale} />;
}
