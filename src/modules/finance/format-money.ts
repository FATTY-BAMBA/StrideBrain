/** Formats exact decimal text without converting monetary values to binary floats. */
export function formatMoney(amount: string, currency: string): string {
  const [whole = "0", fraction = "00"] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency === "TWD" ? "NT$" : `${currency} `}${grouped}${fraction === "00" ? "" : `.${fraction}`}`;
}
