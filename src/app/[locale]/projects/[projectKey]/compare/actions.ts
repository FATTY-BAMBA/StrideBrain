"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { createComparisonServices } from "@/lib/server/comparison-services";
import { resolveServerRuntimeContext } from "@/lib/server/runtime-context";
import {
  comparisonHref,
  sanitizeSelectedProjectKeys,
  selectedKeysFromFormData,
} from "@/modules/comparison-experience/route-state";
import { isSupportedLocale, type Locale } from "@/modules/localization/config";

const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

function field(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeKey(value: string | undefined): string | undefined {
  return value && SAFE_KEY.test(value) ? value : undefined;
}

function asRoute(value: string): Route {
  return value as Route;
}

function actionContext(formData: FormData): Readonly<{
  locale: Locale;
  projectKey: string;
}> {
  const rawLocale = field(formData, "locale");
  const projectKey = safeKey(field(formData, "projectKey"));
  if (!rawLocale || !isSupportedLocale(rawLocale) || !projectKey) {
    throw new Error("INVALID_COMPARISON_ACTION_CONTEXT");
  }
  return Object.freeze({ locale: rawLocale, projectKey });
}

function redirectOutcome(
  locale: Locale,
  projectKey: string,
  outcome: string,
  requestId?: string,
  missingFields?: readonly string[],
): never {
  redirect(
    asRoute(
      comparisonHref(locale, projectKey, {
        outcome,
        ...(requestId ? { requestId } : {}),
        ...(missingFields?.length ? { missingFields } : {}),
      }),
    ),
  );
}

export async function runComparisonAction(formData: FormData): Promise<never> {
  const { locale, projectKey } = actionContext(formData);
  const context = await resolveServerRuntimeContext();
  if (!context) redirectOutcome(locale, projectKey, "SESSION_REQUIRED");

  const services = createComparisonServices();
  const structural = await services.runComparison.execute(context, projectKey);

  if (structural.kind === "CONTEXT_INCOMPLETE") {
    redirectOutcome(
      locale,
      projectKey,
      structural.kind,
      structural.requestId,
      structural.missingFields,
    );
  }
  if (structural.kind === "NO_ELIGIBLE_HISTORY") {
    redirectOutcome(locale, projectKey, structural.kind, structural.requestId);
  }
  if (structural.kind === "UNAVAILABLE" || structural.kind === "FAILED") {
    redirectOutcome(locale, projectKey, structural.kind, structural.requestId);
  }

  const economics = await services.runEconomics.execute(
    context,
    structural.result.run.id,
    structural.result.defaultSelectedProjectKeys,
  );
  if ("result" in economics) {
    redirect(
      asRoute(
        comparisonHref(locale, projectKey, {
          comparisonRunId: structural.result.run.id,
          economicsRunId: economics.result.run.id,
          selectedProjectKeys: economics.result.selectedProjectKeys,
        }),
      ),
    );
  }

  redirect(
    asRoute(
      comparisonHref(locale, projectKey, {
        comparisonRunId: structural.result.run.id,
        selectedProjectKeys: structural.result.defaultSelectedProjectKeys,
        outcome: economics.kind,
        requestId: economics.requestId,
      }),
    ),
  );
}

export async function updateComparisonSelectionAction(formData: FormData): Promise<never> {
  const { locale, projectKey } = actionContext(formData);
  const comparisonRunId = safeKey(field(formData, "comparisonRunId"));
  if (!comparisonRunId) throw new Error("COMPARISON_RUN_ID_REQUIRED");

  const context = await resolveServerRuntimeContext();
  if (!context) redirectOutcome(locale, projectKey, "SESSION_REQUIRED");

  const services = createComparisonServices();
  const structural = await services.getComparison.execute(context, comparisonRunId);
  if (structural.kind !== "COMPLETE") {
    redirectOutcome(locale, projectKey, structural.kind, structural.requestId);
  }
  if (structural.result.activeContext.projectKey !== projectKey) {
    redirectOutcome(locale, projectKey, "UNAVAILABLE", context.requestId);
  }

  const authorizedKeys = structural.result.matches.map((match) => match.project.projectKey);
  const selected = sanitizeSelectedProjectKeys(
    selectedKeysFromFormData(formData),
    authorizedKeys,
    structural.result.defaultSelectedProjectKeys,
  );
  const economics = await services.runEconomics.execute(context, comparisonRunId, selected);

  if ("result" in economics) {
    redirect(
      asRoute(
        comparisonHref(locale, projectKey, {
          comparisonRunId,
          economicsRunId: economics.result.run.id,
          selectedProjectKeys: economics.result.selectedProjectKeys,
        }),
      ),
    );
  }

  redirect(
    asRoute(
      comparisonHref(locale, projectKey, {
        comparisonRunId,
        selectedProjectKeys: selected,
        outcome: economics.kind,
        requestId: economics.requestId,
      }),
    ),
  );
}
