import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/auth/authSlice";
import { ePosSlice } from "./slices/e-pos/ePosSlice";
import { notificationSlice } from "./slices/notifications/notificationSlice";
import usersSlice from "./slices/users/usersSlice";

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        ePos: ePosSlice.reducer,
        notifications: notificationSlice.reducer,
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;