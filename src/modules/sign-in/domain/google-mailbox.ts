/** Google must still control the mailbox; verification alone is not authority. */
export function googleMailboxAuthority(profile: {
  email?: string;
  email_verified?: boolean;
  hd?: unknown;
}) {
  return (
    profile.email_verified === true &&
    (/@(?:gmail|googlemail)\.com$/i.test(profile.email ?? "") ||
      (typeof profile.hd === "string" && profile.hd.trim().length > 0))
  );
}
