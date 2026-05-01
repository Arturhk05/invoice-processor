import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import { RefreshTokenRepository } from '../../../../src/modules/auth/ports/refresh-token.repository';
import {
  User,
  UserRepository,
} from '../../../../src/modules/auth/ports/user.repository';

const mockUser: User = {
  id: '1',
  email: 'user@test.com',
  passwordHash: bcrypt.hashSync('password123', 1),
};

const makeUserRepo = (
  user: User | null = mockUser,
): jest.Mocked<UserRepository> => ({
  findByEmail: jest.fn().mockResolvedValue(user),
  findById: jest.fn().mockResolvedValue(user),
});

const makeRefreshRepo = (): jest.Mocked<RefreshTokenRepository> => ({
  save: jest.fn().mockResolvedValue(undefined),
  find: jest.fn().mockResolvedValue('1'),
  delete: jest.fn().mockResolvedValue(undefined),
});

const makeJwt = (): jest.Mocked<JwtService> =>
  ({
    sign: jest
      .fn()
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token'),
  }) as unknown as jest.Mocked<JwtService>;

const makeConfig = (): jest.Mocked<ConfigService> =>
  ({
    getOrThrow: jest.fn().mockReturnValue('secret'),
  }) as unknown as jest.Mocked<ConfigService>;

describe('AuthService', () => {
  describe('login', () => {
    it('returns access and refresh tokens on valid credentials', async () => {
      const service = new AuthService(
        makeUserRepo(),
        makeRefreshRepo(),
        makeJwt(),
        makeConfig(),
      );

      const result = await service.login('user@test.com', 'password123');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('throws UnauthorizedException when email not found', async () => {
      const service = new AuthService(
        makeUserRepo(null),
        makeRefreshRepo(),
        makeJwt(),
        makeConfig(),
      );

      await expect(
        service.login('unknown@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const service = new AuthService(
        makeUserRepo(),
        makeRefreshRepo(),
        makeJwt(),
        makeConfig(),
      );

      await expect(
        service.login('user@test.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('saves refresh token to store after login', async () => {
      const refreshRepo = makeRefreshRepo();
      const service = new AuthService(
        makeUserRepo(),
        refreshRepo,
        makeJwt(),
        makeConfig(),
      );

      await service.login('user@test.com', 'password123');

      expect(refreshRepo.save).toHaveBeenCalledWith('1', 'refresh-token');
    });
  });

  describe('refresh', () => {
    it('deletes old token and issues new tokens', async () => {
      const refreshRepo = makeRefreshRepo();
      const service = new AuthService(
        makeUserRepo(),
        refreshRepo,
        makeJwt(),
        makeConfig(),
      );

      const result = await service.refresh(
        '1',
        'user@test.com',
        'old-refresh-token',
      );

      expect(refreshRepo.delete).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('saves new refresh token after rotation', async () => {
      const refreshRepo = makeRefreshRepo();
      const service = new AuthService(
        makeUserRepo(),
        refreshRepo,
        makeJwt(),
        makeConfig(),
      );

      await service.refresh('1', 'user@test.com', 'old-refresh-token');

      expect(refreshRepo.save).toHaveBeenCalledWith('1', 'refresh-token');
    });
  });
});
