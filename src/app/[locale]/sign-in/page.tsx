import { notFound, redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in/sign-in-form";
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
    <SignInForm
      locale={locale}
      returnTo={sameSiteReturn(query.returnTo, locale)}
      initialError={
        query.error === "google-account"
          ? c.googleAccount
          : query.google === "1"
            ? c.googleUnavailable
            : query.error
              ? c.unavailable
              : ""
      }
    />
  );
}
