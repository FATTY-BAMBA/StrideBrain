"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changePerson } from "@/app/[locale]/settings/people/actions";
import { PEOPLE_ROLES, type PeopleChange } from "@/modules/people/domain/policy";
import type { Locale } from "@/modules/localization/config";
import type { Role } from "@/modules/runtime-context/contracts";
import {
  peopleCopy,
  roleLabel,
  roleDescription,
  peopleConfirmation,
} from "@/modules/localization/people";
import { Field } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { RowList, RecordRow } from "@/components/ui/row-list";
import { PageHeader } from "@/components/ui/page-header";
import ui from "@/components/ui/ui.module.css";
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
  own,
  onClose,
}: {
  locale: Locale;
  person?: PersonRow | undefined;
  own: boolean;
  onClose: () => void;
  jobs: { id: string; name: string }[];
}) {
  const c = peopleCopy(locale);
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<"deactivate" | "cancel" | null>(null);
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
                : result === "ORGANIZATION_LIMITED"
                  ? c.organizationLimited
                  : result === "LIMITED"
                    ? c.limited
                    : result === "MAIL_FAILED"
                      ? c.mailFailed
                      : c.failed,
      );
      if (result === "SUCCESS" || result === "MAIL_FAILED") router.refresh();
      if (result === "SUCCESS") onClose();
    } catch {
      setMessage(c.failed);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      labelledBy="person-dialog-title"
      pending={busy}
      onClose={onClose}
      focusKey={confirmation ?? "edit"}
      className={styles.personDialog}
    >
      <div className={styles.form} aria-busy={busy}>
        <h2 id="person-dialog-title" tabIndex={-1}>
          {confirmation && person
            ? peopleConfirmation(locale, confirmation, person.name)
            : (person?.name ?? c.invite)}
        </h2>
        {confirmation && person ? (
          <div className={styles.actions}>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => void send({ operation: confirmation, membershipId: person.id })}
            >
              {busy ? c.busy : c[confirmation]}
            </Button>
            <Button disabled={busy} onClick={() => setConfirmation(null)}>
              {c.close}
            </Button>
          </div>
        ) : (
          <>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void send(
                  person
                    ? {
                        operation: "update",
                        membershipId: person.id,
                        name: String(form.get("name")),
                        role,
                        assignments,
                      }
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
              <Field
                id="person-name"
                label={c.name}
                name="name"
                defaultValue={person?.name ?? ""}
                maxLength={160}
                required
                disabled={busy}
              />
              {person ? (
                <div>
                  <span className={styles.muted}>{c.email}</span>
                  <p>{person.email}</p>
                </div>
              ) : (
                <Field
                  id="person-email"
                  label={c.email}
                  name="email"
                  type="email"
                  maxLength={254}
                  required
                  disabled={busy}
                />
              )}
              <Field
                as="select"
                id="person-role"
                label={c.role}
                hint={roleDescription(locale, role)}
                value={role}
                disabled={busy}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {PEOPLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(locale, r)}
                  </option>
                ))}
              </Field>
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
              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy ? c.busy : person ? c.save : c.invite}
                </Button>
                <Button disabled={busy} onClick={onClose}>
                  {c.close}
                </Button>
              </div>
            </form>
            {person && (
              <div className={styles.actions}>
                {person.invitationStatus === "INVITED" && (
                  <Button
                    disabled={busy}
                    onClick={() => void send({ operation: "resend", membershipId: person.id })}
                  >
                    {c.resend}
                  </Button>
                )}
                {!own &&
                  (person.invitationStatus === "INVITED" ? (
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => setConfirmation("cancel")}
                    >
                      {c.cancel}
                    </Button>
                  ) : person.active ? (
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => setConfirmation("deactivate")}
                    >
                      {c.deactivate}
                    </Button>
                  ) : (
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void send({ operation: "reactivate", membershipId: person.id })
                      }
                    >
                      {c.reactivate}
                    </Button>
                  ))}
              </div>
            )}
            {person?.invitationStatus === "INVITED" && (
              <p className={styles.muted}>{c.directSignIn}</p>
            )}
          </>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </Dialog>
  );
}

export function PeopleList({
  locale,
  people,
  jobs,
  actorMembershipId,
}: {
  locale: Locale;
  people: PersonRow[];
  jobs: { id: string; name: string }[];
  actorMembershipId: string;
}) {
  const c = peopleCopy(locale);
  const [selected, setSelected] = useState<string | null>(null);
  const person = people.find((row) => row.id === selected);
  return (
    <>
      <PageHeader
        title={c.title}
        context={locale === "en" ? "Settings" : "設定"}
        actions={
          <Button variant="primary" onClick={() => setSelected("invite")}>
            {c.invite}
          </Button>
        }
      />
      <RowList>
        {people.map((row) => (
          <RecordRow
            key={row.id}
            name={
              <button className={styles.personName} onClick={() => setSelected(row.id)}>
                {row.name}
              </button>
            }
          >
            <p className={styles.email}>{row.email}</p>
            <div className={styles.meta}>
              <span>{roleLabel(locale, row.role)}</span>
              <span
                className={`${ui.badge} ${row.active ? styles.activeBadge : styles.inactiveBadge}`}
              >
                {!row.active
                  ? c.deactivated
                  : row.invitationStatus === "INVITED"
                    ? c.invited
                    : c.joined}
              </span>
              {row.invitationStatus === "INVITED" && row.invitationEmailStatus !== "SENT" && (
                <span>{c.mailNotSent}</span>
              )}
            </div>
          </RecordRow>
        ))}
      </RowList>
      {selected && (selected === "invite" || person) && (
        <PeopleForm
          key={selected}
          locale={locale}
          jobs={jobs}
          person={person}
          own={person?.id === actorMembershipId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
