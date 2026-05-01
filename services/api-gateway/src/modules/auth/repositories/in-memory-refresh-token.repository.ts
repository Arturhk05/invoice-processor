import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../ports/refresh-token.repository.js';

@Injectable()
export class InMemoryRefreshTokenRepository extends RefreshTokenRepository {
  private readonly tokens = new Map<string, string>();

  save(userId: string, token: string): Promise<void> {
    this.tokens.set(token, userId);
    return Promise.resolve();
  }

  find(token: string): Promise<string | null> {
    return Promise.resolve(this.tokens.get(token) ?? null);
  }

  delete(token: string): Promise<void> {
    this.tokens.delete(token);
    return Promise.resolve();
  }
}
