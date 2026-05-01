import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserRepository,
} from '../../../../src/modules/auth/ports/user.repository';
import {
  JwtPayload,
  JwtStrategy,
} from '../../../../src/modules/auth/strategies/jwt.strategy';

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

const makeConfig = (): jest.Mocked<ConfigService> =>
  ({
    getOrThrow: jest.fn().mockReturnValue('secret-32-chars-long-enough-here'),
  }) as unknown as jest.Mocked<ConfigService>;

const makeStrategy = (user: User | null = mockUser) =>
  new JwtStrategy(makeConfig(), makeUserRepo(user));

describe('JwtStrategy', () => {
  describe('validate', () => {
    it('returns user id and email when user exists', async () => {
      const payload: JwtPayload = { sub: '1', email: 'user@test.com' };

      const result = await makeStrategy().validate(payload);

      expect(result).toEqual({ id: '1', email: 'user@test.com' });
    });

    it('throws UnauthorizedException when user not found', async () => {
      const payload: JwtPayload = { sub: 'unknown', email: 'x@test.com' };

      await expect(makeStrategy(null).validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
