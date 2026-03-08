import { useDispatch, useSelector } from 'react-redux';
import {
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    showNotification,
    handleApiError,
    handleApiSuccess,
    clearAllNotifications,
} from '@/store/slices/notifications/thunks';
import {
    removeNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
} from '@/store/slices/notifications/notificationSlice';

export const useNotifications = () => {
    const dispatch = useDispatch<any>();
    const notifications = useSelector((state: any) => state.notifications.notifications);
    const isLoading = useSelector((state: any) => state.notifications.isLoading);
    const error = useSelector((state: any) => state.notifications.error);

    return {
        // Estado
        notifications,
        isLoading,
        error,

        // Funciones de notificación
        showSuccess: (title: string, message: string, duration?: number) => 
            dispatch(showSuccessNotification(title, message, duration)),
        
        showError: (title: string, message: string, duration?: number) => 
            dispatch(showErrorNotification(title, message, duration)),
        
        showWarning: (title: string, message: string, duration?: number) => 
            dispatch(showWarningNotification(title, message, duration)),
        
        showInfo: (title: string, message: string, duration?: number) => 
            dispatch(showInfoNotification(title, message, duration)),
        
        showNotification: (notificationData: {
            type: 'success' | 'error' | 'warning' | 'info';
            title: string;
            message: string;
            duration?: number;
            action?: {
                label: string;
                onClick: () => void;
            };
        }) => dispatch(showNotification(notificationData)),

        // Funciones para manejo de API
        handleApiError: (error: any, defaultMessage?: string) => 
            dispatch(handleApiError(error, defaultMessage)),
        
        handleApiSuccess: (message: string, title?: string) => 
            dispatch(handleApiSuccess(message, title)),

        // Funciones de gestión
        removeNotification: (id: string) => 
            dispatch(removeNotification(id)),
        
        clearAll: () => 
            dispatch(clearNotifications()),
        
        markAsRead: (id: string) => 
            dispatch(markAsRead(id)),
        
        markAllAsRead: () => 
            dispatch(markAllAsRead()),
    };
}; 