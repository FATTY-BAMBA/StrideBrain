"use client";

import type { Route } from "next";
import Link from "next/link";
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
    <nav
      className="project-local-nav"
      aria-label={locale === "zh-TW" ? "專案工作區導覽" : "Project workspace navigation"}
    >
      {projectNavigation.map((item) => {
        const href = projectSurfaceHref(locale, projectKey, item);
        const isActive = item.segment ? pathname === href : pathname === href;

        return (
          <Link
            key={item.key}
            href={href as Route}
            aria-current={isActive ? "page" : undefined}
          >
            {labels[item.labelKey as keyof typeof labels]}
          </Link>
        );
      })}
    </nav>
  );
}
