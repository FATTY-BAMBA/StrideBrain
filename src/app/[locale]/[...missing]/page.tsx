import { requirePageIdentity } from "@/lib/server/require-page-identity";
import { notFound } from "next/navigation";
/** Catch unknown addresses inside the localized shell; this exposes no product route. */
export default async function UnknownAddress() {
  await requirePageIdentity();
  notFound();
}
