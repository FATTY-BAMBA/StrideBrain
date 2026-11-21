import type { Locale } from "@/modules/localization/config";
import { previewSessionCopy } from "@/modules/preview-session/copy";
import styles from "./preview-entry.module.css";

export function PreviewEntry({
  locale,
  available,
  failed,
}: {
  locale: Locale;
  available: boolean;
  failed: boolean;
}) {
  const copy = previewSessionCopy(locale);
  return (
    <section className={styles.entry} aria-labelledby="preview-title">
      <h1 id="preview-title">{copy.title}</h1>
      <p>{copy.description}</p>
      {failed && <p role="alert">{copy.failure}</p>}
      {available ? (
        <form action="/api/preview-session" method="post">
          <input type="hidden" name="locale" value={locale} />
          <label htmlFor="invitation">{copy.invitation}</label>
          <input
            id="invitation"
            name="invitation"
            type="password"
            required
            maxLength={128}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <label htmlFor="person">{copy.person}</label>
          <select id="person" name="person" required defaultValue="owner">
            <option value="owner">{copy.owner}</option>
            <option value="project-manager">{copy.projectManager}</option>
            <option value="finance">{copy.finance}</option>
            <option value="viewer">{copy.viewer}</option>
          </select>
          <button type="submit">{copy.enter}</button>
        </form>
      ) : (
        <p>{copy.unavailable}</p>
      )}
    </section>
  );
}

export function LeavePreview({ locale }: { locale: Locale }) {
  const copy = previewSessionCopy(locale);
  return (
    <section className={styles.entry}>
      <h2>{copy.session}</h2>
      <p>{copy.sessionDescription}</p>
      <form action="/api/preview-session/logout" method="post">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit">{copy.leave}</button>
      </form>
    </section>
  );
}
