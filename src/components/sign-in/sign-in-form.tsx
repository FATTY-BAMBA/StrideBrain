"use client";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Icon } from "@/components/ui/icons";
import { IdentityHeading } from "./identity-heading";
import styles from "./sign-in.module.css";
type Control = "google" | "send" | "enter" | "resend";
export function SignInForm({
  locale,
  returnTo,
  initialError = "",
}: {
  locale: Locale;
  returnTo: string;
  initialError?: string;
}) {
  const c = signInCopy(locale),
    router = useRouter();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false);
  const [active, setActive] = useState<Control | null>(null),
    [error, setError] = useState<"email" | "code" | "limited" | "unavailable" | null>(null),
    [queryDismissed, setQueryDismissed] = useState(false),
    [fatal, setFatal] = useState(false),
    [remaining, setRemaining] = useState(0);
  const inFlight = useRef(false),
    focusAfterStep = useRef(false),
    panel = useRef<HTMLDivElement>(null);
  const busy = active !== null;
  useEffect(() => {
    if (!remaining) return;
    const id = setTimeout(() => setRemaining((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);
  useEffect(() => {
    if (focusAfterStep.current) {
      panel.current
        ?.querySelector<HTMLInputElement>(sent ? "#sign-in-code" : "#sign-in-email")
        ?.focus();
      focusAfterStep.current = false;
    }
  }, [sent]);
  async function submit(path: string, data: Record<string, string>, control: Control) {
    if (inFlight.current) return;
    inFlight.current = true;
    setActive(control);
    setError(null);
    setQueryDismissed(true);
    try {
      const response = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 503) {
        setFatal(true);
        setError("unavailable");
        return;
      }
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { code?: string } | null;
        if (result?.code === "NO_FIRM_ACCESS") {
          router.push(`/${locale}/no-access`);
          return;
        }
        setError(
          response.status === 429
            ? "limited"
            : response.status >= 500 || control === "google"
              ? "unavailable"
              : result?.code === "INVALID" || path === "email-otp/send-verification-otp"
                ? "email"
                : "code",
        );
        return;
      }
      if (path === "sign-in/social") {
        const result = await response.json();
        if (typeof result.url === "string") window.location.assign(result.url);
      } else if (path === "sign-in/email-otp")
        router.push(
          `/${locale}/sign-in/complete?returnTo=${encodeURIComponent(returnTo)}` as Route,
        );
      else {
        focusAfterStep.current = !sent;
        setSent(true);
        setCode("");
        setRemaining(60);
      }
    } catch {
      setError("unavailable");
    } finally {
      inFlight.current = false;
      setActive(null);
    }
  }
  const notice =
    (!queryDismissed && initialError) ||
    (error === "limited" ? c.limited : error === "unavailable" ? c.unavailable : "");
  const enter = (value: string) => {
    setCode(value);
    if (value.length === 6) void submit("sign-in/email-otp", { email, otp: value }, "enter");
  };
  return (
    <div ref={panel} className={styles.sheetBlocks} aria-busy={busy}>
      <IdentityHeading title={sent ? c.codeTitle : c.title} caption={c.caption} />
      {notice && <Notice tone="error">{notice}</Notice>}
      {fatal ? (
        <Button
          onClick={() => {
            setFatal(false);
            setError(null);
          }}
        >
          {c.retry}
        </Button>
      ) : !sent ? (
        <>
          <button
            type="button"
            className={styles.googleButton}
            disabled={busy}
            onClick={() => void submit("sign-in/social", { returnTo }, "google")}
          >
            <span className={styles.googleMark} aria-hidden="true">
              <Image src="/brand/google/light-icon.png" alt="" width={40} height={40} unoptimized />
            </span>
            <span>{active === "google" ? c.busy : c.google}</span>
          </button>
          <p className={styles.divider}>{c.or}</p>
          <form
            className={styles.sheetBlocks}
            onSubmit={(e) => {
              e.preventDefault();
              void submit("email-otp/send-verification-otp", { email }, "send");
            }}
          >
            <Field
              id="sign-in-email"
              label={c.email}
              placeholder={c.emailPlaceholder}
              hint={c.emailHint}
              {...(error === "email" ? { error: c.invalidEmail } : {})}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              disabled={busy}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className={styles.fullWidth} type="submit" variant="primary" disabled={busy}>
              {active === "send" ? c.busy : c.send}
            </Button>
          </form>
          <p className={styles.invitedOnly}>
            <Icon name="lock" decorative />
            <span>{c.invitedOnly}</span>
          </p>
        </>
      ) : (
        <>
          <div className={styles.addressRow}>
            <strong>{email}</strong>
            <Button
              variant="quiet"
              disabled={busy}
              onClick={() => {
                focusAfterStep.current = true;
                setSent(false);
                setCode("");
                setError(null);
              }}
            >
              {c.differentEmail}
            </Button>
          </div>
          <Notice tone="information">{c.neutral}</Notice>
          <form
            className={styles.sheetBlocks}
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6)
                void submit("sign-in/email-otp", { email, otp: code }, "enter");
            }}
          >
            <div className={styles.codeField}>
              <Field
                id="sign-in-code"
                label={c.code}
                hint={c.codeHint}
                {...(error === "code" ? { error: c.invalid } : {})}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                disabled={busy}
                onPaste={(e) => {
                  e.preventDefault();
                  enter(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
                }}
                onChange={(e) => enter(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className={styles.fullWidth}
              disabled={busy || code.length !== 6}
            >
              {active === "enter" ? c.busy : c.title}
            </Button>
          </form>
          <div className={styles.resendRow}>
            <Button
              variant="secondary"
              disabled={busy || remaining > 0}
              onClick={() => void submit("email-otp/send-verification-otp", { email }, "resend")}
            >
              {active === "resend" ? c.busy : c.resend}
            </Button>
            {remaining > 0 && <span>{c.resendWait.replace("{n}", String(remaining))}</span>}
          </div>
        </>
      )}
    </div>
  );
}
