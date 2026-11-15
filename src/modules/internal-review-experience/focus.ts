import type { FieldErrors } from "@/modules/internal-review/domain/contracts";

/** Locked fields have no input: focus their associated error instead. */
export function focusFirstReviewError(form: HTMLFormElement | null, errors: FieldErrors): void {
  const first = Object.keys(errors)[0];
  if (!form || !first) return;
  const control = form.querySelector<HTMLElement>(`[name="${first}"]`);
  const error = form.querySelector<HTMLElement>(`#review-${first}-error`);
  (control ?? error)?.focus();
}
