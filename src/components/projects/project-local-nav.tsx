"use client";

import type { Route } from "next";
import { Tabs } from "@/components/ui/tabs";
import { usePathname } from "next/navigation";

import type { Catalog } from "@/modules/localization/catalog";
import type { Locale } from "@/modules/localization/config";
import {
  projectNavigation,
  projectSurfaceHref,
  type ProjectSurfaceKey,
} from "@/modules/navigation/project-navigation";

type ProjectLocalNavProps = {
  locale: Locale;
  projectKey: string;
  labels: Pick<Catalog, `nav.${ProjectSurfaceKey}`>;
};

export function ProjectLocalNav({ locale, projectKey, labels }: ProjectLocalNavProps) {
  const pathname = usePathname();

  return (
    <Tabs
      label={locale === "zh-TW" ? "專案工作區導覽" : "Project workspace navigation"}
      items={projectNavigation.map((item) => {
        const href = projectSurfaceHref(locale, projectKey, item);
        return {
          href: href as Route,
          label: labels[item.labelKey as keyof typeof labels],
          active: pathname === href,
        };
      })}
    />
  );
}
