"use client";
import { useState, useTransition } from "react";
import { updateClientAction } from "@/app/[locale]/clients/actions";
import { CLIENT_DETAIL_FIELDS, type ClientErrors } from "@/modules/clients/domain/client-input";
import type { ClientRecord } from "@/repositories/ports/client-repository";
import type { Locale } from "@/modules/localization/config";
import { clientRecordsCopy } from "@/modules/localization/client-records";
import { CLIENT_TYPES } from "@/modules/projects/domain/job-input";
export function ClientDetailsForm({
  client,
  canEdit,
  locale,
}: {
  client: ClientRecord;
  canEdit: boolean;
  locale: Locale;
}) {
  const c = clientRecordsCopy(locale),
    [values, setValues] = useState(client),
    [errors, setErrors] = useState<ClientErrors>({}),
    [pending, start] = useTransition(),
    [message, setMessage] = useState(""),
    [key, setKey] = useState(() => crypto.randomUUID());
  const limits = {
    nameEn: 200,
    nameZhTw: 200,
    clientType: 128,
    contactPerson: 200,
    phone: 80,
    email: 254,
    address: 1000,
    taxId: 8,
    note: 4000,
  };
  return (
    <section className="records-panel">
      <h2>{c.details}</h2>
      <p>
        {c.reference}：{client.businessKey}
      </p>
      {!canEdit && <p>{c.readonly}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const input = {
              ...Object.fromEntries(CLIENT_DETAIL_FIELDS.map((field) => [field, values[field]])),
              businessKey: client.businessKey,
              expectedUpdatedAt: values.updatedAt,
              idempotencyKey: key,
            };
            const result = await updateClientAction(locale, input);
            setMessage(c[result.kind]);
            setErrors(result.kind === "INVALID" ? result.errors : {});
            if (result.kind === "SAVED") {
              setValues((v) => ({ ...v, updatedAt: result.updatedAt }));
              setKey(crypto.randomUUID());
            }
          });
        }}
        aria-busy={pending}
      >
        <div className="records-fields">
          {CLIENT_DETAIL_FIELDS.map((field) => {
            const optional = !["nameEn", "nameZhTw", "clientType"].includes(field);
            const common = {
              id: `client-${field}`,
              name: field,
              value: values[field],
              disabled: pending || !canEdit,
              "aria-invalid": !!errors[field],
              "aria-describedby": errors[field] ? `client-error-${field}` : undefined,
              onChange: (e: { target: { value: string } }) =>
                setValues((v) => ({ ...v, [field]: e.target.value })),
            };
            return (
              <div key={field}>
                <label htmlFor={common.id}>
                  {c[field]}
                  {optional ? ` (${c.optional})` : ""}
                </label>
                {field === "clientType" ? (
                  <select {...common}>
                    {CLIENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {c[type]}
                      </option>
                    ))}
                  </select>
                ) : field === "address" || field === "note" ? (
                  <textarea {...common} maxLength={limits[field]} />
                ) : (
                  <input
                    {...common}
                    required={!optional}
                    type={field === "email" ? "email" : "text"}
                    inputMode={field === "taxId" ? "numeric" : undefined}
                    maxLength={limits[field]}
                  />
                )}
                {errors[field] && (
                  <small id={`client-error-${field}`} role="alert">
                    {field === "taxId" ? c.taxError : c[errors[field]!]}
                  </small>
                )}
              </div>
            );
          })}
        </div>
        {message && <p role="status">{message}</p>}
        {canEdit && <button disabled={pending}>{pending ? c.saving : c.save}</button>}
      </form>
    </section>
  );
}
