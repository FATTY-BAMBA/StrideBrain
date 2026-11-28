import { realIdentityState } from "@/lib/server/real-identity";
import { PostForm } from "@/components/sign-in/post-form";
import { signInMode } from "@/modules/sign-in/domain/policy";
import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { Button } from "@/components/ui/button";
import { IdentityHeading } from "@/components/sign-in/identity-heading";
import styles from "@/components/sign-in/sign-in.module.css";
export default async function NoAccess({ params }: { params: Promise<{ locale: string }> }) {
  if (signInMode(process.env) === "demo") notFound();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = signInCopy(locale);
  const signedIn = Boolean(await realIdentityState());
  return (
    <section className={styles.sheetBlocks}>
      <IdentityHeading title={c.noAccessTitle} />
      <p>{c.noAccess}</p>
      {signedIn && (
        <PostForm locale={locale} action="/api/sign-in/logout">
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="secondary">
            {c.logout}
          </Button>
        </PostForm>
      )}
    </section>
  );
}
