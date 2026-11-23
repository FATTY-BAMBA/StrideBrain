import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getCatalog } from "@/modules/localization/catalog";

const boundary = vi.hoisted(() => ({ navigation: vi.fn() }));
vi.mock("@/components/shell/global-nav", () => ({
  GlobalNav: (props: unknown) => {
    boundary.navigation(props);
    return createElement("nav");
  },
}));
vi.mock("@/components/shell/language-switcher", () => ({
  LanguageSwitcher: () => createElement("span"),
}));
import { WorkspaceShell } from "@/components/shell/workspace-shell";

describe("Projects shell server-to-client disclosure boundary", () => {
  it.each(["en", "zh-TW"] as const)(
    "sends only navigation labels to the client component in %s",
    (locale) => {
      const catalog = {
        ...getCatalog(locale),
        "home.nextDescription": "INACCESSIBLE_PROJECT_NAME_AND_EXISTENCE",
      };
      renderToStaticMarkup(WorkspaceShell({ locale, catalog, children: null }));
      const props = boundary.navigation.mock.calls.at(-1)![0];
      expect(props).toEqual({
        locale,
        labels: {
          "nav.home": catalog["nav.home"],
          "nav.projects": catalog["nav.projects"],
          "nav.knowledge": catalog["nav.knowledge"],
          "nav.customerCare": catalog["nav.customerCare"],
        },
      });
      expect(JSON.stringify(props)).not.toMatch(/INACCESSIBLE|Xinyi|Horizon|信義|禾序/);
    },
  );
});
