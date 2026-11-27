import { SectionHeading } from "@/components/ui/section-heading";
import { durationLabel } from "@/modules/localization/duration";
import { designSystemCopy } from "@/modules/localization/design-system";
import Link from "next/link";
import { Table, NameCell, NumericCell } from "@/components/ui/table";
import { assistantConfigured } from "@/lib/server/assistant-availability";
import { createAssistantServices } from "@/lib/server/assistant-services";
import { AssistantControl } from "./assistant-control";
import { assistantCopy, assistantFailureText } from "@/modules/localization/assistant";
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
        <SectionHeading>{copy.title}</SectionHeading>
        <p role="status">{copy.unavailable}</p>
      </section>
    );
  }
  const { service, settings } = data;
  return (
    <section className="assistant-settings">
      <SectionHeading>{copy.title}</SectionHeading>
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
          <h3>{copy.turnTimings}</h3>
          <p>{copy.timingExplanation}</p>
          {settings.turnTimings?.count ? (
            <dl>
              <div>
                <dt>{copy.timedTurns}</dt>
                <dd>{settings.turnTimings.count}</dd>
              </div>
              <div>
                <dt>{copy.latestTiming}</dt>
                <dd>{durationLabel(settings.turnTimings.latestMs, context.locale)}</dd>
              </div>
              <div>
                <dt>{copy.maximumTiming}</dt>
                <dd>{durationLabel(settings.turnTimings.maximumMs, context.locale)}</dd>
              </div>
            </dl>
          ) : (
            <p>{copy.noTimings}</p>
          )}
          {settings.turnTimings?.recent?.length ? (
            <details>
              <summary>{copy.recentTimings}</summary>
              <Table
                caption={copy.recentTimings}
                headings={[
                  { label: copy.timingStarted },
                  { label: copy.timingDuration, numeric: true },
                ]}
              >
                {settings.turnTimings.recent.map((row) => (
                  <tr key={row.requestId}>
                    <NameCell>
                      <time dateTime={row.startedAt.toISOString()}>
                        {row.startedAt.toISOString().replace("T", " ").replace("Z", "")}
                      </time>
                    </NameCell>
                    <NumericCell>{durationLabel(row.serverDurationMs, context.locale)}</NumericCell>
                  </tr>
                ))}
              </Table>
            </details>
          ) : null}
          <h3>{copy.failures}</h3>
          {settings.failures.length ? (
            <Table
              caption={copy.failures}
              headings={[
                { label: copy.failureReason },
                { label: designSystemCopy(context.locale).httpStatus },
                { label: copy.failureCount, numeric: true },
              ]}
            >
              {settings.failures.map((f) => (
                <tr key={`${f.code}:${f.httpStatus}`}>
                  <NameCell>{assistantFailureText(context.locale, f.code, f.httpStatus)}</NameCell>
                  <td>{f.httpStatus ?? "—"}</td>
                  <NumericCell>{f.count}</NumericCell>
                </tr>
              ))}
            </Table>
          ) : (
            <p>{copy.noFailures}</p>
          )}
        </>
      ) : null}
      {(!service.config.enabled || !assistantConfigured()) && <p>{copy.notConfigured}</p>}
      <Link href={`/${context.locale}/ai-data`}>{copy.data}</Link>
    </section>
  );
}
