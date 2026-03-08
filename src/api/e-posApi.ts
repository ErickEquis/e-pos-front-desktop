import { cleanAuthState } from "@/store/slices/auth/authSlice";
import { logout } from "@/store/slices/e-pos/ePosSlice";
import axios from "axios";

// Permite actualización asíncrona del baseURL
export const eposApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Inicialización de Electron IPC para obtener puerto si está disponible
export const initializeAxiosUrl = async () => {
    // @ts-ignore - Validamos existencia del objeto inyectado en WebPreferences
    if (window.electronAPI && window.electronAPI.getBackendPort) {
        try {
            // @ts-ignore
            const port = await window.electronAPI.getBackendPort();
            if (port) {
                console.log(`Axios reconfigurado para usar puerto local: ${port}`);
                eposApi.defaults.baseURL = `http://localhost:${port}/api`;
            }
        } catch (err) {
            console.error("Error obteniendo puerto de Electron", err);
        }
    }
};

eposApi.interceptors.request.use(
    (config) => {

        if (config.url.includes("auth") && !config.url.includes("cambiar-contrasenia")) {
            return config;
        }

        const token = JSON.parse(localStorage.getItem("data") || "{}").token;
        if (token) {
            config.headers.authorization = `${token}`;
        }
        return config;
    },
    (error) => {
        console.log({ error });
        return Promise.reject(error);
    }
);

eposApi.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("data");
            cleanAuthState();
            logout();
            window.location.replace("/login");
        }
        return Promise.reject(error);
    }
);