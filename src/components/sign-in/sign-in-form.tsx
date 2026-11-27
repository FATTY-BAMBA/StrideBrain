"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { Button } from "@/components/ui/button";
import styles from "./sign-in.module.css";
export function SignInForm({ locale, returnTo }: { locale: Locale; returnTo: string }) {
  const c = signInCopy(locale);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fatal, setFatal] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!remaining) return;
    const id = setTimeout(() => setRemaining((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);
  async function submit(path: string, data: Record<string, string>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 503) {
        setFatal(true);
        return;
      }
      if (!response.ok) {
        setError(response.status === 429 ? c.limited : c.invalid);
        return;
      }
      if (path === "sign-in/social") {
        const result = await response.json();
        if (typeof result.url === "string") window.location.assign(result.url);
      } else if (path === "sign-in/email-otp")
        window.location.assign(
          `/${locale}/sign-in/complete?returnTo=${encodeURIComponent(returnTo)}`,
        );
      else {
        setSent(true);
        setCode("");
        setRemaining(60);
      }
    } catch {
      setError(c.unavailable);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  if (fatal)
    return (
      <div role="alert">
        <p>{c.unavailable}</p>
        <Button onClick={() => setFatal(false)}>{c.retry}</Button>
      </div>
    );
  return (
    <div className={styles.form} aria-busy={busy}>
      <Button
        disabled={busy}
        onClick={() => {
          void submit("sign-in/social", { returnTo });
        }}
      >
        {busy ? c.busy : c.google}
      </Button>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void submit("email-otp/send-verification-otp", { email });
        }}
      >
        <label className={styles.field}>
          {c.email}
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            disabled={busy || sent}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {!sent && (
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? c.busy : c.send}
          </Button>
        )}
      </form>
      {sent && (
        <>
          <p role="status">{c.neutral}</p>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) void submit("sign-in/email-otp", { email, otp: code });
            }}
          >
            <label className={styles.field}>
              {c.code}
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                disabled={busy}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                  if (value.length === 6) void submit("sign-in/email-otp", { email, otp: value });
                }}
              />
            </label>
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>
              {busy ? c.busy : c.title}
            </Button>
          </form>
          <Button
            disabled={busy || remaining > 0}
            onClick={() => void submit("email-otp/send-verification-otp", { email })}
          >
            {c.resend}
            {remaining ? ` (${remaining})` : ""}
          </Button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
