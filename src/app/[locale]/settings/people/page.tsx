import { requirePageIdentity } from "@/lib/server/require-page-identity";
import { notFound } from "next/navigation";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import { createPeopleServices } from "@/lib/server/people-services";
import { signInMode } from "@/modules/sign-in/domain/policy";
import { isSupportedLocale } from "@/modules/localization/config";
import { PeopleList } from "@/components/sign-in/people-form";
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
      <PeopleList
        locale={locale}
        jobs={jobs}
        actorMembershipId={context.membershipId}
        people={data.people.map((p) => ({
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
        }))}
      />
    </section>
  );
}
