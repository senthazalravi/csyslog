import { useState, useEffect, useRef } from 'react';

export interface TacticalWatcherState {
    isWatching: boolean;
    lastChecked: Date | null;
    error: string | null;
    directoryName: string | null;
}

export const useTacticalWatcher = (
    onNewFile: (name: string, content: string) => void
) => {
    const [state, setState] = useState<TacticalWatcherState>({
        isWatching: false,
        lastChecked: null,
        error: null,
        directoryName: null,
    });

    const directoryHandleRef = useRef<any>(null);
    const processedFilesRef = useRef<Set<string>>(new Set());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startWatching = async () => {
        try {
            // @ts-ignore - File System Access API
            const handle = await window.showDirectoryPicker({
                mode: 'read',
            });

            directoryHandleRef.current = handle;
            setState(prev => ({
                ...prev,
                isWatching: true,
                directoryName: handle.name,
                error: null
            }));

            // Initial scan to mark existing files as processed 
            // (so we don't re-analyze the whole history immediately)
            const existingFiles = await getFiles();
            existingFiles.forEach(f => processedFilesRef.current.add(f));

            // Start polling
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(checkForNewFiles, 5000); // Check every 5s
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setState(prev => ({ ...prev, error: err.message }));
            }
        }
    };

    const stopWatching = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        directoryHandleRef.current = null;
        processedFilesRef.current.clear();
        setState({
            isWatching: false,
            lastChecked: null,
            error: null,
            directoryName: null,
        });
    };

    const getFiles = async (): Promise<string[]> => {
        if (!directoryHandleRef.current) return [];
        const files: string[] = [];
        // @ts-ignore
        for await (const entry of directoryHandleRef.current.values()) {
            if (entry.kind === 'file') {
                files.push(entry.name);
            }
        }
        return files;
    };

    const checkForNewFiles = async () => {
        if (!directoryHandleRef.current) return;

        try {
            // @ts-ignore
            for await (const entry of directoryHandleRef.current.values()) {
                if (entry.kind === 'file' && !processedFilesRef.current.has(entry.name)) {
                    // New file detected!
                    const file = await entry.getFile();
                    const content = await file.text();

                    processedFilesRef.current.add(entry.name);
                    onNewFile(entry.name, content);
                }
            }
            setState(prev => ({ ...prev, lastChecked: new Date() }));
        } catch (err: any) {
            console.error('Tactical Watcher error:', err);
            setState(prev => ({ ...prev, error: 'Watcher connection lost. Please restart.' }));
            stopWatching();
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        ...state,
        startWatching,
        stopWatching,
    };
};
