import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  LOCALE_PREFERENCE_COOKIE,
  preferredLocale,
} from "@/modules/localization/locale-preference";

export default async function RootPage() {
  const preference = (await cookies()).get(LOCALE_PREFERENCE_COOKIE)?.value;
  redirect(`/${preferredLocale(preference)}`);
}
