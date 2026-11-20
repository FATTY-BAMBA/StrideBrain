import type { Route } from "next";

export type HomeChatCitation = Readonly<{
  index: number;
  sourceKey: string;
  title: string;
  sourceType: string;
  project?: string;
  locator: string;
  authority: string;
  supportedValue?: string;
  conditions: readonly string[];
  preview: readonly Readonly<{ label: string; value: string }>[];
  fullHref: Route;
}>;

export type HomeChatIntent = "SIMILAR" | "STONE" | "QUOTE" | "ACTIONS" | "PROJECT";

export type ComparableReference = Readonly<{
  projectKey: string;
  name: string;
}>;

export type HomeChatContext = Readonly<{
  lastIntent?: HomeChatIntent;
  comparisonRunId?: string;
  economicsRunId?: string;
  selectedProjectKeys?: readonly string[];
  activeClaimKey?: string;
  activeComparableProjectKey?: string;
  activeComparableProjectName?: string;
  comparableProjects?: readonly ComparableReference[];
}>;

export type HomeChatTurn = Readonly<{
  id: string;
  role: "user" | "assistant";
  text: string;
  bullets?: readonly string[];
  citations?: readonly HomeChatCitation[];
  action?: Readonly<{ label: string; href: Route }>;
}>;

export type HomeChatState = Readonly<{
  turns: readonly HomeChatTurn[];
  context: HomeChatContext;
}>;

export const initialHomeChatState: HomeChatState = Object.freeze({
  turns: Object.freeze([]),
  context: Object.freeze({}),
});
