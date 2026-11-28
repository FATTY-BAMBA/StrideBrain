import { PostForm } from "@/components/sign-in/post-form";
import { notFound, redirect } from "next/navigation";
import { realIdentityState } from "@/lib/server/real-identity";
import { isSupportedLocale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { sameSiteReturn, signInMode } from "@/modules/sign-in/domain/policy";
import { Button } from "@/components/ui/button";
import { IdentityHeading } from "@/components/sign-in/identity-heading";
import styles from "@/components/sign-in/sign-in.module.css";
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
    <section className={styles.sheetBlocks}>
      <IdentityHeading title={signInCopy(locale).firms} />
      <div className={styles.firms}>
        {state.choices.map((m) => (
          <PostForm locale={locale} key={m.id} action="/api/sign-in/firm">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="returnTo" value={next} />
            <Button
              type="submit"
              className={styles.fullWidth}
              variant="secondary"
              name="membershipId"
              value={m.id}
            >
              {locale === "en" ? m.organization.nameEn : m.organization.nameZhTw}
            </Button>
          </PostForm>
        ))}
      </div>
    </section>
  );
}
