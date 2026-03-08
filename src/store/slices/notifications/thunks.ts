import { eposApi } from "@/api/e-posApi";
import { 
    addNotification, 
    removeNotification, 
    clearNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
    startLoadingNotifications,
    errorNotifications,
    type Notification
} from "./notificationSlice";

// Función para generar ID único
const generateNotificationId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Función para crear notificación con toast automático
export const showNotification = (notificationData: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}) => {
    return (dispatch, getState) => {
        const notification: Notification = {
            id: generateNotificationId(),
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            duration: notificationData.duration || 5000,
            timestamp: Date.now(),
            isRead: false,
            action: notificationData.action,
        };

        dispatch(addNotification(notification));

        // Auto-remover después del tiempo especificado
        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                dispatch(removeNotification(notification.id));
            }, notification.duration);
        }

        return notification.id;
    };
};

// Función para mostrar notificación de éxito
export const showSuccessNotification = (title: string, message: string, duration?: number) => {
    return showNotification({
        type: 'success',
        title,
        message,
        duration,
    });
};

// Función para mostrar notificación de error
export const showErrorNotification = (title: string, message: string, duration?: number) => {
    return showNotification({
        type: 'error',
        title,
        message,
        duration,
    });
};

// Función para mostrar notificación de advertencia
export const showWarningNotification = (title: string, message: string, duration?: number) => {
    return showNotification({
        type: 'warning',
        title,
        message,
        duration,
    });
};

// Función para mostrar notificación informativa
export const showInfoNotification = (title: string, message: string, duration?: number) => {
    return showNotification({
        type: 'info',
        title,
        message,
        duration,
    });
};

// Función para manejar errores de API automáticamente
export const handleApiError = (error: any, defaultMessage: string = 'Ha ocurrido un error') => {
    return (dispatch, getState) => {
        let errorMessage = defaultMessage;
        
        if (error.response?.data?.mensaje) {
            errorMessage = error.response.data.mensaje;
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        dispatch(showErrorNotification('', errorMessage));
    };
};

// Función para manejar respuestas exitosas de API
export const handleApiSuccess = (message: string, title: string = '') => {
    return (dispatch, getState) => {
        dispatch(showSuccessNotification(title, message));
    };
};

// Función para obtener notificaciones del servidor (si se implementa en el futuro)
export const fetchNotifications = () => {
    return async (dispatch, getState) => {
        try {
            dispatch(startLoadingNotifications());
            const response = await eposApi.get('/notificaciones');
            dispatch(setNotifications(response.data));
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            dispatch(errorNotifications('Error al cargar notificaciones'));
        }
    };
};

// Función para marcar notificación como leída en el servidor
export const markNotificationAsRead = (notificationId: string) => {
    return async (dispatch, getState) => {
        try {
            await eposApi.patch(`/notificaciones/${notificationId}/read`);
            dispatch(markAsRead(notificationId));
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    };
};

// Función para marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = () => {
    return async (dispatch, getState) => {
        try {
            await eposApi.patch('/notificaciones/read-all');
            dispatch(markAllAsRead());
        } catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
        }
    };
};

// Función para eliminar notificación del servidor
export const deleteNotification = (notificationId: string) => {
    return async (dispatch, getState) => {
        try {
            await eposApi.delete(`/notificaciones/${notificationId}`);
            dispatch(removeNotification(notificationId));
        } catch (error) {
            console.error('Error al eliminar notificación:', error);
        }
    };
};

// Función para limpiar todas las notificaciones
export const clearAllNotifications = () => {
    return async (dispatch, getState) => {
        try {
            await eposApi.delete('/notificaciones');
            dispatch(clearNotifications());
        } catch (error) {
            console.error('Error al limpiar notificaciones:', error);
        }
    };
}; 