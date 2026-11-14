import { redirect } from "next/navigation";

import { defaultLocale } from "@/modules/localization/config";

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
