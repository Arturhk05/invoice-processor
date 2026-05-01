import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenRepository } from '../ports/refresh-token.repository.js';
import { UserRepository } from '../ports/user.repository.js';
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.getOrThrow<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: { body: { refreshToken: string } }) {
    const token = req.body.refreshToken;
    const userId = await this.refreshTokens.find(token);
    if (!userId) throw new UnauthorizedException();

    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    return { id: user.id, email: user.email, refreshToken: token };
  }
}
