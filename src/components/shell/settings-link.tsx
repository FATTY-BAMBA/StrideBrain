"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/modules/localization/config";
import { Icon } from "@/components/ui/icons";
export function SettingsLink({ locale, label }: { locale: Locale; label: string }) {
  const path = usePathname(),
    href = `/${locale}/settings` as const;
  return (
    <Link
      href={href}
      aria-current={path === href || path.startsWith(`${href}/`) ? "page" : undefined}
    >
      <Icon name="settings" decorative />
      {label}
    </Link>
  );
}
