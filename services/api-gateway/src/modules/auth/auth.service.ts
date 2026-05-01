import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RefreshTokenRepository } from './ports/refresh-token.repository.js';
import { UserRepository } from './ports/user.repository.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens({ sub: user.id, email: user.email });
  }

  async refresh(userId: string, email: string, oldToken: string) {
    await this.refreshTokens.delete(oldToken);
    return this.issueTokens({ sub: userId, email });
  }

  private async issueTokens(payload: JwtPayload) {
    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.config.getOrThrow<string>(
        'jwt.refreshExpiration',
      ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    await this.refreshTokens.save(payload.sub, refreshToken);

    return { accessToken, refreshToken };
  }
}
