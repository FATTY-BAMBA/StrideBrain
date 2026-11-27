export interface SignInCounterPort {
  consume(
    key: string,
    limits: { shortSeconds: number; shortMax: number; dayMax: number },
  ): Promise<boolean>;
}
