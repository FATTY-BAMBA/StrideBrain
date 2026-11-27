import type { RuntimeContext } from "@/modules/runtime-context/contracts";
/** A suggestion must stay within the reader's capabilities, just like the tool it invites. */
export function maySuggestFollowUp(
  text: string,
  capabilities: RuntimeContext["capabilities"],
): boolean {
  if (
    /聯絡|電話|電郵|電子郵件|地址|客戶(?:是誰|身分|身份|名稱|姓名)|誰是.*客戶|\b(?:contact|phone|telephone|email|e-mail|address)\b|\b(?:who|name|identity)\b.*\bclient\b|\bclient\b.*\b(?:who|name|identity)\b/i.test(
      text,
    )
  )
    return false;
  if (
    !capabilities.has("quote:read") &&
    /報價|金額|單價|價格|成本|稅|總額|總計|\b(?:quotes?|quotations?|prices?|amounts?|costs?|tax|totals?)\b/i.test(
      text,
    )
  )
    return false;
  if (!capabilities.has("commercial:actual-read") && /實際成本|\bactual costs?\b/i.test(text))
    return false;
  return true;
}
