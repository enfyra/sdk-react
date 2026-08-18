import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { WebSocketClient } from '@enfyra/sdk-core';
import type { WebSocketConfig, WebSocketEvent } from '@enfyra/sdk-core';
import { useEnfyra } from '../context/EnfyraContext';

export interface UseWebSocketOptions extends Pick<WebSocketConfig, 'path' | 'namespacePrefix' | 'withCredentials' | 'reconnect' | 'maxReconnectAttempts' | 'reconnectInterval' | 'reconnectDelayMax' | 'transports' | 'upgrade'> {
  baseUrl?: string;
  immediate?: boolean;
}

export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data: unknown) => void;
  on: (event: string, handler: (data?: unknown) => void) => () => void;
}

interface WsState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useWebSocket(gateway: string, options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const client = useEnfyra();
  const { immediate = false } = options;

  const store = useMemo(() => createStore<WsState>(() => ({
    connected: false,
    connecting: false,
    error: null,
  })), []);

  const wsRef = useRef<WebSocketClient | null>(null);
  const unsubscribesRef = useRef<Array<() => void>>([]);

  const connected = useStore(store, (s) => s.connected);
  const connecting = useStore(store, (s) => s.connecting);
  const error = useStore(store, (s) => s.error);

  const connect = useCallback(async (): Promise<void> => {
    if (wsRef.current) return;
    store.setState({ connecting: true, error: null });

    const baseUrl = options.baseUrl ?? client.getHttpClient().baseUrl.replace(/\/api\/?$/, '');
    const socketConfig: WebSocketConfig = {
      baseUrl,
      gateway,
      getAuthToken: () => client.auth.getToken(),
    };
    if (options.path !== undefined) socketConfig.path = options.path;
    if (options.namespacePrefix !== undefined) socketConfig.namespacePrefix = options.namespacePrefix;
    if (options.withCredentials !== undefined) socketConfig.withCredentials = options.withCredentials;
    if (options.reconnect !== undefined) socketConfig.reconnect = options.reconnect;
    if (options.maxReconnectAttempts !== undefined) socketConfig.maxReconnectAttempts = options.maxReconnectAttempts;
    if (options.reconnectInterval !== undefined) socketConfig.reconnectInterval = options.reconnectInterval;
    if (options.reconnectDelayMax !== undefined) socketConfig.reconnectDelayMax = options.reconnectDelayMax;
    if (options.transports !== undefined) socketConfig.transports = options.transports;
    if (options.upgrade !== undefined) socketConfig.upgrade = options.upgrade;
    const ws = new WebSocketClient(socketConfig);

    ws.on('connect', () => store.setState({ connected: true, connecting: false }));
    ws.on('disconnect', () => store.setState({ connected: false }));
    ws.on('connect_error', (value) => {
      store.setState({
        error: value instanceof Error ? value : new Error(String(value)),
        connecting: false,
      });
    });

    wsRef.current = ws;
    try {
      await ws.connect();
    } catch (value) {
      const err = value instanceof Error ? value : new Error(String(value));
      store.setState({ error: err, connecting: false });
      wsRef.current = null;
      throw err;
    }
  }, [client, gateway, options.baseUrl, options.path, options.namespacePrefix, options.withCredentials, options.reconnect, options.maxReconnectAttempts, options.reconnectInterval, options.reconnectDelayMax, options.transports, options.upgrade, store]);

  const disconnect = useCallback((): void => {
    unsubscribesRef.current.forEach((fn) => fn());
    unsubscribesRef.current = [];
    wsRef.current?.disconnect();
    wsRef.current = null;
    store.setState({ connected: false, connecting: false });
  }, [store]);

  const emit = useCallback((event: string, data: unknown): void => {
    wsRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (data?: unknown) => void): (() => void) => {
    if (!wsRef.current) throw new Error('Not connected. Call connect() first.');
    const unsubscribe = wsRef.current.on(event as WebSocketEvent, handler);
    unsubscribesRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (immediate) void connect().catch(() => undefined);
    return disconnect;
  }, [immediate, connect, disconnect]);

  return { connected, connecting, error, connect, disconnect, emit, on };
}
