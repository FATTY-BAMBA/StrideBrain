"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changePerson } from "@/app/[locale]/settings/people/actions";
import { PEOPLE_ROLES, type PeopleChange } from "@/modules/people/domain/policy";
import type { Locale } from "@/modules/localization/config";
import type { Role } from "@/modules/runtime-context/contracts";
import { peopleCopy, roleLabel, roleDescription } from "@/modules/localization/people";
import { Button } from "@/components/ui/button";
import styles from "./sign-in.module.css";
export type PersonRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  invitationStatus: string;
  invitationEmailStatus: string;
  assignments: { projectId: string; canReadActuals: boolean; canCreateAction: boolean }[];
};
export function PeopleForm({
  locale,
  person,
  jobs,
}: {
  locale: Locale;
  person?: PersonRow;
  jobs: { id: string; name: string }[];
}) {
  const c = peopleCopy(locale);
  const router = useRouter();
  const [role, setRole] = useState<Role>(person?.role ?? "VIEWER");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [assignments, setAssignments] = useState(person?.assignments ?? []);
  const pending = useRef(false);
  const retry = useRef<{ body: string; key: string } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  if (unavailable) throw new Error("People unavailable.");
  async function send(input: Omit<PeopleChange, "idempotencyKey">) {
    if (pending.current) return;
    pending.current = true;
    const body = JSON.stringify(input);
    if (retry.current?.body !== body) retry.current = { body, key: crypto.randomUUID() };
    setBusy(true);
    setMessage("");
    try {
      const result = await changePerson({ ...input, idempotencyKey: retry.current.key });
      if (result === "UNAVAILABLE") {
        setUnavailable(true);
        return;
      }
      retry.current = null;
      setMessage(
        result === "SUCCESS"
          ? c.saved
          : result === "LAST_OWNER"
            ? c.lastOwner
            : result === "SELF_DEACTIVATION"
              ? c.self
              : result === "DUPLICATE"
                ? c.duplicate
                : result === "LIMITED"
                  ? c.limited
                  : result === "MAIL_FAILED"
                    ? c.mailFailed
                    : c.failed,
      );
      if (result === "SUCCESS" || result === "MAIL_FAILED") router.refresh();
    } catch {
      setMessage(c.failed);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={styles.person} aria-busy={busy}>
      {person && (
        <>
          <h2>{person.name}</h2>
          <p>{person.email}</p>
          <p>
            {!person.active
              ? c.deactivated
              : person.invitationStatus === "INVITED"
                ? c.invited
                : c.joined}
          </p>
          {person.invitationStatus === "INVITED" && (
            <>
              {person.invitationEmailStatus !== "SENT" && <p role="status">{c.mailNotSent}</p>}
              <p>{c.directSignIn}</p>
              {person.invitationEmailStatus === "FAILED" && <p>{c.mailFailed}</p>}
            </>
          )}
        </>
      )}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          void send(
            person
              ? { operation: "role", membershipId: person.id, role }
              : {
                  operation: "invite",
                  name: String(form.get("name")),
                  email: String(form.get("email")),
                  role,
                  assignments,
                },
          );
        }}
      >
        {!person && (
          <>
            <label className={styles.field}>
              {c.name}
              <input name="name" maxLength={160} required disabled={busy} />
            </label>
            <label className={styles.field}>
              {c.email}
              <input name="email" type="email" maxLength={254} required disabled={busy} />
            </label>
          </>
        )}
        <label className={styles.field}>
          {c.role}
          <select value={role} disabled={busy} onChange={(e) => setRole(e.target.value as Role)}>
            {PEOPLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(locale, r)}
              </option>
            ))}
          </select>
        </label>
        <p>{roleDescription(locale, role)}</p>
        {role === "ORGANIZATION_ADMIN" ? (
          <p>{c.allJobs}</p>
        ) : (
          <details>
            <summary>
              {c.jobs} ({assignments.length})
            </summary>
            <fieldset className={styles.jobs} disabled={busy}>
              <legend>{c.jobs}</legend>
              {jobs.map((job) => {
                const assigned = assignments.find((a) => a.projectId === job.id);
                return (
                  <div className={styles.job} key={job.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(assigned)}
                        onChange={(e) =>
                          setAssignments((current) =>
                            e.target.checked
                              ? [
                                  ...current,
                                  {
                                    projectId: job.id,
                                    canReadActuals: false,
                                    canCreateAction: false,
                                  },
                                ]
                              : current.filter((a) => a.projectId !== job.id),
                          )
                        }
                      />
                      {job.name}
                    </label>
                    {assigned && (
                      <>
                        <label>
                          <input
                            type="checkbox"
                            aria-label={`${job.name} · ${c.actuals}`}
                            checked={assigned.canReadActuals}
                            onChange={(e) =>
                              setAssignments((current) =>
                                current.map((a) =>
                                  a.projectId === job.id
                                    ? { ...a, canReadActuals: e.target.checked }
                                    : a,
                                ),
                              )
                            }
                          />
                          {c.actuals}
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            aria-label={`${job.name} · ${c.action}`}
                            checked={assigned.canCreateAction}
                            onChange={(e) =>
                              setAssignments((current) =>
                                current.map((a) =>
                                  a.projectId === job.id
                                    ? { ...a, canCreateAction: e.target.checked }
                                    : a,
                                ),
                              )
                            }
                          />
                          {c.action}
                        </label>
                      </>
                    )}
                  </div>
                );
              })}
            </fieldset>
          </details>
        )}
        <Button type="submit" variant={person ? "secondary" : "primary"} disabled={busy}>
          {busy ? c.busy : person ? c.save : c.invite}
        </Button>
        {person && role !== "ORGANIZATION_ADMIN" && (
          <Button
            disabled={busy}
            onClick={() => void send({ operation: "access", membershipId: person.id, assignments })}
          >
            {c.jobs} · {c.save}
          </Button>
        )}
      </form>
      {person && (
        <div>
          {(person.invitationStatus === "INVITED"
            ? ["resend", "cancel"]
            : person.invitationStatus === "CANCELLED"
              ? []
              : [person.active ? "deactivate" : "reactivate"]
          ).map((operation) => (
            <Button
              key={operation}
              disabled={busy}
              onClick={() =>
                void send({
                  operation: operation as PeopleChange["operation"],
                  membershipId: person.id,
                })
              }
            >
              {busy ? c.busy : c[operation as "resend" | "cancel" | "deactivate" | "reactivate"]}
            </Button>
          ))}
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
