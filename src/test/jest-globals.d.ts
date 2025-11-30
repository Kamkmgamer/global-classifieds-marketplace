import '@testing-library/jest-dom';

declare global {
  // Jest globals with basic typing to avoid 'any'
  const jest: {
    fn: () => jest.MockedFunction<unknown>;
    spyOn: (object: unknown, method: string) => jest.SpyInstance;
    [key: string]: unknown;
  };
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const expect: (actual: unknown) => {
    toBe: (expected: unknown) => void;
    toEqual: (expected: unknown) => void;
    toBeInTheDocument: () => void;
    [key: string]: unknown;
  };
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
}

export {};
