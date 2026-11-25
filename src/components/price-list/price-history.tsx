"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { readQuotePrices } from "@/modules/price-list/request";
import type { PriceReadOutcome } from "@/modules/price-list/application/read-price-list";
import type { QuotedItemPrice } from "@/repositories/ports/price-list-repository";
import type { Locale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
import { Button } from "@/components/ui/button";
import { PriceSource } from "./price-source";
import styles from "./price-list.module.css";
export function PriceHistory({
  description,
  unit,
  locale,
  projectKey = null,
  onUse,
  disabled = false,
  suspended = false,
  label,
}: {
  description: string;
  unit: string;
  locale: Locale;
  projectKey?: string | null;
  onUse?: ((price: QuotedItemPrice) => void) | undefined;
  disabled?: boolean;
  suspended?: boolean;
  label: string;
}) {
  const c = priceListCopy(locale),
    id = useId();
  const [open, setOpen] = useState(false),
    [loaded, setLoaded] = useState<{ key: string; result: PriceReadOutcome } | null>(null);
  const key = JSON.stringify([description, unit, projectKey, locale]);
  useEffect(() => {
    if (!open || suspended) return;
    let cancelled = false;
    const controller = new AbortController();
    readQuotePrices(
      locale,
      {
        mode: "HISTORY",
        search: description,
        unit,
        page: 1,
        projectKey,
      },
      controller.signal,
    )
      .then((result) => {
        if (!cancelled) setLoaded({ key, result });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, result: { kind: "UNAVAILABLE" } });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, suspended, description, unit, projectKey, locale, key]);
  const result = loaded?.key === key ? loaded.result : null;
  return (
    <div className={styles.history}>
      <Button
        variant="quiet"
        disabled={!description.trim() || !unit.trim() || disabled}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open);
          setLoaded(null);
        }}
        aria-label={`${c.history} · ${label}`}
      >
        {c.history}
      </Button>
      {open && (
        <div id={id} className={styles.results}>
          <p>{c.historyHint}</p>
          {!result ? (
            <p role="status">{c.loading}</p>
          ) : result.kind !== "AVAILABLE" ? (
            <p role="status">{c.unavailable}</p>
          ) : !result.rows.length ? (
            <p role="status">{c.empty}</p>
          ) : (
            <ul>
              {result.rows.map((price, index) => (
                <li key={`${price.versionId}-${index}`}>
                  <PriceSource price={price} locale={locale} />
                  <span>
                    {price.issuedOn} · {price.clientName}
                  </span>
                  <Link
                    href={
                      `/${locale}/projects/${encodeURIComponent(price.projectKey)}/quote` as Route
                    }
                  >
                    {price.projectName}
                  </Link>
                  {onUse && (
                    <Button variant="quiet" disabled={disabled} onClick={() => onUse(price)}>
                      {c.usePrice}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
