import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenRepository } from '../../../../src/modules/auth/ports/refresh-token.repository';
import {
  User,
  UserRepository,
} from '../../../../src/modules/auth/ports/user.repository';
import { JwtRefreshStrategy } from '../../../../src/modules/auth/strategies/jwt-refresh.strategy';

const mockUser: User = {
  id: '1',
  email: 'user@test.com',
  passwordHash: 'hash',
};

const makeUserRepo = (
  user: User | null = mockUser,
): jest.Mocked<UserRepository> => ({
  findByEmail: jest.fn(),
  findById: jest.fn().mockResolvedValue(user),
});

const makeRefreshRepo = (
  userId: string | null = '1',
): jest.Mocked<RefreshTokenRepository> => ({
  save: jest.fn(),
  find: jest.fn().mockResolvedValue(userId),
  delete: jest.fn(),
});

const makeConfig = (): jest.Mocked<ConfigService> =>
  ({
    getOrThrow: jest.fn().mockReturnValue('secret-32-chars-long-enough-here'),
  }) as unknown as jest.Mocked<ConfigService>;

const makeStrategy = (
  userId: string | null = '1',
  user: User | null = mockUser,
) =>
  new JwtRefreshStrategy(
    makeConfig(),
    makeUserRepo(user),
    makeRefreshRepo(userId),
  );

const makeReq = (token = 'valid-refresh-token') => ({
  body: { refreshToken: token },
});

describe('JwtRefreshStrategy', () => {
  describe('validate', () => {
    it('returns user and token when token exists in store', async () => {
      const result = await makeStrategy().validate(makeReq());

      expect(result).toEqual({
        id: '1',
        email: 'user@test.com',
        refreshToken: 'valid-refresh-token',
      });
    });

    it('throws UnauthorizedException when token not in store', async () => {
      await expect(makeStrategy(null).validate(makeReq())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when token is valid but user no longer exists', async () => {
      await expect(makeStrategy('1', null).validate(makeReq())).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
