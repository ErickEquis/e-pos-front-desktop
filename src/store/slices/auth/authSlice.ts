import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
    name: "auth",
    initialState: {
        currentUser: null,
        isAuthenticated: false,
        loading: true, // <-- Cambiado de isLoading a loading y valor inicial true
        error: null,
        mensaje: null,
    },
    reducers: {
        cleanAuthState(state) {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            state.mensaje = null;
        },
        startLoadingAuth(state) {
            state.error = null;
            state.currentUser = null;
            state.isAuthenticated = false;
            state.loading = true;
        },
        setLoading(state, action) { // <-- Nuevo reducer
            state.loading = action.payload;
        },
        errorAuth(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        loginSuccess(state, action) {
            state.loading = false;
            state.isAuthenticated = true;
            state.currentUser = action.payload;
        },
        registroSuccess(state, action) {
            state.loading = false;
            state.mensaje = action.payload.mensaje;
        },
        recuperarPwdSuccess(state, action) {
            state.loading = false;
            state.mensaje = action.payload.mensaje;
        },
        logout(state) {
            state.currentUser = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            state.mensaje = null;
        },
    },
})

export const {
    loginSuccess,
    logout,
    startLoadingAuth,
    errorAuth,
    registroSuccess,
    cleanAuthState,
    recuperarPwdSuccess,
    setLoading // <-- Exportar el nuevo reducer
} = authSlice.actions;