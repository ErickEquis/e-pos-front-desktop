import React from 'react';
import { useSelector } from 'react-redux';
import { Toaster } from 'sonner';
import NotificationToast from './notification-toast';

const NotificationManager: React.FC = () => {
    const notifications = useSelector((state: any) => state.notifications.notifications);

    return (
        <>
            {/* Renderizar cada notificación como toast */}
            {notifications.map((notification: any) => (
                <NotificationToast 
                    key={notification.id} 
                    notification={notification} 
                />
            ))}
            
            {/* Toaster de Sonner para mostrar los toasts */}
            <Toaster 
                position="top-right"
                richColors
                closeButton
                duration={5000}
            />
        </>
    );
};

export default NotificationManager; 