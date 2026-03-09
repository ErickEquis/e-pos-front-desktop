import { useEffect } from 'react';
import { useUpdater } from '@/hooks/useUpdater';
import { toast } from 'sonner';

export function UpdaterNotification() {
    const { status, version } = useUpdater();

    useEffect(() => {
        if (status === 'available') {
            toast.info('Nueva actualización detectada', {
                description: `La versión ${version} se está descargando en segundo plano.`,
                duration: 5000,
            });
        }

        if (status === 'error') {
            toast.error('Error al actualizar', {
                description: 'Hubo un problema al descargar la nueva versión.',
            });
        }
    }, [status, version]);

    return null;
}
