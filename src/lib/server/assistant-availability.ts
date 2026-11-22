/** Boolean availability only; no credential or provider detail crosses this boundary. */
export function assistantConfigured(): boolean {
  return (
    !!process.env.STRIDEBRAIN_GEMINI_API_KEY &&
    process.env.STRIDEBRAIN_AI_ENABLED === "true" &&
    process.env.STRIDEBRAIN_AI_PAID_TIER_CONFIRMED === "true"
  );
}
