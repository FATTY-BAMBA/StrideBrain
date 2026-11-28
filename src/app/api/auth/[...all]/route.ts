import { realAuthRequest } from "@/lib/server/auth-request";
// Backstop above two sequential OAuth requests, each bounded at 10 seconds.
export const maxDuration = 30;
export const runtime = "nodejs";
export const GET = realAuthRequest;
export const POST = realAuthRequest;
