import type {
  AuthLoginResult,
  EnfyraClient,
  EnfyraClientConfig,
  LoginCredentials,
  RequestStatus,
  UserInfo,
  EnfyraError,
  MutationParams,
  WebSocketConfig,
} from '@enfyra/sdk-core';
import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';

export interface RequestState<T> {
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

export interface UseWebSocketOptions extends Pick<
  WebSocketConfig,
  | 'path'
  | 'namespacePrefix'
  | 'withCredentials'
  | 'reconnect'
  | 'maxReconnectAttempts'
  | 'reconnectInterval'
  | 'reconnectDelayMax'
  | 'transports'
  | 'upgrade'
> {
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

export interface EnfyraProviderProps {
  config?: ReactClientConfig;
  children: ReactNode;
}

export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  pending: boolean;
  status: RequestStatus | null;
  error: Error | null;
}

export interface AuthActions {
  refresh: () => Promise<UserInfo | null>;
  setUser: (user: UserInfo | null) => void;
  setPending: (pending: boolean, status?: RequestStatus | null) => void;
  setError: (error: Error | null) => void;
  login: (credentials: LoginCredentials) => Promise<AuthLoginResult | null>;
  logout: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export interface UseAuthReturn extends AuthState {
  login: AuthActions['login'];
  logout: AuthActions['logout'];
  refresh: AuthActions['refresh'];
}

export interface EnfyraContextValue {
  client: EnfyraClient;
  authStore: StoreApi<AuthStore>;
}

export type ReactClientConfig = string | EnfyraClientConfig;

export type {
  AuthLoginResult,
  AuthTokens,
  EnfyraClientConfig,
  EnfyraError,
  FileRecord,
  FilterObject,
  FolderNode,
  LoginCredentials,
  MutationOperation,
  MutationOptions,
  MutationParams,
  QueryOptions,
  RequestStatus,
  StorageConfigRecord,
  UserInfo,
  WebSocketConfig,
  WebSocketEvent,
  WebSocketTransport,
} from '@enfyra/sdk-core';
