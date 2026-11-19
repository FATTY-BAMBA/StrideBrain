import { previewSessionRequest } from "@/lib/server/preview-session";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return previewSessionRequest(request, "enter");
}
