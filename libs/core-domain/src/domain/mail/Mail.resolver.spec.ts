import { GetUserResult } from '../user/result/GetUserResult';

import { MailResolver } from './Mail.resolver';

describe('MailResolver', () => {
  const resolver = new MailResolver();

  const buildUser = (overrides: Partial<{ email: string; firstname: string | null; lastname: string | null }> = {}): GetUserResult =>
    GetUserResult.of({
      id: 1,
      email: overrides.email ?? 'alice@test.com',
      firstname: overrides.firstname === undefined ? 'Alice' : overrides.firstname,
      lastname: overrides.lastname === undefined ? 'Anderson' : overrides.lastname,
      avatarUrl: null,
      status: 'ACTIVE',
      defaultLanguage: 'en-US',
      createdAt: new Date('2026-01-01'),
    });

  it('firstname + lastname 이 모두 있으면 fullname 사용', () => {
    expect(resolver.resolve(buildUser())).toBe('Alice Anderson');
  });

  it('firstname 만 있으면 firstname 만', () => {
    expect(resolver.resolve(buildUser({ lastname: null }))).toBe('Alice');
  });

  it('이름이 둘 다 없으면 email local-part 로 fallback', () => {
    expect(resolver.resolve(buildUser({ firstname: null, lastname: null }))).toBe('alice');
  });

  it('이름도 email local-part 도 비어있으면 "고객"', () => {
    expect(resolver.resolve(buildUser({ firstname: null, lastname: null, email: '@test.com' }))).toBe('고객');
  });
});
