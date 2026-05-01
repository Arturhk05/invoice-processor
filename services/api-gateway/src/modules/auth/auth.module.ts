import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RefreshTokenRepository } from './ports/refresh-token.repository.js';
import { UserRepository } from './ports/user.repository.js';
import { InMemoryRefreshTokenRepository } from './repositories/in-memory-refresh-token.repository.js';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.getOrThrow<string>(
            'jwt.expiration',
          ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
    {
      provide: RefreshTokenRepository,
      useClass: InMemoryRefreshTokenRepository,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
