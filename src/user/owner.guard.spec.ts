import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OwnerGuard } from '../guards/owner.guard';

type RequestType = {
  user?: {
    sub?: string;
  };
  params?: {
    id?: string;
  };
  body?: {
    id?: string;
  };
};

describe('OwnerGuard', () => {
  let guard: OwnerGuard;

  beforeEach(() => {
    guard = new OwnerGuard();
  });

  function makeCtx(req: RequestType): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;
  }

  it('throws Unauthorized when no user.sub', () => {
    const ctx = makeCtx({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws Forbidden when no target id', () => {
    const ctx = makeCtx({ user: { sub: '1' } });
    expect(() => guard.canActivate(ctx)).toThrow('Missing resource identifier');
  });

  it('throws Forbidden when sub != target', () => {
    const ctx = makeCtx({ user: { sub: '1' }, params: { id: '2' } });
    expect(() => guard.canActivate(ctx)).toThrow(
      'Only owner can perform this action',
    );
  });

  it('returns true when owner', () => {
    const ctx = makeCtx({ user: { sub: '1' }, params: { id: '1' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
