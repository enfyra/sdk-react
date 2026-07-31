import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { isEnfyraError } from '@enfyra/sdk-core';
import type { EnfyraError, MutationOptions, MutationParams, QueryOptions, RequestStatus } from '@enfyra/sdk-core';
import { useEnfyra } from '../context/EnfyraContext';

interface RequestState<T> {
  data: T | null;
  error: EnfyraError | null;
  pending: boolean;
  status: RequestStatus | null;
}

export interface UseQueryReturn<T> extends RequestState<T> {
  meta: { totalCount?: number; filterCount?: number } | null;
  refresh: () => Promise<T | null>;
}

export interface UseMutationReturn<T> extends RequestState<T> {
  execute: (params: MutationParams) => Promise<T | null>;
}

export function useQuery<T = unknown>(
  table: string,
  options: QueryOptions = {},
): UseQueryReturn<T> {
  const client = useEnfyra();
  const { select, filter, sort, limit, page, meta, deep, immediate = true } = options;

  const store = useMemo(() => createStore<RequestState<T> & { meta: { totalCount?: number; filterCount?: number } | null }>(() => ({
    data: null,
    error: null,
    pending: false,
    status: null,
    meta: null,
  })), []);

  const filterKey = JSON.stringify(filter);
  const selectKey = JSON.stringify(select);
  const metaKey = JSON.stringify(meta);
  const deepKey = JSON.stringify(deep);

  const refresh = useCallback(async (): Promise<T | null> => {
    store.setState({ pending: true, status: 'pending', error: null });
    try {
      const builder = client.from<T>(table);
      if (select) builder.select(select);
      if (filter) builder.filter(filter);
      if (sort) builder.sort(sort);
      if (limit !== undefined) builder.limit(limit);
      if (page !== undefined) builder.page(page);
      if (meta) builder.meta(meta);
      if (deep) builder.deep(deep);
      const result = await builder.execute();
      store.setState({ data: result.data as T, meta: result.meta ?? null, pending: false, status: 'success' });
      return result.data as T;
    } catch (err) {
      const enfyraError = isEnfyraError(err)
        ? err
        : ({ message: err instanceof Error ? err.message : 'Request failed', code: 'NETWORK_ERROR' } as EnfyraError);
      store.setState({ error: enfyraError, pending: false, status: 'error' });
      return null;
    }
  }, [client, table, store, selectKey, filterKey, sort, limit, page, metaKey, deepKey]);

  useEffect(() => {
    if (immediate) void refresh();
  }, [refresh, immediate]);

  const data = useStore(store, (s) => s.data);
  const error = useStore(store, (s) => s.error);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);
  const queryMeta = useStore(store, (s) => s.meta);

  return { data, error, pending, status, meta: queryMeta, refresh };
}

export function useMutation<T = unknown>(
  table: string,
  options: MutationOptions = {},
): UseMutationReturn<T> {
  const client = useEnfyra();
  const { operation = 'insert', onSuccess, onError, onSettled } = options;

  const store = useMemo(() => createStore<RequestState<T>>(() => ({
    data: null,
    error: null,
    pending: false,
    status: null,
  })), []);

  const callbacksRef = useRef({ onSuccess, onError, onSettled });
  callbacksRef.current = { onSuccess, onError, onSettled };

  const execute = useCallback(async (params: MutationParams): Promise<T | null> => {
    store.setState({ pending: true, status: 'pending', error: null });
    try {
      let result: T | null = null;

      if (params.ids && params.ids.length > 0) {
        const results = await Promise.all(
          params.ids.map((id) => {
            if (operation === 'delete') return client.from(table).byId(id).delete();
            return client.from<T>(table).byId(id).update(params.data as never);
          }),
        );
        result = results.map((r) => (r as { data?: T } | undefined)?.data ?? null) as unknown as T;
      } else if (operation === 'delete') {
        if (params.id == null) throw new Error('id is required for delete');
        await client.from(table).byId(params.id).delete();
        result = null;
      } else if (operation === 'update') {
        if (params.id == null) throw new Error('id is required for update');
        result = (await client.from<T>(table).byId(params.id).update(params.data as never)).data as T;
      } else {
        result = (await client.from<T>(table).insert(params.data as never)).data as T;
      }

      store.setState({ data: result, pending: false, status: 'success' });
      callbacksRef.current.onSuccess?.(result);
      return result;
    } catch (err) {
      const enfyraError = isEnfyraError(err)
        ? err
        : ({ message: err instanceof Error ? err.message : 'Request failed', code: 'NETWORK_ERROR' } as EnfyraError);
      store.setState({ error: enfyraError, pending: false, status: 'error' });
      callbacksRef.current.onError?.(enfyraError);
      return null;
    } finally {
      callbacksRef.current.onSettled?.();
    }
  }, [client, table, operation, store]);

  const data = useStore(store, (s) => s.data);
  const error = useStore(store, (s) => s.error);
  const pending = useStore(store, (s) => s.pending);
  const status = useStore(store, (s) => s.status);

  return { data, error, pending, status, execute };
}
