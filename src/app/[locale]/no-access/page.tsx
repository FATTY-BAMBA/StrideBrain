import { signInMode } from "@/modules/sign-in/domain/policy";
import { notFound } from "next/navigation";
import { isSupportedLocale } from "@/modules/localization/config";
import { signInCopy } from "@/modules/localization/sign-in";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import styles from "@/components/ui/ui.module.css";
export default async function NoAccess({ params }: { params: Promise<{ locale: string }> }) {
  if (signInMode(process.env) === "demo") notFound();
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const c = signInCopy(locale);
  return (
    <section className={styles.page}>
      <PageHeader title={c.title} context="StrideBrain" />
      <p>{c.noAccess}</p>
      <form action="/api/sign-in/logout" method="post">
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit">{c.logout}</Button>
      </form>
    </section>
  );
}
