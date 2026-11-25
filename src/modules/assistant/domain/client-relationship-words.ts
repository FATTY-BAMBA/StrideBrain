/** Relationship to the firm does not establish the client's type or belong to their name. */
export const clientRelationshipWords = [
  "新客戶",
  "既有客戶",
  "老客戶",
  "客戶",
  "new client",
  "existing client",
  "our client",
] as const;

const relationshipWordsPattern = new RegExp(clientRelationshipWords.join("|"), "giu");

/** The caller supplies a normalized quote that is already supported by the input text. */
export function hasClientTypeContent(quote: string): boolean {
  return quote.replace(relationshipWordsPattern, "").replace(/[\s\p{P}]/gu, "").length > 0;
}
