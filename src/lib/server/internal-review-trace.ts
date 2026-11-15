/** Safe operator trace; never accepts request bodies, selectors, sessions or error details. */
export function traceInternalReviewAttempt(
  event: Readonly<{ requestId: string; outcome: string }>,
): void {
  console.info(
    JSON.stringify({
      event: "INTERNAL_REVIEW_ATTEMPT",
      requestId: event.requestId,
      outcome: event.outcome,
    }),
  );
}
