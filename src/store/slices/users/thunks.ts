import { eposApi } from "@/api/e-posApi";
import { 
    setUsers, 
    setRoles, 
    addUser, 
    updateUser, 
    removeUser, 
    setLoading, 
    setError 
} from "./usersSlice";
import { handleApiError, handleApiSuccess } from "../notifications/thunks";
import { User, Role } from "./usersSlice";

// Función para obtener todos los usuarios del equipo
export const obtenerUsuarios = () => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));
            const response = await eposApi.get('/usuarios');

            // Transformar los datos del backend al formato del frontend
            const usuariosTransformados = response.data.map((usuario: any) => ({
                id: usuario.id?.toString() || '',
                nombre: usuario.nombre,
                correo: usuario.correo,
                id_rol: usuario.id_rol,
                id_equipo: usuario.id_equipo,
                estatus: usuario.estatus,
                ultimo_acceso: usuario.ultimo_acceso,
                is_admin: usuario.is_admin,
            }));

            dispatch(setUsers(usuariosTransformados));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            dispatch(handleApiError(error, "Error al cargar usuarios"));
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para obtener roles disponibles
export const obtenerRoles = () => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));
            const response = await eposApi.get('/roles');

            const rolesTransformados = response.data.map((rol: any) => ({
                id: rol.id,
                descripcion: rol.descripcion,
                is_admin: rol.is_admin,
                permisos: rol.permisos,
                estatus: rol.estatus,
            }));

            dispatch(setRoles(rolesTransformados));
        } catch (error) {
            console.error('Error al obtener roles:', error);
            dispatch(handleApiError(error, "Error al cargar roles"));
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para invitar un nuevo usuario por email
export const invitarUsuario = (userData: {
    nombre: string;
    correo: string;
    id_rol: number;
}) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            const response = await eposApi.post('/usuarios/invitar', userData);

            if (response.status === 200) {
                // Recargar la lista de usuarios
                dispatch(obtenerUsuarios());
                dispatch(handleApiSuccess(response.data.mensaje || 'Invitación enviada correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al invitar usuario:', error);
            dispatch(handleApiError(error, 'Error al enviar invitación'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al enviar invitación'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para actualizar un usuario existente
export const actualizarUsuario = (userId: string, userData: {
    nombre?: string;
    correo?: string;
    id_rol?: number;
    estatus?: boolean;
}) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            const response = await eposApi.put(`/usuarios/${userId}`, userData);

            if (response.status === 200) {
                // Recargar la lista de usuarios
                dispatch(obtenerUsuarios());
                dispatch(handleApiSuccess(response.data.mensaje || 'Usuario actualizado correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            dispatch(handleApiError(error, 'Error al actualizar usuario'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al actualizar usuario'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para eliminar un usuario (eliminación lógica)
export const eliminarUsuario = (userId: string) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            const response = await eposApi.delete(`/usuarios/${userId}`);

            if (response.status === 200) {
                // Recargar la lista de usuarios
                dispatch(obtenerUsuarios());
                dispatch(handleApiSuccess(response.data.mensaje || 'Usuario eliminado correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            dispatch(handleApiError(error, 'Error al eliminar usuario'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al eliminar usuario'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para buscar usuarios
export const buscarUsuarios = (query: string) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));
            const response = await eposApi.get(`/usuarios?search=${query}`);

            const usuariosTransformados = response.data.map((usuario: any) => ({
                id: usuario.id?.toString() || '',
                nombre: usuario.nombre,
                correo: usuario.correo,
                id_rol: usuario.id_rol,
                id_equipo: usuario.id_equipo,
                estatus: usuario.estatus,
                ultimo_acceso: usuario.ultimo_acceso,
                is_admin: usuario.is_admin,
            }));

            dispatch(setUsers(usuariosTransformados));
        } catch (error) {
            console.error('Error al buscar usuarios:', error);
            dispatch(handleApiError(error, "Error al buscar usuarios"));
        } finally {
            dispatch(setLoading(false));
        }
    }
} 