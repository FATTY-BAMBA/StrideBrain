"use client";
import { useRef, useState, useTransition } from "react";
import { setAssistantControlAction } from "@/app/[locale]/assistant-actions";
import { assistantCopy } from "@/modules/localization/assistant";
import type { Locale } from "@/modules/localization/config";
export function AssistantControl({
  locale,
  enabled,
  projectKey,
  canManage,
}: {
  locale: Locale;
  enabled: boolean;
  projectKey?: string;
  canManage: boolean;
}) {
  const copy = assistantCopy(locale),
    [value, setValue] = useState(enabled),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition(),
    key = useRef<string | null>(null);
  const label = projectKey ? copy.exclude : copy.enabled;
  if (!canManage)
    return (
      <p>
        {label}
        {locale === "zh-TW" ? "：" : ": "}
        {enabled ? copy.on : copy.off}
      </p>
    );
  return (
    <form
      className="assistant-control"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          key.current ??= crypto.randomUUID();
          try {
            const result = await setAssistantControlAction(locale, {
              target: projectKey ? "PROJECT" : "ORGANIZATION",
              ...(projectKey ? { projectKey } : {}),
              enabled: value,
              idempotencyKey: key.current,
            });
            setMessage(result.kind === "SAVED" ? copy.saved : copy.failed);
            if (result.kind === "SAVED") key.current = null;
          } catch {
            setMessage(copy.failed);
          }
        });
      }}
    >
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={value}
          disabled={pending}
          onChange={(event) => {
            setValue(event.target.checked);
            key.current = null;
            setMessage("");
          }}
        />{" "}
        {label}
      </label>
      <button disabled={pending} type="submit">
        {pending ? copy.saving : copy.save}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
