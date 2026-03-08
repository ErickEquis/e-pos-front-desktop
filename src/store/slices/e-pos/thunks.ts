import { eposApi } from "@/api/e-posApi";
import { setProductos, setLoading, setVentas, setDetalleVenta, setHistorialVenta, setEstadisticasVentas } from "./ePosSlice";
import { handleApiError, handleApiSuccess, showErrorNotification } from "../notifications/thunks";

// // Types
export interface Product {
    id: string;
    nombre: string;
    descripcion?: string;
    precio: number;
    costo_compra?: number; // Costo de compra del producto
    stock: number;
    categoria: string; // En lugar de category
    codigo?: string;
    image?: string;
    tipo_venta: "unidad" | "peso"; // En lugar de saleType
    weightUnit?: "g" | "kg";
    minWeight?: number;
}

// Interface para el backend (ya no necesaria, pero la mantengo por compatibilidad)
export interface BackendProduct {
    id?: number;
    id_equipo?: number;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    precio: number;
    costo_compra?: number; // Costo de compra del producto
    stock: number;
    tipo_venta: "unidad" | "peso";
    codigo?: string;
    logical_delete?: string;
    estatus?: boolean;
}

export interface CartItem {
    product: Product;
    quantity: number; // Para productos por unidad: número de unidades, para productos por peso: peso en gramos
    displayWeight?: string; // Para mostrar el peso formateado (ej: "250g", "1.5kg")
}

export interface Sale {
    id: string;
    date: string;
    items: CartItem[];
    total: number;
    paymentMethod: "cash" | "card" | "transfer";
    customerName?: string;
    employeeId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "employee";
    isActive: boolean;
}

export interface AppState {
    products: Product[];
    cart: CartItem[];
    sales: Sale[];
    users: User[];
    currentUser: User | null | string;
    isLoading: boolean;
}


// 
export function formatCurrency(amount: number): string {
    // Validar que amount sea un número válido
    const validAmount = Number(amount) || 0;

    // Manejar valores muy grandes o muy pequeños
    if (isNaN(validAmount) || !isFinite(validAmount)) {
        return "0.00";
    }

    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(validAmount);
}

export const buscarProductos = (query: string) => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.get(`/productos?descripcion=${query}`);
            
            // Transformar productos para incluir costo_compra y normalizar campos
            const productosTransformados = response.data.map((producto: BackendProduct) => ({
                id: producto.id?.toString() || '',
                nombre: producto.nombre || producto.descripcion || '',
                descripcion: producto.descripcion,
                precio: Number(producto.precio) || 0,
                costo_compra: producto.costo_compra !== undefined && producto.costo_compra !== null ? Number(producto.costo_compra) : undefined,
                stock: Number(producto.stock) || 0,
                categoria: producto.categoria || 'Sin categoría',
                codigo: producto.codigo || 'Sin código',
                tipo_venta: producto.tipo_venta,
                weightUnit: producto.tipo_venta === 'peso' ? 'kg' : undefined,
                minWeight: undefined,
            }));
            
            dispatch(setProductos(productosTransformados));
        } catch (error) {
            console.error('Error al buscar productos:', error);
            dispatch(handleApiError(error, "Error al buscar productos"));
        }
    }
}

// Función para buscar un producto específico por código de barras
export const buscarProductoPorCodigo = (codigo: string) => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.get(`/productos/codigo/${codigo}`);
            
            // Transformar producto al formato del frontend
            const producto: BackendProduct = response.data;
            const productoTransformado = {
                id: producto.id?.toString() || '',
                nombre: producto.nombre || producto.descripcion || '',
                descripcion: producto.descripcion,
                precio: Number(producto.precio) || 0,
                costo_compra: producto.costo_compra !== undefined && producto.costo_compra !== null ? Number(producto.costo_compra) : undefined,
                stock: Number(producto.stock) || 0,
                categoria: producto.categoria || 'Sin categoría',
                codigo: producto.codigo || 'Sin código',
                tipo_venta: producto.tipo_venta,
                weightUnit: producto.tipo_venta === 'peso' ? 'kg' : undefined,
                minWeight: undefined,
            };
            
            return productoTransformado;
        } catch (error: any) {
            // Si el producto no se encuentra (404), retornar null
            if (error.response?.status === 400 || error.response?.status === 404) {
                return null;
            }
            console.error('Error al buscar producto por código:', error);
            throw error;
        }
    }
}

// Nuevas funciones para el módulo de inventario

// Función para obtener todos los productos del inventario
export const obtenerProductosInventario = () => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));
            const response = await eposApi.get('/productos');

            // Transformar solo el id a string y agregar campos del frontend
            const productosTransformados = response.data.map((producto: BackendProduct) => ({
                id: producto.id?.toString() || '',
                nombre: producto.nombre || producto.descripcion || '',
                descripcion: producto.descripcion,
                precio: Number(producto.precio) || 0,
                costo_compra: producto.costo_compra !== undefined && producto.costo_compra !== null ? Number(producto.costo_compra) : undefined,
                stock: Number(producto.stock) || 0,
                categoria: producto.categoria || 'Sin categoría',
                codigo: producto.codigo || 'Sin código',
                tipo_venta: producto.tipo_venta,
                weightUnit: producto.tipo_venta === 'peso' ? 'kg' : undefined, // Cambiar a 'kg' por defecto
                minWeight: undefined,
            }));

            dispatch(setProductos(productosTransformados));
        } catch (error) {
            console.error('Error al obtener productos del inventario:', error);
            dispatch(handleApiError(error, "Error al cargar productos"));
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para crear un nuevo producto
export const crearProductoInventario = (productoData: any) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            // Enviar directamente los datos sin transformación
            const productoBackend = {
                nombre: productoData.nombre,
                descripcion: productoData.descripcion || undefined,
                categoria: productoData.categoria,
                precio: productoData.precio,
                costo_compra: productoData.costo_compra !== undefined && productoData.costo_compra !== null && productoData.costo_compra !== '' ? Number(productoData.costo_compra) : undefined,
                stock: productoData.stock,
                tipo_venta: productoData.tipo_venta,
                codigo: productoData.codigo || undefined,
            };

            const response = await eposApi.post('/productos', productoBackend);

            if (response.status === 200) {
                // Recargar la lista de productos
                dispatch(obtenerProductosInventario());
                // Mostrar notificación de éxito
                dispatch(handleApiSuccess(response.data.mensaje || 'Producto creado correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al crear producto:', error);
            // Mostrar notificación de error
            dispatch(handleApiError(error, 'Error al crear el producto'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al crear el producto'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para actualizar un producto existente
export const actualizarProductoInventario = (productoId: string, productoData: any) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            // Enviar directamente los datos sin transformación
            const productoBackend = {
                nombre: productoData.nombre,
                descripcion: productoData.descripcion || undefined,
                categoria: productoData.categoria,
                precio: productoData.precio,
                costo_compra: productoData.costo_compra !== undefined && productoData.costo_compra !== null && productoData.costo_compra !== '' ? Number(productoData.costo_compra) : undefined,
                stock: productoData.stock,
                tipo_venta: productoData.tipo_venta,
                codigo: productoData.codigo || undefined,
            };

            const response = await eposApi.patch(`/productos/${productoId}`, productoBackend);

            if (response.status === 200) {
                // Recargar la lista de productos
                dispatch(obtenerProductosInventario());
                // Mostrar notificación de éxito
                dispatch(handleApiSuccess(response.data.mensaje || 'Producto actualizado correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            // Mostrar notificación de error
            dispatch(handleApiError(error, 'Error al actualizar el producto'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al actualizar el producto'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para eliminar un producto (eliminación lógica)
export const eliminarProductoInventario = (productoId: string) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            const response = await eposApi.delete(`/productos/${productoId}`);

            if (response.status === 200) {
                // Recargar la lista de productos
                dispatch(obtenerProductosInventario());
                // Mostrar notificación de éxito
                dispatch(handleApiSuccess(response.data.mensaje || 'Producto eliminado correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            // Mostrar notificación de error
            dispatch(handleApiError(error, 'Error al eliminar el producto'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al eliminar el producto'
            };
        } finally {
            dispatch(setLoading(false));
        }
    }
}

// Función para buscar productos por descripción o código
export const buscarProductosInventario = (query: string) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));
            const response = await eposApi.get(`/productos?descripcion=${query}`);

            // Transformar solo el id a string y agregar campos del frontend
            const productosTransformados = response.data.map((producto: BackendProduct) => ({
                id: producto.id?.toString() || '',
                nombre: producto.nombre || producto.descripcion || '',
                descripcion: producto.descripcion,
                precio: Number(producto.precio) || 0,
                costo_compra: producto.costo_compra !== undefined && producto.costo_compra !== null ? Number(producto.costo_compra) : undefined,
                stock: Number(producto.stock) || 0,
                categoria: producto.categoria || 'Sin categoría',
                codigo: producto.codigo || 'Sin código',
                tipo_venta: producto.tipo_venta,
                weightUnit: producto.tipo_venta === 'peso' ? 'kg' : undefined, // Cambiar a 'kg' por defecto
                minWeight: undefined,
            }));

            dispatch(setProductos(productosTransformados));
        } catch (error) {
            console.error('Error al buscar productos:', error);
        } finally {
            dispatch(setLoading(false));
        }
    }
}

export const limpiarProductos = () => {
    return (dispatch) => {
        dispatch(setProductos([]));
    }
}



export function calculateItemTotal(item): number {
    // Validar que precio y cantidad sean números válidos
    const precio = Number(item.precio) || 0;
    const cantidad = Number(item.cantidad) || 0;

    if (item.tipo_venta === "peso") {
        // item.precio es precio por kilo, item.cantidad es gramos
        // Necesitamos convertir a precio por gramo
        const precioPorGramo = precio / 1000;
        return precioPorGramo * cantidad;
    }
    return precio * cantidad; // price per unit * units
}


export function formatWeight(grams: number): string {
    // Validar que grams sea un número válido
    if (isNaN(grams) || grams < 0) {
        return "0g";
    }

    if (grams >= 1000) {
        const kg = grams / 1000;
        return `${kg.toFixed(kg % 1 === 0 ? 0 : 1)}kg`;
    }
    return `${grams}g`;
}

// 
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getStockDisplayText(product: any): string {
    if (product.tipo_venta === "peso") {
        return `${formatWeight(product.stock)} disponible`;
    }
    return `${product.stock} unidades`;
}

export function getPriceDisplayText(product: any): string {
    // Validar que el precio sea un número válido
    const precio = Number(product.precio) || 0;

    // Si es producto por peso, mostrar "por kg"
    if (product.tipo_venta === "peso") {
        return `${formatCurrency(precio)}/kg`;
    }

    return formatCurrency(precio);
}

// Interface para cuenta CLABE
export interface CuentaClabe {
    id: number;
    clabe: string;
    banco?: string;
    nombre?: string;
    activa?: boolean;
}

// Función para obtener cuentas CLABE del equipo
export const obtenerCuentasClabe = () => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.get('/cuentas-clabe');
            return response.data || [];
        } catch (error) {
            console.error('Error al obtener cuentas CLABE:', error);
            // Si el endpoint no existe aún, retornar array vacío
            if (error.response?.status === 404) {
                return [];
            }
            dispatch(handleApiError(error, "Error al cargar cuentas CLABE"));
            return [];
        }
    }
}

// Función para crear una cuenta CLABE
export const crearCuentaClabe = (cuentaData: { clabe: string; banco: string; nombre: string }) => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.post('/cuentas-clabe', cuentaData);
            if (response.status === 200 || response.status === 201) {
                dispatch(handleApiSuccess(response.data.mensaje || 'Cuenta CLABE creada correctamente'));
                return { success: true, mensaje: response.data.mensaje, cuenta: response.data.cuenta };
            }
        } catch (error) {
            console.error('Error al crear cuenta CLABE:', error);
            dispatch(handleApiError(error, 'Error al crear cuenta CLABE'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al crear cuenta CLABE'
            };
        }
    }
}

// Función para actualizar una cuenta CLABE
export const actualizarCuentaClabe = (id: number, cuentaData: { clabe: string; banco: string; nombre: string }) => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.put(`/cuentas-clabe/${id}`, cuentaData);
            if (response.status === 200) {
                dispatch(handleApiSuccess(response.data.mensaje || 'Cuenta CLABE actualizada correctamente'));
                return { success: true, mensaje: response.data.mensaje, cuenta: response.data.cuenta };
            }
        } catch (error) {
            console.error('Error al actualizar cuenta CLABE:', error);
            dispatch(handleApiError(error, 'Error al actualizar cuenta CLABE'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al actualizar cuenta CLABE'
            };
        }
    }
}

// Función para eliminar una cuenta CLABE
export const eliminarCuentaClabe = (id: number) => {
    return async (dispatch, getState) => {
        try {
            const response = await eposApi.delete(`/cuentas-clabe/${id}`);
            if (response.status === 200) {
                dispatch(handleApiSuccess(response.data.mensaje || 'Cuenta CLABE eliminada correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al eliminar cuenta CLABE:', error);
            dispatch(handleApiError(error, 'Error al eliminar cuenta CLABE'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al eliminar cuenta CLABE'
            };
        }
    }
}

// Función para procesar la venta y guardarla en la BD
export function procesarVenta(cart: any[], total: number, paymentMethod: string, cuentaClabe?: string) {
    return async (dispatch, getState) => {
        try {
            // Preparar los datos de la venta según la estructura que espera el backend
            const ventaData = {
                productos: cart.map(item => ({
                    id: item.id,
                    nombre: item.nombre || item.descripcion,
                    descripcion: item.descripcion,
                    cantidad: item.cantidad,
                    precio: item.precio,
                    categoria: item.categoria || '',
                    tipo_venta: item.tipo_venta,
                    codigo: item.codigo || null,
                    costo_compra: item.costo_compra !== undefined && item.costo_compra !== null ? item.costo_compra : null
                })),
                total_venta: total,
                metodo_pago: paymentMethod,
                cuenta_clabe: paymentMethod === "transfer" && cuentaClabe ? cuentaClabe : null
            };

            // Llamar a la API para guardar la venta
            const response = await eposApi.post('/ventas', ventaData);
            if (response.status === 200) {
                // La venta fue exitosa, mostrar notificación de éxito
                dispatch(handleApiSuccess(response.data.mensaje || 'Venta procesada correctamente'));
                return { success: true, mensaje: response.data.mensaje };
            }
        } catch (error) {
            console.error('Error al procesar la venta:', error);
            console.error('Error response:', error.response?.data);

            // Manejar errores específicos de autenticación
            if (error.response?.status === 401) {
                dispatch(showErrorNotification('Error de Sesión', 'Sesión expirada. Por favor inicie sesión nuevamente.'));
                return {
                    success: false,
                    mensaje: 'Sesión expirada. Por favor inicie sesión nuevamente.'
                };
            }

            if (error.response?.status === 403) {
                dispatch(showErrorNotification('Error de Autorización', 'Sin autorización para realizar esta operación.'));
                return {
                    success: false,
                    mensaje: 'Sin autorización para realizar esta operación.'
                };
            }

            // Mostrar notificación de error con el mensaje del backend
            const errorMessage = error.response?.data?.mensaje || 'Error al procesar la venta';
            dispatch(showErrorNotification('Error en Venta', errorMessage));
            
            return {
                success: false,
                mensaje: errorMessage
            };
        }
    };
}

export const getDataDashboard = () => {
    return async (dispatch, getState) => {
        try {
            const { data } = await eposApi.get('/dashboard');
            return data;
        } catch (error) {
            console.error('Error al obtener dashboard:', error);
            return { success: false, mensaje: 'Error al obtener dashboard' };
        }
    }
}

// Obtener todas las ventas con filtros opcionales
export const obtenerVentas = (filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  idUsuario?: number;
  montoMin?: number;
  montoMax?: number;
  modificado?: boolean;
}) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const params = new URLSearchParams();
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros?.idUsuario) params.append('idUsuario', filtros.idUsuario.toString());
    if (filtros?.montoMin !== undefined) params.append('montoMin', filtros.montoMin.toString());
    if (filtros?.montoMax !== undefined) params.append('montoMax', filtros.montoMax.toString());
    if (filtros?.modificado !== undefined) params.append('modificado', filtros.modificado.toString());
    
    const url = params.toString() ? `/ventas?${params.toString()}` : '/ventas';
    const response = await eposApi.get(url);
    dispatch(setVentas(response.data));
  } catch (error) {
    dispatch(handleApiError(error, "Error al cargar ventas"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Obtener estadísticas de ventas
export const obtenerEstadisticasVentas = (filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  idUsuario?: number;
}) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const params = new URLSearchParams();
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros?.idUsuario) params.append('idUsuario', filtros.idUsuario.toString());
    
    const url = params.toString() ? `/ventas-estadisticas?${params.toString()}` : '/ventas-estadisticas';
    const response = await eposApi.get(url);
    dispatch(setEstadisticasVentas(response.data));
    return response.data;
  } catch (error) {
    dispatch(handleApiError(error, "Error al cargar estadísticas"));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

// Obtener detalle de una venta
export const obtenerDetalleVenta = (id) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await eposApi.get(`/ventas/${id}`);
    dispatch(setDetalleVenta(response.data));
  } catch (error) {
    dispatch(handleApiError(error, "Error al cargar detalle de venta"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Eliminar una venta
export const eliminarVenta = (id, recargar = true) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    await eposApi.delete(`/ventas/${id}`);
    if (recargar) {
      dispatch(obtenerVentas());
    }
    dispatch(handleApiSuccess("Venta eliminada correctamente"));
  } catch (error) {
    dispatch(handleApiError(error, "Error al eliminar venta"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Editar una venta
export const editarVenta = ({ id, productos, total_venta }, recargar = true) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    await eposApi.patch(`/ventas/${id}`, { productos, total_venta });
    if (recargar) {
      dispatch(obtenerVentas());
    }
    dispatch(handleApiSuccess("Venta editada correctamente"));
  } catch (error) {
    dispatch(handleApiError(error, "Error al editar venta"));
  } finally {
    dispatch(setLoading(false));
  }
};

// Obtener historial de una venta
export const importarProductosExcel = (productos: any[]) => {
    return async (dispatch, getState) => {
        try {
            dispatch(setLoading(true));

            const response = await eposApi.post('/productos/importar', {
                productos: productos.map((p) => ({
                    nombre: p.nombre,
                    descripcion: p.descripcion || undefined,
                    precio: p.precio,
                    costo_compra: p.costo_compra,
                    stock: p.stock,
                    categoria: p.categoria,
                    codigo: p.codigo,
                    tipo_venta: p.tipo_venta,
                    weightUnit: p.weightUnit,
                    minWeight: p.minWeight,
                })),
            });

            if (response.status === 200) {
                // Recargar la lista de productos
                dispatch(obtenerProductosInventario());
                // Mostrar notificación de éxito
                dispatch(handleApiSuccess(
                    response.data.mensaje || `Se importaron ${productos.length} productos correctamente`
                ));
                return { 
                    success: true, 
                    mensaje: response.data.mensaje,
                    resultados: response.data.resultados 
                };
            }
        } catch (error) {
            console.error('Error al importar productos:', error);
            // Mostrar notificación de error
            dispatch(handleApiError(error, 'Error al importar productos'));
            return {
                success: false,
                mensaje: error.response?.data?.mensaje || 'Error al importar productos'
            };
        } finally {
            dispatch(setLoading(false));
        }
    };
};

export const obtenerHistorialVenta = (id) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await eposApi.get(`/ventas-historial/${id}`);
    dispatch(setHistorialVenta(response.data));
  } catch (error) {
    dispatch(handleApiError(error, "Error al cargar historial de venta"));
  } finally {
    dispatch(setLoading(false));
  }
};
