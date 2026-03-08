import { createSlice } from "@reduxjs/toolkit";

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    timestamp: number;
    isRead?: boolean;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface NotificationState {
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    isLoading: false,
    error: null,
};

export const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        startLoadingNotifications: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        errorNotifications: (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        },
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            // Mantener solo las últimas 50 notificaciones
            if (state.notifications.length > 50) {
                state.notifications = state.notifications.slice(0, 50);
            }
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                notification => notification.id !== action.payload
            );
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        markAsRead: (state, action) => {
            const notification = state.notifications.find(
                n => n.id === action.payload
            );
            if (notification) {
                notification.isRead = true;
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(notification => {
                notification.isRead = true;
            });
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
            state.isLoading = false;
        },
    },
});

export const {
    startLoadingNotifications,
    errorNotifications,
    addNotification,
    removeNotification,
    clearNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
} = notificationSlice.actions; 