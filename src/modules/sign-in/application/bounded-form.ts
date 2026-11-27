/** Cookie-authenticated form endpoints accept only small URL-encoded, single-value fields. */
export async function boundedSignInForm(request: Request, keys: readonly string[]) {
  if (
    !/^application\/x-www-form-urlencoded(?:;.*)?$/i.test(request.headers.get("content-type") ?? "")
  )
    return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      return null;
    }
    chunks.push(item.value);
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  if (
    [...form.keys()].some((key) => !keys.includes(key)) ||
    keys.some((key) => form.getAll(key).length !== 1)
  )
    return null;
  return form;
}
