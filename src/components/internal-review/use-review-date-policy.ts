"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DueDatePolicyDTO,
  ProposalDTO,
  ProposalOutcome,
} from "@/modules/internal-review/domain/contracts";

function policyFrom(value: DueDatePolicyDTO): DueDatePolicyDTO {
  const { minDueDate, maxDueDate, datePolicyEvaluatedAt, nextDatePolicyBoundaryAt } = value;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(minDueDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(maxDueDate) ||
    minDueDate > maxDueDate ||
    !Number.isFinite(Date.parse(datePolicyEvaluatedAt)) ||
    !(Date.parse(nextDatePolicyBoundaryAt) > Date.parse(datePolicyEvaluatedAt))
  )
    throw new Error("DATE_POLICY_UNAVAILABLE");
  return { minDueDate, maxDueDate, datePolicyEvaluatedAt, nextDatePolicyBoundaryAt };
}

/** Guidance only. Confirmation still validates the current policy in the server transaction. */
export function useReviewDatePolicy(proposal: ProposalDTO) {
  const [policy, setPolicy] = useState<DueDatePolicyDTO>(proposal);
  const [status, setStatus] = useState<"refreshing" | "ready" | "unavailable">("refreshing");
  const current = useRef<DueDatePolicyDTO>(proposal);
  const validUntil = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef<Promise<DueDatePolicyDTO | null> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(Symbol());
  const active = useRef(false);
  const refreshRef = useRef<() => Promise<DueDatePolicyDTO | null>>(async () => null);

  const accept = useCallback(
    (value: DueDatePolicyDTO, startedAt = performance.now(), fromRefresh = false) => {
      if (!active.current) return;
      const next = policyFrom(value);
      if (
        Date.parse(next.datePolicyEvaluatedAt) < Date.parse(current.current.datePolicyEvaluatedAt)
      ) {
        setStatus(performance.now() < validUntil.current ? "ready" : "unavailable");
        return;
      }
      if (!fromRefresh) {
        generation.current = Symbol();
        abort.current?.abort();
        request.current = null;
      }
      current.current = next;
      setPolicy(next);
      setStatus("ready");
      // Relative server time + monotonic elapsed time; the browser calendar is never policy.
      validUntil.current =
        startedAt +
        Date.parse(next.nextDatePolicyBoundaryAt) -
        Date.parse(next.datePolicyEvaluatedAt);
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => void refreshRef.current(),
        Math.max(100, validUntil.current - performance.now()),
      );
    },
    [],
  );

  const refresh = useCallback((): Promise<DueDatePolicyDTO | null> => {
    if (request.current) return request.current;
    clearTimeout(timer.current);
    const version = Symbol();
    generation.current = version;
    const controller = new AbortController();
    abort.current = controller;
    const startedAt = performance.now();
    setStatus("refreshing");
    const operation = async () => {
      try {
        const response = await fetch(
          `/api/actions/internal-review/proposals/${encodeURIComponent(proposal.businessKey)}?locale=${proposal.locale}`,
          { credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        const outcome = (await response.json()) as ProposalOutcome;
        if (
          !response.ok ||
          outcome.kind !== "PREPARED" ||
          outcome.proposal.businessKey !== proposal.businessKey ||
          outcome.proposal.timezone !== proposal.timezone
        )
          throw new Error("DATE_POLICY_UNAVAILABLE");
        const next = policyFrom(outcome.proposal);
        if (!active.current || generation.current !== version) return null;
        accept(next, startedAt, true);
        return current.current;
      } catch {
        if (active.current && generation.current === version) {
          validUntil.current = 0;
          setStatus("unavailable");
        }
        return null;
      } finally {
        if (generation.current === version) request.current = null;
      }
    };
    request.current = Promise.resolve().then(operation);
    return request.current;
  }, [accept, proposal.businessKey, proposal.locale, proposal.timezone]);

  useEffect(() => {
    active.current = true;
    refreshRef.current = refresh;
    // Recalibrate after hydration, which may occur long after the server rendered the DTO.
    void refresh();
    const foreground = () => {
      if (document.visibilityState !== "hidden") void refresh();
    };
    window.addEventListener("focus", foreground);
    window.addEventListener("pageshow", foreground);
    document.addEventListener("visibilitychange", foreground);
    return () => {
      active.current = false;
      generation.current = Symbol();
      abort.current?.abort();
      request.current = null;
      clearTimeout(timer.current);
      window.removeEventListener("focus", foreground);
      window.removeEventListener("pageshow", foreground);
      document.removeEventListener("visibilitychange", foreground);
    };
  }, [refresh]);

  async function ensureCurrent() {
    if (request.current) return request.current;
    if (performance.now() >= validUntil.current) return refresh();
    return current.current;
  }

  return { policy, status, refresh, ensureCurrent, accept };
}
