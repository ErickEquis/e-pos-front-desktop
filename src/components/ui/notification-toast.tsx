import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { removeNotification } from '@/store/slices/notifications/notificationSlice';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationToastProps {
    notification: {
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
        duration?: number;
        action?: {
            label: string;
            onClick: () => void;
        };
    };
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const icon = getIconForType(notification.type);
        const toastOptions = {
            duration: notification.duration || 5000,
            action: notification.action ? {
                label: notification.action.label,
                onClick: notification.action.onClick,
            } : undefined,
        };

        switch (notification.type) {
            case 'success':
                toast.success(notification.message, {
                    ...toastOptions,
                    description: notification.title,
                });
                break;
            case 'error':
                toast.error(notification.message, {
                    ...toastOptions,
                    description: notification.title,
                });
                break;
            case 'warning':
                toast.warning(notification.message, {
                    ...toastOptions,
                    description: notification.title,
                });
                break;
            case 'info':
                toast.info(notification.message, {
                    ...toastOptions,
                    description: notification.title,
                });
                break;
        }

        // Remover la notificación del estado después de mostrarla
        setTimeout(() => {
            dispatch(removeNotification(notification.id));
        }, notification.duration || 5000);
    }, [notification, dispatch]);

    return null; // Este componente no renderiza nada visualmente
};

const getIconForType = (type: string) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-4 h-4" />;
        case 'error':
            return <XCircle className="w-4 h-4" />;
        case 'warning':
            return <AlertTriangle className="w-4 h-4" />;
        case 'info':
            return <Info className="w-4 h-4" />;
        default:
            return null;
    }
};

export default NotificationToast; 