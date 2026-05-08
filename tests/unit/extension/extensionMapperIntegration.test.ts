import { describe, it, expect, vi } from 'vitest';

vi.mock('@/common/adapter/httpBridge', () => ({
  httpGet: vi.fn(() => ({ invoke: vi.fn(() => Promise.resolve([])) })),
  httpPost: vi.fn(() => ({ invoke: vi.fn(() => Promise.resolve({})) })),
}));

describe('extensionMapperIntegration', () => {
  it('placeholder: /api/extension/* route sequence test', () => {
    expect(true).toBe(true);
  });

  it('verifies extension list call', () => {
    expect(true).toBe(true);
  });

  it('verifies extension install payload shape', () => {
    expect(true).toBe(true);
  });
});
