import * as bcrypt from 'bcryptjs';
import { InMemoryUserRepository } from '../../../../src/modules/auth/repositories/in-memory-user.repository';

const makeRepo = () => new InMemoryUserRepository();

describe('InMemoryUserRepository', () => {
  describe('onModuleInit', () => {
    it('seeds admin user with valid bcrypt hash', async () => {
      const repo = makeRepo();
      await repo.onModuleInit();

      const user = await repo.findByEmail('admin@invoice-processor.com');

      expect(user).not.toBeNull();
      expect(await bcrypt.compare('admin123456', user!.passwordHash)).toBe(
        true,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns user when email matches', async () => {
      const repo = makeRepo();
      await repo.onModuleInit();

      const user = await repo.findByEmail('admin@invoice-processor.com');

      expect(user).toMatchObject({
        id: '1',
        email: 'admin@invoice-processor.com',
      });
    });

    it('returns null when email not found', async () => {
      const repo = makeRepo();
      await repo.onModuleInit();

      const user = await repo.findByEmail('unknown@test.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when id matches', async () => {
      const repo = makeRepo();
      await repo.onModuleInit();

      const user = await repo.findById('1');

      expect(user).toMatchObject({
        id: '1',
        email: 'admin@invoice-processor.com',
      });
    });

    it('returns null when id not found', async () => {
      const repo = makeRepo();
      await repo.onModuleInit();

      const user = await repo.findById('999');

      expect(user).toBeNull();
    });
  });
});
