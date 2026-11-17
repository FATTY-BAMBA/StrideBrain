import { describe, expect, it, vi } from "vitest";
import { focusFirstReviewError } from "@/modules/internal-review-experience/focus";

describe("Stage 8 validation focus", () => {
  it("focuses the editable field when its associated control exists", () => {
    const control = { focus: vi.fn(), scrollIntoView: vi.fn() };
    const error = { focus: vi.fn(), scrollIntoView: vi.fn() };
    const form = {
      querySelector: vi.fn((selector: string) => (selector.startsWith("[name=") ? control : error)),
    } as unknown as HTMLFormElement;
    focusFirstReviewError(form, { dueDate: "INVALID_DUE_DATE" });
    expect(control.focus).toHaveBeenCalledOnce();
    expect(control.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(control.scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
    expect(error.focus).not.toHaveBeenCalled();
  });
  it("focuses the associated error for a locked assignee without an editable control", () => {
    const error = { focus: vi.fn(), scrollIntoView: vi.fn() };
    const querySelector = vi.fn((selector: string) =>
      selector === "#review-assigneeKey-error" ? error : null,
    );
    focusFirstReviewError({ querySelector } as unknown as HTMLFormElement, {
      assigneeKey: "INVALID_REQUEST",
    });
    expect(error.focus).toHaveBeenCalledOnce();
  });
  it("does not disturb focus when neither field errors nor a summary exists", () => {
    const querySelector = vi.fn();
    focusFirstReviewError({ querySelector } as unknown as HTMLFormElement, {});
    expect(querySelector).toHaveBeenCalledWith("#review-error-summary");
  });
});
