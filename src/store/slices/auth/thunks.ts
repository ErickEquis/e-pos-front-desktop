import { eposApi } from "@/api/e-posApi";
import {
    cleanAuthState,
    errorAuth,
    loginSuccess,
    recuperarPwdSuccess,
    registroSuccess,
    startLoadingAuth,
    setLoading
} from "./authSlice";
import { handleApiError, handleApiSuccess } from "../notifications/thunks";



export const revisarSesion = () => {
    return (dispatch, getState) => {
        dispatch(setLoading(true));
        try {
            const data = JSON.parse(localStorage.getItem("data"));
            if (!data || !data.token || !data.exp || data.exp < Date.now() / 1000) {
                localStorage.removeItem("data");
                dispatch(cleanAuthState());
                dispatch(setLoading(false));
                return;
            }
            dispatch(loginSuccess(data));
        } catch (e) {
            dispatch(cleanAuthState());
        } finally {
            dispatch(setLoading(false));
        }
    }
}

export const iniciarSesion = (payload) => {
    return async (dispatch, getState) => {
        try {
            const { data } = await eposApi.patch("/auth", payload);
            dispatch(startLoadingAuth());
            dispatch(loginSuccess(data));
            localStorage.setItem("data", JSON.stringify(data));
            dispatch(handleApiSuccess("Sesión iniciada correctamente"));
        } catch (error) {
            console.log(error)
            dispatch(errorAuth(error.response.data.mensaje));
            dispatch(handleApiError(error, "Error al iniciar sesión"));
        }
    }
}

export const cerrarSesion = () => {
    return async (dispatch, getState) => {
        try {
            localStorage.removeItem("data");
            dispatch(cleanAuthState());
        } catch (error) {
            console.log(error)
        }
    }
}

export const crearUsuario = (payload) => {
    return async (dispatch, getState) => {
        // dispatch(startLoadingAuth());

        try {
            const { data } = await eposApi.post("/auth", payload);
            dispatch(registroSuccess(data));
            dispatch(handleApiSuccess(data.mensaje || "Usuario creado correctamente"));
        } catch (error) {
            console.log(error.response.data)
            dispatch(errorAuth(error.response.data));
            dispatch(handleApiError(error, "Error al crear usuario"));
        }
    }
}

export const recuperarPwd = (payload) => {
    return async (dispatch, getState) => {
        // dispatch(startLoadingAuth());

        try {
            const { data } = await eposApi.put("/auth/forgot-pwd", payload);
            dispatch(recuperarPwdSuccess(data));
            dispatch(handleApiSuccess(data.mensaje || "Contraseña enviada al correo"));
            return { success: true };
        } catch (error) {
            console.log(error.response.data)
            dispatch(errorAuth(error.response.data));
            dispatch(handleApiError(error, "Error al recuperar contraseña"));
            return { success: false };
        }
    }
}

export const cambiarContrasenia = (payload) => {
    return async (dispatch, getState) => {
        dispatch(startLoadingAuth());

        try {
            const { data } = await eposApi.put("/auth/cambiar-contrasenia", payload);
            dispatch(recuperarPwdSuccess(data));
            dispatch(handleApiSuccess(data.mensaje || "Contraseña cambiada correctamente"));
            return { success: true, mensaje: data.mensaje };
        } catch (error) {
            dispatch(errorAuth(error.response.data.mensaje));
            dispatch(handleApiError(error, "Error al cambiar la contraseña"));
            return { success: false, mensaje: error.response.data.mensaje };
        }
    }
}
