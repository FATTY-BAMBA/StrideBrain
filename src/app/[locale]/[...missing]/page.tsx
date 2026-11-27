import { notFound } from "next/navigation";
/** Catch unknown addresses inside the localized shell; this exposes no product route. */
export default function UnknownAddress() {
  notFound();
}
