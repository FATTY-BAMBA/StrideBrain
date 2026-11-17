import type { FieldErrors } from "@/modules/internal-review/domain/contracts";

/** Keep recovery inside the review: a field error takes priority over the summary. */
export function focusFirstReviewError(form: HTMLFormElement | null, errors: FieldErrors): void {
  const first = Object.keys(errors)[0];
  if (!form) return;
  const control = first ? form.querySelector<HTMLElement>(`[name="${first}"]`) : null;
  const error = first ? form.querySelector<HTMLElement>(`#review-${first}-error`) : null;
  const target = control ?? error ?? form.querySelector<HTMLElement>("#review-error-summary");
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
}
