import { requirePageIdentity } from "@/lib/server/require-page-identity";
import { notFound } from "next/navigation";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPeopleServices } from "@/lib/server/people-services";
import { signInMode } from "@/modules/sign-in/domain/policy";
import { isSupportedLocale } from "@/modules/localization/config";
import { peopleCopy } from "@/modules/localization/people";
import { PeopleForm } from "@/components/sign-in/people-form";
import { PageHeader } from "@/components/ui/page-header";
import styles from "@/components/ui/ui.module.css";
export default async function People({ params }: { params: Promise<{ locale: string }> }) {
  await requirePageIdentity();
  const { locale } = await params;
  if (!isSupportedLocale(locale) || signInMode(process.env) === "demo") notFound();
  const context = await resolveServerRuntimeContext();
  if (!context) notFound();
  const data = await createPeopleServices().read(context);
  if (!data) notFound();
  const jobs = data.jobs.map((j) => ({ id: j.id, name: locale === "en" ? j.nameEn : j.nameZhTw }));
  return (
    <section className={styles.page}>
      <PageHeader
        title={peopleCopy(locale).title}
        context={locale === "en" ? "Settings" : "設定"}
      />
      <PeopleForm locale={locale} jobs={jobs} />
      {data.people.map((p) => (
        <PeopleForm
          key={`${p.id}:${p.updatedAt.toISOString()}`}
          locale={locale}
          jobs={jobs}
          person={{
            id: p.id,
            name: locale === "en" ? p.person.nameEn : p.person.nameZhTw,
            email: p.person.email ?? "",
            role: p.role,
            active: p.active,
            invitationStatus: p.invitationStatus,
            invitationEmailStatus: p.invitationEmailStatus,
            assignments: p.assignments.map((a) => ({
              projectId: a.projectId,
              canReadActuals: a.canReadActuals,
              canCreateAction: a.canCreateAction,
            })),
          }}
        />
      ))}
    </section>
  );
}
