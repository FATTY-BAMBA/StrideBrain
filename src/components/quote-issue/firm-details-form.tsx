"use client";
import { useState, useTransition } from "react";
import { quoteIssueMutationAction } from "@/app/[locale]/projects/[projectKey]/quote/issue-actions";
import type { FirmDetails } from "@/modules/quote-issue/domain/contracts";
import type { Locale } from "@/modules/localization/config";
import { quoteIssueCopy } from "@/modules/localization/quote-issue";
import styles from "./quote-issue.module.css";
const fields = [
  "legalNameZhTw",
  "taxId",
  "addressZhTw",
  "phone",
  "email",
  "defaultValidityDays",
  "termsZhTw",
  "legalNameEn",
  "addressEn",
  "termsEn",
] as const;
export function FirmDetailsForm({
  locale,
  details,
  canManage,
}: {
  locale: Locale;
  details: FirmDetails;
  canManage: boolean;
}) {
  const copy = quoteIssueCopy(locale),
    [values, setValues] = useState(details),
    [pending, start] = useTransition();
  const [message, setMessage] = useState(""),
    [key, setKey] = useState(() => crypto.randomUUID());
  return (
    <section className={styles.section} aria-busy={pending}>
      <h2>{copy.firm}</h2>
      {!canManage && <p>{copy.readonly}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            const result = await quoteIssueMutationAction(locale, "saveFirm", {
              details: values,
              idempotencyKey: key,
            });
            setMessage(copy[result.kind]);
            if (result.kind === "SETTINGS_SAVED") setKey(crypto.randomUUID());
          });
        }}
      >
        <div className={styles.fields}>
          {fields.map((field) => (
            <label key={field}>
              {copy[field]}
              {field.startsWith("terms") || field.startsWith("address") ? (
                <textarea
                  value={values[field]}
                  disabled={!canManage || pending}
                  maxLength={field.startsWith("terms") ? 10000 : 500}
                  onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                />
              ) : (
                <input
                  value={values[field]}
                  disabled={!canManage || pending}
                  type={
                    field === "defaultValidityDays"
                      ? "number"
                      : field === "email"
                        ? "email"
                        : "text"
                  }
                  min={1}
                  max={365}
                  maxLength={
                    field === "taxId" ? 8 : field === "phone" ? 80 : field === "email" ? 254 : 200
                  }
                  inputMode={field === "taxId" ? "numeric" : undefined}
                  onChange={(event) =>
                    setValues({
                      ...values,
                      [field]:
                        field === "defaultValidityDays"
                          ? Number(event.target.value)
                          : event.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}
        </div>
        {message && (
          <p role="status" className={styles.notice}>
            {message}
          </p>
        )}
        {canManage && (
          <button className={`${styles.button} ${styles.primary}`} disabled={pending}>
            {pending ? copy.pending : copy.saveFirm}
          </button>
        )}
      </form>
    </section>
  );
}
