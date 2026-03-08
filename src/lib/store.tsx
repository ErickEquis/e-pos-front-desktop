// import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { useSelector, useDispatch } from "react-redux";
// import type { TypedUseSelectorHook } from "react-redux";

// // Types
// export interface Product {
//   id: string;
//   name: string;
//   price: number; // Precio por unidad o por kilo/gramo según saleType
//   stock: number; // Stock en unidades o gramos según saleType
//   category: string;
//   barcode?: string;
//   image?: string;
//   description?: string;
//   saleType: "unit" | "weight"; // Tipo de venta: por unidad o por peso
//   weightUnit?: "g" | "kg"; // Unidad de peso (gramos o kilos)
//   minWeight?: number; // Peso mínimo permitido (para productos por peso)
// }

// export interface CartItem {
//   product: Product;
//   quantity: number; // Para productos por unidad: número de unidades, para productos por peso: peso en gramos
//   displayWeight?: string; // Para mostrar el peso formateado (ej: "250g", "1.5kg")
// }

// export interface Sale {
//   id: string;
//   date: string;
//   items: CartItem[];
//   total: number;
//   paymentMethod: "cash" | "card" | "transfer";
//   customerName?: string;
//   employeeId: string;
// }

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: "admin" | "employee";
//   isActive: boolean;
// }

// export interface AppState {
//   products: Product[];
//   cart: CartItem[];
//   sales: Sale[];
//   users: User[];
//   currentUser: User | null | string;
//   isLoading: boolean;
// }

// // Initial state with sample data
// const initialState: AppState = {
//   products: [
//     {
//       id: "1",
//       name: "Café Americano",
//       price: 3500,
//       stock: 50,
//       category: "Bebidas",
//       barcode: "123456789",
//       description: "Café americano tradicional",
//       saleType: "unit",
//     },
//     {
//       id: "2",
//       name: "Sandwich Mixto",
//       price: 7500,
//       stock: 25,
//       category: "Comida",
//       barcode: "123456790",
//       description: "Sandwich con jamón y queso",
//       saleType: "unit",
//     },
//     {
//       id: "3",
//       name: "Azúcar Blanca",
//       price: 0.1, // 0.1 pesos por gramo (100 pesos por kilo)
//       stock: 5000, // 5kg en stock (5000 gramos)
//       category: "Abarrotes",
//       barcode: "123456791",
//       description: "Azúcar blanca refinada a granel",
//       saleType: "weight",
//       weightUnit: "g",
//       minWeight: 10,
//     },
//     {
//       id: "4",
//       name: "Queso Campesino",
//       price: 25, // 25 pesos por gramo (25,000 pesos por kilo)
//       stock: 2000, // 2kg en stock (2000 gramos)
//       category: "Lácteos",
//       barcode: "123456792",
//       description: "Queso campesino fresco",
//       saleType: "weight",
//       weightUnit: "g",
//       minWeight: 50,
//     },
//     {
//       id: "5",
//       name: "Agua Mineral",
//       price: 2000,
//       stock: 100,
//       category: "Bebidas",
//       barcode: "123456793",
//       description: "Agua mineral 500ml",
//       saleType: "unit",
//     },
//     {
//       id: "6",
//       name: "Jamón de Cerdo",
//       price: 30, // 30 pesos por gramo
//       stock: 1500, // 1.5kg en stock
//       category: "Carnes",
//       barcode: "123456794",
//       description: "Jamón de cerdo premium",
//       saleType: "weight",
//       weightUnit: "g",
//       minWeight: 100,
//     },
//   ],
//   cart: [],
//   sales: [
//     {
//       id: "1",
//       date: new Date().toISOString(),
//       items: [
//         {
//           product: {
//             id: "1",
//             name: "Café Americano",
//             price: 3500,
//             stock: 50,
//             category: "Bebidas",
//             saleType: "unit",
//           },
//           quantity: 2,
//         },
//       ],
//       total: 7000,
//       paymentMethod: "cash",
//       customerName: "Juan Pérez",
//       employeeId: "1",
//     },
//   ],
//   users: [
//     {
//       id: "1",
//       name: "Admin Usuario",
//       email: "admin@empresa.com",
//       role: "admin",
//       isActive: true,
//     },
//     {
//       id: "2",
//       name: "María González",
//       email: "maria@empresa.com",
//       role: "employee",
//       isActive: true,
//     },
//   ],
//   currentUser: {
//     id: "1",
//     name: "Admin Usuario",
//     email: "admin@empresa.com",
//     role: "admin",
//     isActive: true,
//   }, // Will be set from localStorage or login
//   isLoading: false,
// };

// // Redux Slice
// const appSlice = createSlice({
//   name: "app",
//   initialState,
//   reducers: {
//     setLoading: (state, action: PayloadAction<boolean>) => {
//       state.isLoading = action.payload;
//     },
//     // setCurrentUser: (state, action: PayloadAction<User | null>) => {
//     //   state.currentUser = action.payload;
//     // },
//     logout: (state) => {
//       localStorage.removeItem("currentUser");
//       state.currentUser = null;
//       state.cart = [];
//     },
//     addToCart: (
//       state,
//       action: PayloadAction<
//         Product | { product: Product; quantity: number; displayWeight?: string }
//       >,
//     ) => {
//       const payload = action.payload;
//       const existingItem = state.cart.find(
//         (item) =>
//           item.product.id === (payload as any).product?.id ||
//           (payload as any).id,
//       );

//       // Si es un producto nuevo con cantidad/peso específico
//       if ((payload as any).product && (payload as any).quantity !== undefined) {
//         const { product, quantity, displayWeight } = payload as {
//           product: Product;
//           quantity: number;
//           displayWeight?: string;
//         };
//         if (existingItem) {
//           existingItem.quantity += quantity;
//           if (displayWeight) existingItem.displayWeight = displayWeight;
//         } else {
//           state.cart.push({
//             product,
//             quantity,
//             displayWeight,
//           });
//         }
//         return;
//       }

//       // Producto simple (compatibilidad hacia atrás)
//       const product = (payload as any).product || (payload as Product);
//       if (existingItem) {
//         const increment =
//           product.saleType === "weight" ? product.minWeight || 100 : 1;
//         existingItem.quantity += increment;
//       } else {
//         const defaultQuantity =
//           product.saleType === "weight" ? product.minWeight || 100 : 1;
//         state.cart.push({ product, quantity: defaultQuantity });
//       }
//     },
//     removeFromCart: (state, action: PayloadAction<string>) => {
//       state.cart = state.cart.filter(
//         (item) => item.product.id !== action.payload,
//       );
//     },
//     updateCartQuantity: (
//       state,
//       action: PayloadAction<{ productId: string; quantity: number }>,
//     ) => {
//       const { productId, quantity } = action.payload;
//       if (quantity <= 0) {
//         state.cart = state.cart.filter((item) => item.product.id !== productId);
//       } else {
//         const item = state.cart.find((item) => item.product.id === productId);
//         if (item) {
//           item.quantity = quantity;
//         }
//       }
//     },
//     clearCart: (state) => {
//       state.cart = [];
//     },
//     addProduct: (state, action: PayloadAction<Product>) => {
//       state.products.push(action.payload);
//     },
//     updateProduct: (state, action: PayloadAction<Product>) => {
//       const index = state.products.findIndex(
//         (product) => product.id === action.payload.id,
//       );
//       if (index !== -1) {
//         state.products[index] = action.payload;
//       }
//     },
//     deleteProduct: (state, action: PayloadAction<string>) => {
//       state.products = state.products.filter(
//         (product) => product.id !== action.payload,
//       );
//     },
//     addSale: (state, action: PayloadAction<Sale>) => {
//       state.sales.unshift(action.payload);
//     },
//     addUser: (state, action: PayloadAction<User>) => {
//       state.users.push(action.payload);
//     },
//     updateUser: (state, action: PayloadAction<User>) => {
//       const index = state.users.findIndex(
//         (user) => user.id === action.payload.id,
//       );
//       if (index !== -1) {
//         state.users[index] = action.payload;
//       }
//     },
//     deleteUser: (state, action: PayloadAction<string>) => {
//       state.users = state.users.filter((user) => user.id !== action.payload);
//     },
//   },
// });

// // Export actions
// export const {
//   setLoading,
//   // setCurrentUser,
//   logout,
//   addToCart,
//   removeFromCart,
//   updateCartQuantity,
//   clearCart,
//   addProduct,
//   updateProduct,
//   deleteProduct,
//   addSale,
//   addUser,
//   updateUser,
//   deleteUser,
// } = appSlice.actions;

// // Configure store
// export const store_lib = configureStore({
//   reducer: {
//     app: appSlice.reducer,
//   },
// });

// // Types for Redux
// export type RootState = ReturnType<typeof store_lib.getState>;
// export type AppDispatch = typeof store_lib.dispatch;

// // Typed hooks
// export const useAppDispatch: () => AppDispatch = useDispatch;
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// // Custom hook for app store (to maintain compatibility)
// export function useAppStore() {
//   const state = useAppSelector((state) => state.app);
//   const dispatch = useAppDispatch();

//   return { state, dispatch };
// }

// // Helper functions
// export function formatCurrency(amount: number): string {
//   return new Intl.NumberFormat("es-CO", {
//     style: "currency",
//     currency: "COP",
//     minimumFractionDigits: 0,
//   }).format(amount);
// }

// export function generateId(): string {
//   return Date.now().toString(36) + Math.random().toString(36).substr(2);
// }

// export function formatWeight(grams: number): string {
//   if (grams >= 1000) {
//     const kg = grams / 1000;
//     return `${kg.toFixed(kg % 1 === 0 ? 0 : 1)}kg`;
//   }
//   return `${grams}g`;
// }

// export function parseWeight(input: string): { grams: number; display: string } {
//   const value = parseFloat(input);
//   if (isNaN(value)) return { grams: 0, display: "0g" };

//   return {
//     grams: value,
//     display: formatWeight(value),
//   };
// }

// export function calculateItemTotal(item: CartItem): number {
//   if (item.product.saleType === "weight") {
//     return item.product.price * item.quantity; // price per gram * grams
//   }
//   return item.product.price * item.quantity; // price per unit * units
// }

// export function getStockDisplayText(product: Product): string {
//   if (product.saleType === "weight") {
//     return `${formatWeight(product.stock)} disponible`;
//   }
//   return `${product.stock} unidades`;
// }

// export function getPriceDisplayText(product: Product): string {
//   if (product.saleType === "weight") {
//     const pricePerKg = product.price * 1000;
//     return `${formatCurrency(pricePerKg)}/kg`;
//   }
//   return formatCurrency(product.price);
// }

// // Initialize current user from localStorage
// // store_lib.dispatch((dispatch, getState) => {
// //   const storedUser = localStorage.getItem("currentUser");
// //   if (storedUser) {
// //     try {
// //       const user = JSON.parse(storedUser);
// //       // Verify user still exists and is active
// //       const validUser = initialState.users.find(
// //         (u) => u.id === user.id && u.isActive,
// //       );
// //       if (validUser) {
// //         // dispatch(setCurrentUser(validUser));
// //       } else {
// //         localStorage.removeItem("currentUser");
// //       }
// //     } catch (error) {
// //       localStorage.removeItem("currentUser");
// //     }
// //   }
// // });
