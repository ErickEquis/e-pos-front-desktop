import { useEffect, useState } from 'react';

export interface UpdaterStatus {
    status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';
    progress: number;
    version?: string;
    error?: string;
}

export function useUpdater() {
    const [updater, setUpdater] = useState<UpdaterStatus>({
        status: 'idle',
        progress: 0,
    });

    useEffect(() => {
        const win = window as any;
        if (!win.electronAPI || !win.electronAPI.updater) {
            console.warn('Updater no disponible en este entorno');
            return;
        }

        win.electronAPI.updater.onStatus((channel: string, data: any) => {
            switch (channel) {
                case 'updater:available':
                    setUpdater(prev => ({ ...prev, status: 'available', version: data.version }));
                    break;
                case 'updater:progress':
                    setUpdater(prev => ({ ...prev, status: 'downloading', progress: data.percent }));
                    break;
                case 'updater:ready':
                    setUpdater(prev => ({ ...prev, status: 'ready', version: data.version }));
                    break;
                case 'updater:error':
                    setUpdater(prev => ({ ...prev, status: 'error', error: data }));
                    break;
            }
        });
    }, []);

    const installNow = () => {
        (window as any).electronAPI.updater.installNow();
    };

    const checkNow = () => {
        (window as any).electronAPI.updater.checkNow();
    };

    return { ...updater, installNow, checkNow };
}
