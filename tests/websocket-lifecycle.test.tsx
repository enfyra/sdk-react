import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  connect: vi.fn(async () => {}),
  disconnect: vi.fn(),
  client: {
    getHttpClient: () => ({ baseUrl: 'https://app.invalid/api' }),
    auth: { getToken: vi.fn() },
  },
}));
vi.mock('@enfyra/sdk-core', () => ({
  WebSocketClient: class {
    constructor(config: unknown) {
      mocks.config(config);
    }
    on() {}
    connect = mocks.connect;
    disconnect = mocks.disconnect;
  },
}));
vi.mock('../src/context/EnfyraContext', () => ({
  useEnfyra: () => mocks.client,
}));
import { useWebSocket } from '../src/hooks/useWebSocket';
afterEach(cleanup);
it('keeps a manually connected socket across equivalent inline transport options', async () => {
  const hook = renderHook(() =>
    useWebSocket('chat', { transports: ['polling'] }),
  );
  await act(async () => {
    await hook.result.current.connect();
  });
  expect(mocks.config).toHaveBeenCalledWith(
    expect.objectContaining({
      baseUrl: 'https://app.invalid',
      path: '/ws/socket.io',
    }),
  );
  expect(mocks.disconnect).not.toHaveBeenCalled();
  hook.rerender();
  expect(mocks.disconnect).not.toHaveBeenCalled();
  hook.unmount();
  expect(mocks.disconnect).toHaveBeenCalledTimes(1);
});
