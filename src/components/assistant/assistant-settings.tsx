import Link from "next/link";
import { assistantConfigured } from "@/lib/server/assistant-availability";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { AssistantControl } from "./assistant-control";
import { assistantCopy } from "@/modules/localization/assistant";
import type { RuntimeContext } from "@/modules/runtime-context/contracts";
import { decimalToString, decimalFromString, rescale } from "@/modules/finance/fixed-decimal";
export async function AssistantSettings({ context }: { context: RuntimeContext }) {
  const copy = assistantCopy(context.locale);
  let data: {
    service: ReturnType<typeof createAssistantServices>;
    settings: Awaited<
      ReturnType<ReturnType<typeof createAssistantServices>["repository"]["settings"]>
    >;
  } | null = null;
  try {
    const service = createAssistantServices(),
      now = new Date(),
      monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const settings = await service.repository.settings(context, monthStart);
    data = { service, settings };
  } catch {
    /* Optional settings reads do not blank the page. */
  }
  if (!data) {
    return (
      <section className="assistant-settings">
        <h2>{copy.title}</h2>
        <p role="status">{copy.unavailable}</p>
      </section>
    );
  }
  const { service, settings } = data;
  return (
    <section className="assistant-settings">
      <h2>{copy.title}</h2>
      <p>
        {copy.provider}
        {context.locale === "zh-TW" ? "：" : ": "}Google Gemini · {copy.model}
        {context.locale === "zh-TW" ? "：" : ": "}
        {service.config.model}
      </p>
      {settings ? (
        <>
          <AssistantControl locale={context.locale} enabled={settings.enabled} canManage={true} />
          <dl>
            <div>
              <dt>{copy.calls}</dt>
              <dd>{settings.calls}</dd>
            </div>
            <div>
              <dt>{copy.cost}</dt>
              <dd>
                US$
                {decimalToString(
                  rescale(decimalFromString(settings.estimatedUsd, 9), 6, "HALF_UP"),
                )}
              </dd>
            </div>
          </dl>
          {settings.unmeteredCalls > 0 && <p>{copy.unknownCost}</p>}
        </>
      ) : null}
      {(!service.config.enabled || !assistantConfigured()) && <p>{copy.notConfigured}</p>}
      <Link href={`/${context.locale}/ai-data`}>{copy.data}</Link>
    </section>
  );
}
