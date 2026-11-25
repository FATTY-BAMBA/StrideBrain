"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { readQuotePrices } from "@/modules/price-list/request";
import type { PriceReadOutcome } from "@/modules/price-list/application/read-price-list";
import type { QuoteDocumentLine } from "@/modules/quote-draft/domain/document-input";
import type { Locale } from "@/modules/localization/config";
import { priceListCopy } from "@/modules/localization/price-list";
import { Button } from "@/components/ui/button";
import { PriceSource } from "./price-source";
import { PriceHistory } from "./price-history";
import { revealQuoteSuggestions } from "./suggestion-visibility";
import styles from "./price-list.module.css";
type Item = Extract<QuoteDocumentLine, { kind: "ITEM" }>;
export function QuoteItemDescription({
  line,
  projectKey,
  locale,
  label,
  disabled,
  editable,
  onChange,
  renderRow,
}: {
  line: Item;
  projectKey: string;
  locale: Locale;
  label: string;
  disabled: boolean;
  editable: boolean;
  onChange: (line: Item) => void;
  renderRow: (description: ReactNode) => ReactNode;
}) {
  const c = priceListCopy(locale),
    id = useId(),
    container = useRef<HTMLDivElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    suggestions = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false),
    [composing, setComposing] = useState(false),
    [loaded, setLoaded] = useState<{ key: string; result: PriceReadOutcome } | null>(null);
  const key = JSON.stringify([line.description, projectKey, locale]);
  const searching =
    active && editable && !disabled && [...line.description.normalize("NFKC").trim()].length >= 2;
  useEffect(() => {
    if (!searching || composing) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      readQuotePrices(
        locale,
        {
          mode: "SUGGEST",
          search: line.description,
          unit: "",
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
    }, 250);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searching, composing, line.description, projectKey, locale, key]);
  const result = loaded?.key === key ? loaded.result : null;
  useEffect(() => {
    const panel = suggestions.current;
    const scroll = panel?.closest<HTMLElement>("[data-quote-scroll]");
    if (!panel || !scroll) return;
    const reveal = () => revealQuoteSuggestions(panel);
    reveal();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(reveal);
    observer?.observe(scroll);
    observer?.observe(panel);
    window.addEventListener("resize", reveal);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", reveal);
    };
  }, [searching, result]);
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (
      !container.current?.contains(event.relatedTarget) &&
      !suggestions.current?.contains(event.relatedTarget)
    )
      setActive(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (composing || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === "Escape") {
      input.current?.focus();
      setActive(false);
      event.stopPropagation();
    }
    if (
      event.key === "ArrowDown" &&
      event.target === input.current &&
      input.current?.selectionStart === line.description.length &&
      input.current.selectionEnd === line.description.length
    ) {
      const first =
        suggestions.current?.querySelector<HTMLButtonElement>("[data-price-suggestion]");
      if (editable && !disabled && [...line.description.normalize("NFKC").trim()].length >= 2) {
        event.preventDefault();
        if (first) first.focus();
        else {
          setLoaded(null);
          setActive(true);
        }
      }
    }
  };
  const description = (
    <div ref={container} onBlur={onBlur} onKeyDown={onKeyDown}>
      <textarea
        ref={input}
        aria-label={label}
        aria-describedby={searching ? id : undefined}
        required
        rows={2}
        maxLength={500}
        value={line.description}
        disabled={disabled}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={(event) => {
          onChange({ ...line, description: event.currentTarget.value });
          setComposing(false);
          setActive(true);
        }}
        onChange={(event) => {
          onChange({ ...line, description: event.target.value });
          if (!composing) setActive(true);
        }}
      />
      <PriceHistory
        description={line.description}
        unit={line.unit}
        locale={locale}
        projectKey={projectKey}
        label={label}
        suspended={composing}
        disabled={editable && disabled}
        onUse={editable ? (price) => onChange({ ...line, unitPrice: price.unitPrice }) : undefined}
      />
    </div>
  );
  return (
    <>
      {renderRow(description)}
      {searching && (
        <tr className={styles.suggestionRow} onBlur={onBlur} onKeyDown={onKeyDown}>
          <td colSpan={7} className={styles.suggestionCell}>
            <div ref={suggestions} id={id} className={`${styles.results} ${styles.suggestions}`}>
              <p>{c.suggestions}</p>
              {!result ? (
                <p role="status">{c.loading}</p>
              ) : result.kind !== "AVAILABLE" ? (
                <p role="status">{c.unavailable}</p>
              ) : !result.rows.length ? (
                <p role="status">{c.empty}</p>
              ) : (
                <ul>
                  {result.rows.map((price) => (
                    <li key={`${price.description}-${price.unit}`}>
                      <Button
                        data-price-suggestion
                        variant="quiet"
                        onClick={() => {
                          onChange({
                            ...line,
                            description: price.description,
                            unit: price.unit,
                            unitPrice: price.unitPrice,
                          });
                          input.current?.focus();
                          setActive(false);
                        }}
                        aria-label={`${c.choose} · ${price.description} · ${price.unit}`}
                      >
                        {price.description} · {price.unit}
                      </Button>
                      <PriceSource price={price} locale={locale} />
                      <span>
                        {price.issuedOn} · {price.clientName}
                      </span>
                      {price.clientPrice && (
                        <div>
                          <span>{c.clientLast}</span>
                          <PriceSource price={price.clientPrice} locale={locale} />
                          <span>{price.clientPrice.issuedOn}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
