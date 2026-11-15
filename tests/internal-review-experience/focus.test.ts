import { describe, expect, it, vi } from "vitest";
import { focusFirstReviewError } from "@/modules/internal-review-experience/focus";

describe("Stage 8 validation focus", () => {
  it("focuses the editable field when its associated control exists", () => {
    const control = { focus: vi.fn() };
    const error = { focus: vi.fn() };
    const form = {
      querySelector: vi.fn((selector: string) => (selector.startsWith("[name=") ? control : error)),
    } as unknown as HTMLFormElement;
    focusFirstReviewError(form, { dueDate: "INVALID_DUE_DATE" });
    expect(control.focus).toHaveBeenCalledOnce();
    expect(error.focus).not.toHaveBeenCalled();
  });
  it("focuses the associated error for a locked assignee without an editable control", () => {
    const error = { focus: vi.fn() };
    const querySelector = vi.fn((selector: string) =>
      selector === "#review-assigneeKey-error" ? error : null,
    );
    focusFirstReviewError({ querySelector } as unknown as HTMLFormElement, {
      assigneeKey: "INVALID_REQUEST",
    });
    expect(error.focus).toHaveBeenCalledOnce();
  });
  it("does not disturb focus when no validation error exists", () => {
    const querySelector = vi.fn();
    focusFirstReviewError({ querySelector } as unknown as HTMLFormElement, {});
    expect(querySelector).not.toHaveBeenCalled();
  });
});
