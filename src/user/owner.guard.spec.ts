/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ExecutionContext } from '@nestjs/common';
import { OwnerGuard } from './owner.guard';
import { describe, beforeEach, it } from 'node:test';

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

function expect(value: any) {
  return {
    toThrow: () => {
      try {
        value();
        throw new AssertionError('Expected function to throw');
      } catch (error) {
        if (error instanceof AssertionError) throw error;
      }
    },
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new AssertionError(`Expected ${value} to be ${expected}`);
      }
    },
  };
}

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}
