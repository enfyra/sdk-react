import * as react from 'react';
import { ReactNode } from 'react';
import { UserInfo, RequestStatus, EnfyraClientConfig, EnfyraClient, LoginCredentials, AuthLoginResult, EnfyraError, MutationParams, MutationOptions, QueryOptions, FileRecord, FolderNode } from '@enfyra/sdk-core';
export { AuthLoginResult, AuthTokens, EnfyraClientConfig, EnfyraError, FileRecord, FilterObject, FolderNode, LoginCredentials, MutationOperation, MutationOptions, MutationParams, QueryOptions, RequestStatus, StorageConfigRecord, UserInfo, WebSocketConfig } from '@enfyra/sdk-core';

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    pending: boolean;
    status: RequestStatus | null;
    error: Error | null;
}
interface AuthActions {
    refresh: () => Promise<UserInfo | null>;
    setUser: (user: UserInfo | null) => void;
    setPending: (pending: boolean, status?: RequestStatus | null) => void;
    setError: (error: Error | null) => void;
}
type AuthStore = AuthState & AuthActions;

type ReactClientConfig = string | EnfyraClientConfig;

interface EnfyraProviderProps {
    config: ReactClientConfig;
    children: ReactNode;
}
declare function EnfyraProvider({ config, children }: EnfyraProviderProps): react.JSX.Element;
declare function useEnfyra(): EnfyraClient;

interface UseAuthReturn {
    user: AuthStore['user'];
    isAuthenticated: boolean;
    pending: boolean;
    status: AuthStore['status'];
    error: Error | null;
    login: (credentials: LoginCredentials) => Promise<AuthLoginResult | null>;
    logout: () => Promise<void>;
    refresh: () => Promise<AuthStore['user']>;
}
declare function useAuth(): UseAuthReturn;

interface RequestState<T> {
    data: T | null;
    error: EnfyraError | null;
    pending: boolean;
    status: RequestStatus | null;
}
interface UseQueryReturn<T> extends RequestState<T> {
    meta: {
        totalCount?: number;
        filterCount?: number;
    } | null;
    refresh: () => Promise<T | null>;
}
interface UseMutationReturn<T> extends RequestState<T> {
    execute: (params: MutationParams) => Promise<T | null>;
}
declare function useQuery<T = unknown>(table: string, options?: QueryOptions): UseQueryReturn<T>;
declare function useMutation<T = unknown>(table: string, options?: MutationOptions): UseMutationReturn<T>;

interface StorageUploadOptions {
    folder?: number | string;
    title?: string;
    description?: string;
    storageConfig?: number | string;
    uploadId?: string;
}
interface UseStorageReturn {
    uploading: boolean;
    upload: (file: File | Blob, options?: StorageUploadOptions) => Promise<FileRecord | null>;
    download: (fileId: number | string) => Promise<Blob | null>;
    getDownloadUrl: (fileId: number | string) => string;
    getFolderTree: () => Promise<FolderNode[] | null>;
}
declare function useStorage(): UseStorageReturn;

interface UseWebSocketOptions {
    baseUrl?: string;
    immediate?: boolean;
}
interface UseWebSocketReturn {
    connected: boolean;
    connecting: boolean;
    error: Error | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    emit: (event: string, data: unknown) => void;
    on: (event: string, handler: (data?: unknown) => void) => () => void;
}
declare function useWebSocket(gateway: string, options?: UseWebSocketOptions): UseWebSocketReturn;

export { EnfyraProvider, useAuth, useEnfyra, useMutation, useQuery, useStorage, useWebSocket };
export type { EnfyraProviderProps, ReactClientConfig, StorageUploadOptions, UseAuthReturn, UseMutationReturn, UseQueryReturn, UseStorageReturn, UseWebSocketOptions, UseWebSocketReturn };
