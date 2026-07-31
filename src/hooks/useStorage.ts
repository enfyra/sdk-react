import { useCallback, useMemo } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { FileRecord, FolderNode } from '@enfyra/sdk-core';
import { useEnfyra } from '../context/EnfyraContext';

export interface StorageUploadOptions {
  folder?: number | string;
  title?: string;
  description?: string;
  storageConfig?: number | string;
  uploadId?: string;
}

export interface UseStorageReturn {
  uploading: boolean;
  upload: (file: File | Blob, options?: StorageUploadOptions) => Promise<FileRecord | null>;
  download: (fileId: number | string) => Promise<Blob | null>;
  getDownloadUrl: (fileId: number | string) => string;
  getFolderTree: () => Promise<FolderNode[] | null>;
}

export function useStorage(): UseStorageReturn {
  const client = useEnfyra();
  const store = useMemo(() => createStore<{ uploading: boolean }>(() => ({ uploading: false })), []);
  const uploading = useStore(store, (s) => s.uploading);

  const upload = useCallback(async (file: File | Blob, options?: StorageUploadOptions): Promise<FileRecord | null> => {
    store.setState({ uploading: true });
    try {
      return await client.storage.upload({ file, ...options });
    } catch {
      return null;
    } finally {
      store.setState({ uploading: false });
    }
  }, [client, store]);

  const download = useCallback((fileId: number | string): Promise<Blob | null> => {
    return client.storage.download(fileId).catch(() => null);
  }, [client]);

  const getDownloadUrl = useCallback((fileId: number | string): string => {
    return client.storage.getDownloadUrl(fileId);
  }, [client]);

  const getFolderTree = useCallback(async (): Promise<FolderNode[] | null> => {
    try {
      return await client.storage.getFolderTree();
    } catch {
      return null;
    }
  }, [client]);

  return { uploading, upload, download, getDownloadUrl, getFolderTree };
}
