"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const QuoteUnsaved = createContext(false);
const SetQuoteUnsaved = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

/** Ephemeral UI state for this job layout; no quote content or browser storage. */
export function JobChatStateProvider({ children }: { children: ReactNode }) {
  const [unsaved, setUnsaved] = useState(false);
  return (
    <SetQuoteUnsaved value={setUnsaved}>
      <QuoteUnsaved value={unsaved}>{children}</QuoteUnsaved>
    </SetQuoteUnsaved>
  );
}

export function useQuoteUnsavedChanges() {
  return useContext(QuoteUnsaved);
}

/** Share the editor's existing dirty flag and clear it when the editor leaves. */
export function useReportQuoteUnsavedChanges(dirty: boolean) {
  const setUnsaved = useContext(SetQuoteUnsaved);
  useEffect(() => {
    setUnsaved?.(dirty);
    return () => setUnsaved?.(false);
  }, [dirty, setUnsaved]);
}
