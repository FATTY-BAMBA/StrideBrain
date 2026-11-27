export interface SignInMailPort {
  send(message: { to: string; subject: string; text: string; html: string }): Promise<void>;
}
