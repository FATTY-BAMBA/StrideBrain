"use client";
import { RecordsState } from "@/components/ui/records-state";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <RecordsState area="workspace" reset={reset} />;
}
