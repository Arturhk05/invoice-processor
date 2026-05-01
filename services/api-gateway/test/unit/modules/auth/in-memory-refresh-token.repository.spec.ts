import { InMemoryRefreshTokenRepository } from '../../../../src/modules/auth/repositories/in-memory-refresh-token.repository';

const makeRepo = () => new InMemoryRefreshTokenRepository();

describe('InMemoryRefreshTokenRepository', () => {
  it('finds token after saving', async () => {
    const repo = makeRepo();
    await repo.save('user-1', 'token-abc');

    expect(await repo.find('token-abc')).toBe('user-1');
  });

  it('returns null for unknown token', async () => {
    const repo = makeRepo();

    expect(await repo.find('nonexistent')).toBeNull();
  });

  it('returns null after deleting token', async () => {
    const repo = makeRepo();
    await repo.save('user-1', 'token-abc');
    await repo.delete('token-abc');

    expect(await repo.find('token-abc')).toBeNull();
  });

  it('deleting one token does not affect others', async () => {
    const repo = makeRepo();
    await repo.save('user-1', 'token-a');
    await repo.save('user-2', 'token-b');
    await repo.delete('token-a');

    expect(await repo.find('token-b')).toBe('user-2');
  });
});
