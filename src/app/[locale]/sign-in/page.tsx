import { notFound, redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in/sign-in-form";
import { PageHeader } from "@/components/ui/page-header";
import styles from "@/components/ui/ui.module.css";
import { isSupportedLocale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string; google?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const mode = signInMode(process.env);
  if (mode === "demo") redirect(`/${locale}/preview`);
  const c = signInCopy(locale);
  const query = await searchParams;
  return (
    <section className={styles.page}>
      <PageHeader title={c.title} context="" />
      {query.error === "google-account" && <p role="alert">{c.googleAccount}</p>}
      {query.google === "1" && query.error !== "google-account" && (
        <p role="alert">{c.googleUnavailable}</p>
      )}
      {query.error && query.error !== "google-account" && query.google !== "1" && (
        <p role="alert">{c.unavailable}</p>
      )}
      <SignInForm locale={locale} returnTo={sameSiteReturn(query.returnTo, locale)} />
      {mode === "both" && <a href={`/${locale}/preview`}>{c.sample}</a>}
    </section>
  );
}
