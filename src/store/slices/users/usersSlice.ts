import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
    id: string;
    nombre: string;
    correo: string;
    id_rol: number;
    id_equipo: number;
    estatus: boolean;
    ultimo_acceso?: string;
    is_admin?: boolean;
}

export interface Role {
    id: number;
    descripcion: string;
    is_admin: boolean;
    permisos: any;
    estatus: boolean;
}

interface UsersState {
    users: User[];
    roles: Role[];
    isLoading: boolean;
    error: string | null;
}

const initialState: UsersState = {
    users: [],
    roles: [],
    isLoading: false,
    error: null,
};

export const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        setUsers: (state, action: PayloadAction<User[]>) => {
            state.users = action.payload;
        },
        setRoles: (state, action: PayloadAction<Role[]>) => {
            state.roles = action.payload;
        },
        addUser: (state, action: PayloadAction<User>) => {
            state.users.push(action.payload);
        },
        updateUser: (state, action: PayloadAction<User>) => {
            const index = state.users.findIndex(user => user.id === action.payload.id);
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        },
        removeUser: (state, action: PayloadAction<string>) => {
            state.users = state.users.filter(user => user.id !== action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    setUsers,
    setRoles,
    addUser,
    updateUser,
    removeUser,
    setLoading,
    setError,
    clearError,
} = usersSlice.actions;

export default usersSlice.reducer; 