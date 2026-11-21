import { expect, it, vi } from "vitest";
import { GetWorkspaceAccount } from "@/modules/runtime-context/get-workspace-account";
import { localePreferenceCookie, preferredLocale } from "@/modules/localization/locale-preference";
import { jobContext } from "../projects/job-fixture";
const context = jobContext();
it("localizes only the authenticated member's own account; project capabilities are not required", async () => {
  const account = {
    membershipId: context.membershipId,
    organizationId: context.organizationId,
    personId: context.userId,
    person: { nameEn: "Member", nameZhTw: "成員" },
    organization: { nameEn: "Firm", nameZhTw: "公司" },
  };
  const repository = { getOwnAccount: vi.fn().mockResolvedValue(account) };
  const service = new GetWorkspaceAccount(repository);
  expect(await service.execute({ ...context, locale: "zh-TW", capabilities: new Set() })).toEqual({
    person: "成員",
    organization: "公司",
  });
  for (const change of [
    { organizationId: "other" },
    { membershipId: "other" },
    { personId: "other" },
  ]) {
    repository.getOwnAccount.mockResolvedValue({ ...account, ...change });
    expect(await service.execute(context)).toBeNull();
  }
  repository.getOwnAccount.mockRejectedValue(new Error("unavailable"));
  expect(await service.execute(context)).toBeNull();
});
it("uses only supported persistent locale values, with no identity or authority in the cookie", () => {
  expect(preferredLocale("zh-TW")).toBe("zh-TW");
  expect(preferredLocale("en")).toBe("en");
  expect(preferredLocale("en; role=admin")).toBe("zh-TW");
  expect(localePreferenceCookie("en", true)).toBe(
    "stridebrain_locale=en; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
  );
});
