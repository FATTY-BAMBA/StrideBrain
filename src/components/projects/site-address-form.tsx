"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteAddressAction } from "@/app/[locale]/projects/[projectKey]/site-address-action";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { Locale } from "@/modules/localization/config";
import { quoteDocumentCopy } from "@/modules/localization/quote-document";
import { quoteDraftCopy } from "@/modules/localization/quote-draft";
import ui from "@/components/ui/ui.module.css";
export function SiteAddressForm({
  value,
  locale,
}: {
  value: { projectKey: string; siteAddress: string; canEdit: boolean };
  locale: Locale;
}) {
  const copy = quoteDocumentCopy(locale),
    router = useRouter();
  const [address, setAddress] = useState(value.siteAddress),
    [expected, setExpected] = useState(value.siteAddress),
    [key, setKey] = useState(() => crypto.randomUUID()),
    [pending, start] = useTransition(),
    [message, setMessage] = useState("");
  return (
    <form
      className={`${ui.page} ${ui.factsWidth}`}
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await saveSiteAddressAction(locale, {
            businessKey: value.projectKey,
            siteAddress: address,
            expectedSiteAddress: expected,
            idempotencyKey: key,
          });
          setMessage(
            result.kind === "UPDATED"
              ? copy.addressSaved
              : result.kind === "CONFLICT"
                ? copy.addressConflict
                : quoteDraftCopy(locale).UNAVAILABLE,
          );
          if (result.kind === "UPDATED") {
            setExpected(address.trim());
            setAddress(address.trim());
            setKey(crypto.randomUUID());
            router.refresh();
          }
        });
      }}
    >
      <Field
        id="project-site-address"
        label={copy.siteAddress}
        hint={copy.addressHint}
        maxLength={200}
        value={address}
        disabled={pending}
        onChange={(event) => setAddress(event.target.value)}
      />
      <div>
        <Button type="submit" disabled={pending}>
          {locale === "zh-TW" ? "儲存工程地址" : "Save site address"}
        </Button>
      </div>
      {message && <Notice>{message}</Notice>}
    </form>
  );
}
