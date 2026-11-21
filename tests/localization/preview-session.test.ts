import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PreviewEntry, LeavePreview } from "@/components/demo-value/preview-entry";
import { previewSessionCopy } from "@/modules/preview-session/copy";

describe("controlled Preview bilingual entry", () => {
  it.each(["en", "zh-TW"] as const)(
    "provides a simple POST-only %s entry with static sample people and no record ids",
    (locale) => {
      const html = renderToStaticMarkup(
        createElement(PreviewEntry, { locale, available: true, failed: false }),
      );
      const copy = previewSessionCopy(locale);
      expect(html).toContain(copy.title);
      expect(html).toContain(copy.invitation);
      expect(html).toContain(copy.enter);
      expect(html).toContain('action="/api/preview-session"');
      expect(html).toContain('method="post"');
      expect(html).toContain('type="password"');
      expect(html).toContain(`name="locale" value="${locale}"`);
      expect(html).not.toMatch(
        /name="(?:role|organization|membership|returnTo)"|sb1\.|SHA256|SECRET|org_horizon|membership_horizon/,
      );
      expect(html).toContain('<label for="person">' + copy.person + "</label>");
      expect(html).toContain('name="person" required=""');
      expect(html).toContain('<option value="owner" selected="">' + copy.owner + "</option>");
      for (const [key, label] of [
        ["project-manager", copy.projectManager],
        ["finance", copy.finance],
        ["viewer", copy.viewer],
      ])
        expect(html).toContain(`<option value="${key}">${label}</option>`);
      expect(html.match(/<option /g)).toHaveLength(4);
      expect(html.match(/type="submit"/g)).toHaveLength(1);
      const logout = renderToStaticMarkup(createElement(LeavePreview, { locale }));
      expect(logout).toContain(copy.leave);
      expect(logout).toContain('action="/api/preview-session/logout"');
    },
  );
  it.each(["en", "zh-TW"] as const)(
    "uses neutral localized failure and unavailable states in %s",
    (locale) => {
      const html = renderToStaticMarkup(
        createElement(PreviewEntry, { locale, available: false, failed: true }),
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain(previewSessionCopy(locale).failure);
      expect(html).toContain(previewSessionCopy(locale).unavailable);
      expect(html).not.toContain("<form");
    },
  );
  it("has complete distinct copy in both languages", () => {
    const en = previewSessionCopy("en");
    const zh = previewSessionCopy("zh-TW");
    expect(Object.keys(en)).toEqual(Object.keys(zh));
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      expect(zh[key]).not.toBe(en[key]);
      expect(zh[key]).toMatch(/[\u3400-\u9fff]/);
    }
  });
});
