"use client";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
/** Native POST keeps logout/firm selection working without JavaScript. */
export function PostForm({
  action,
  locale,
  children,
}: {
  action: string;
  locale: Locale;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action={action}
      method="post"
      aria-busy={busy}
      onSubmit={(event) => {
        if (busy) event.preventDefault();
        else setBusy(true);
      }}
    >
      {children}
      {busy && <span role="status">{signInCopy(locale).busy}</span>}
    </form>
  );
}
