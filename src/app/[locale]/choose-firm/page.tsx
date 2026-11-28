import { PostForm } from "@/components/sign-in/post-form";
import { notFound, redirect } from "next/navigation";
import { realIdentityState } from "@/lib/server/real-identity";
import { isSupportedLocale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import styles from "@/components/ui/ui.module.css";
export default async function ChooseFirm({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (signInMode(process.env) === "demo") notFound();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const state = await realIdentityState();
  if (!state) redirect(`/${locale}/sign-in`);
  if (!state.choices.length) redirect(`/${locale}/no-access`);
  const next = sameSiteReturn((await searchParams).returnTo, locale);
  return (
    <section className={styles.page}>
      <PageHeader title={signInCopy(locale).firms} context="" />
      {state.choices.map((m) => (
        <PostForm locale={locale} key={m.id} action="/api/sign-in/firm">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="returnTo" value={next} />
          <Button type="submit" name="membershipId" value={m.id}>
            {locale === "en" ? m.organization.nameEn : m.organization.nameZhTw}
          </Button>
        </PostForm>
      ))}
    </section>
  );
}
