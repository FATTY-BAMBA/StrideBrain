"use client";
import { RecordsState } from "@/components/ui/records-state";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return <RecordsState area="quotes" reset={reset} />;
}
