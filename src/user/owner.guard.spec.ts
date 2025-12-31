/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExecutionContext } from '@nestjs/common';
import { OwnerGuard } from './owner.guard';

describe('OwnerGuard', () => {
  let guard: OwnerGuard;

  beforeEach(() => {
    guard = new OwnerGuard();
  });

  function makeCtx(req: any): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  it('throws Unauthorized when no user.sub', () => {
    const ctx = makeCtx({});
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('throws Forbidden when no target id', () => {
    const ctx = makeCtx({ user: { sub: '1' } });
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('throws Forbidden when sub != target', () => {
    const ctx = makeCtx({ user: { sub: '1' }, params: { id: '2' } });
    expect(() => guard.canActivate(ctx)).toThrow();
  });

  it('returns true when owner', () => {
    const ctx = makeCtx({ user: { sub: '1' }, params: { id: '1' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
