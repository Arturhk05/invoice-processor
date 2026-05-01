export abstract class RefreshTokenRepository {
  abstract save(userId: string, token: string): Promise<void>;
  abstract find(token: string): Promise<string | null>;
  abstract delete(token: string): Promise<void>;
}
