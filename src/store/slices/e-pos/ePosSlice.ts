// import { User, Product, Sale } from "@/lib/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const ePosSlice = createSlice({
    name: "ePos",
    initialState: {
        products: [],
        carts: {
            'default': {
                items: [],
                userId: 'default',
                userName: 'Cliente 1'
            }
        },
        activeCartId: 'default',
        sales: [],
        detalleVenta: null,
        historialVenta: [],
        estadisticasVentas: null,
        users: [],
        isLoading: false,
    },
    reducers: {
        //
        setProductos: (state, action) => {
            state.products = action.payload;
        },
        
        // Nuevos reducers para múltiples carritos
        createCart: (state, action) => {
            const { cartId, userName } = action.payload;
            const cartKeys = Object.keys(state.carts);
            const position = cartKeys.length + 1;
            state.carts[cartId] = {
                items: [],
                userId: cartId,
                userName: userName || `Cliente ${position}`
            };
            state.activeCartId = cartId;
        },
        
        setActiveCart: (state, action) => {
            state.activeCartId = action.payload;
        },
        
        addToCart: (state, action) => {
            const { cartId, product } = action.payload;
            if (state.carts[cartId]) {
                const existingItemIndex = state.carts[cartId].items.findIndex(
                    item => item.id === product.id
                );
                
                if (existingItemIndex !== -1) {
                    // Si el producto ya existe, incrementar la cantidad
                    state.carts[cartId].items[existingItemIndex].cantidad += product.cantidad || 1;
                } else {
                    // Si es un producto nuevo, agregarlo
                    state.carts[cartId].items.push(product);
                }
            }
        },
        
        removeFromCart: (state, action) => {
            const { cartId, productId } = action.payload;
            if (state.carts[cartId]) {
                state.carts[cartId].items = state.carts[cartId].items.filter(
                    item => item.id !== productId
                );
            }
        },
        
        updateCartQuantity: (state, action) => {
            const { cartId, id, cantidad } = action.payload;
            if (state.carts[cartId]) {
                const indexItem = state.carts[cartId].items.findIndex((item) => item.id === id);
                if (indexItem === -1) return;
                
                // Validar que la cantidad no exceda el stock disponible
                const currentItem = state.carts[cartId].items[indexItem];
                if (cantidad > currentItem.stock) return;
                
                state.carts[cartId].items[indexItem] = { 
                    ...currentItem, 
                    cantidad 
                };
            }
        },
        
        clearCart: (state, action) => {
            const cartId = action.payload;
            if (state.carts[cartId]) {
                state.carts[cartId].items = [];
            }
        },
        
        removeCart: (state, action) => {
            const cartId = action.payload;
            if (Object.keys(state.carts).length > 1) {
                delete state.carts[cartId];
                if (state.activeCartId === cartId) {
                    const remainingCarts = Object.keys(state.carts);
                    state.activeCartId = remainingCarts[0];
                }
                
                // Reordenar la numeración de los carritos restantes
                const remainingCartIds = Object.keys(state.carts);
                remainingCartIds.forEach((id, index) => {
                    const position = index + 1;
                    state.carts[id].userName = `Cliente ${position}`;
                });
            }
        },
        
        setCart: (state, action) => {
            const { cartId, items } = action.payload;
            if (state.carts[cartId]) {
                state.carts[cartId].items = items;
            }
        },

        //
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        
        logout: (state) => {
            // Limpiar todos los carritos al hacer logout
            state.carts = {
                'default': {
                    items: [],
                    userId: 'default',
                    userName: 'Cliente 1'
                }
            };
            state.activeCartId = 'default';
        },
        addProduct: (state, action: PayloadAction<any>) => {
            // Implementar cuando sea necesario
        },
        updateProduct: (state, action: PayloadAction<any>) => {
            // Implementar cuando sea necesario
        },
        deleteProduct: (state, action: PayloadAction<string>) => {
            state.products = state.products.filter(
                (product) => product.id !== action.payload,
            );
        },
        addSale: (state, action: PayloadAction<any>) => {
            // Implementar cuando sea necesario
        },
        addUser: (state, action: PayloadAction<any>) => {
            state.users.push(action.payload);
        },
        updateUser: (state, action: PayloadAction<any>) => {
            const index = state.users.findIndex(
                (user) => user.id === action.payload.id,
            );
            if (index !== -1) {
                state.users[index] = action.payload;
            }
        },
        deleteUser: (state, action: PayloadAction<string>) => {
            state.users = state.users.filter((user) => user.id !== action.payload);
        },
        setVentas: (state, action) => {
            state.sales = action.payload;
        },
        setDetalleVenta: (state, action) => {
            state.detalleVenta = action.payload;
        },
        setHistorialVenta: (state, action) => {
            state.historialVenta = action.payload;
        },
        setEstadisticasVentas: (state, action) => {
            state.estadisticasVentas = action.payload;
        },
    },
})

export const {
    // Propios
    setProductos,
    setCart,

    // Múltiples carritos
    createCart,
    setActiveCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    removeCart,

    // Builder
    setLoading,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    addUser,
    updateUser,
    deleteUser,
    setVentas,
    setDetalleVenta,
    setHistorialVenta,
    setEstadisticasVentas,
} = ePosSlice.actions;