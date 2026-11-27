import type { RuntimeContext } from "@/modules/runtime-context/contracts";
/** A suggestion must stay within the reader's capabilities, just like the tool it invites. */
export function maySuggestFollowUp(
  text: string,
  capabilities: RuntimeContext["capabilities"],
): boolean {
  if (
    /(?:專案|工程|工作)的?(?:名稱|名字|編號|代號)|\b(?:job|project)(?:'s)?\s+(?:name|reference|number|code)\b|\b(?:name|reference|number|code)\s+(?:of|for)\s+(?:the\s+)?(?:job|project)\b/i.test(
      text,
    )
  )
    return false;
  if (
    /聯絡|聯繫|電話|電郵|電子郵件|地址|客戶(?:是誰|身分|身份|名稱|姓名)|誰是.*客戶|客戶的?(?:身分|身份|名稱|姓名)|\b(?:contact|phone|telephone|email|e-mail|address)\b|\b(?:what|which)\s+(?:is|was)\s+(?:the\s+)?client\s+(?:of|for)\b|\b(?:who|name|identity)\b.*\bclient\b|\bclient\b.*\b(?:who|name|identity)\b/i.test(
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
