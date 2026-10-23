import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useMutation, useQuery } from '../src/hooks/useApi';
const state = vi.hoisted(() => ({ client: { from: vi.fn() } }));
vi.mock('../src/context/EnfyraContext', () => ({
  useEnfyra: () => state.client,
}));
afterEach(cleanup);

it('does not let an old table response replace the current query result', async () => {
  let resolve!: (value: any) => void;
  state.client.from.mockImplementation((table) => ({
    execute: () =>
      table === 'old'
        ? new Promise((done) => {
            resolve = done;
          })
        : Promise.resolve({ data: 'new' }),
  }));
  const hook = renderHook(({ table }) => useQuery(table), {
    initialProps: { table: 'old' },
  });
  await act(async () => hook.rerender({ table: 'new' }));
  expect(hook.result.current.data).toBe('new');
  await act(async () => resolve({ data: 'old' }));
  expect(hook.result.current.data).toBe('new');
});

it('settles a bulk mutation only after every started write finishes', async () => {
  let resolve!: (value: any) => void;
  const onSettled = vi.fn();
  state.client.from.mockImplementation(() => ({
    byId: (id: number) => ({
      update: () =>
        id === 1
          ? Promise.reject(new Error('denied'))
          : new Promise((done) => {
              resolve = done;
            }),
    }),
  }));
  const hook = renderHook(() =>
    useMutation('records', { operation: 'update', onSettled }),
  );
  let completion!: Promise<unknown>;
  await act(async () => {
    completion = hook.result.current.execute({ ids: [1, 2], data: {} });
    await Promise.resolve();
  });
  expect(onSettled).not.toHaveBeenCalled();
  expect(hook.result.current.pending).toBe(true);
  await act(async () => {
    resolve({ data: 'done' });
    await completion;
  });
  expect(onSettled).toHaveBeenCalledTimes(1);
  expect(hook.result.current.pending).toBe(false);
});
