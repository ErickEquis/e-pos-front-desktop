import { useEffect, useState, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  addToCart,
  updateCartQuantity,
  clearCart,
  createCart,
  setActiveCart,
  removeCart,
  removeFromCart,
} from "@/store/slices/e-pos/ePosSlice";
import {
  generateId,
  Product,
  calculateItemTotal,
  formatWeight,
  getPriceDisplayText,
  getStockDisplayText,
  limpiarProductos,
  procesarVenta,
  obtenerCuentasClabe,
  CuentaClabe,
  buscarProductoPorCodigo,
} from "@/store/slices/e-pos/thunks";
import { buscarProductos, formatCurrency } from "@/store/slices/e-pos/thunks"
import { CartTabs } from "@/components/pos/CartTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WeightSelector from "@/components/pos/WeightSelector";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Package,
  Calculator,
  Receipt,
  Scale,
  Loader2,
  Scan,
  CreditCard,
  Banknote,
  ArrowRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSelector, useDispatch } from 'react-redux';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { handleApiError, handleApiSuccess } from "@/store/slices/notifications/thunks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function Checkout() {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { products, carts, activeCartId } = useSelector((state: any) => state.ePos);
  const { currentUser } = useSelector((state: any) => state.auth);
  const activeCart = carts[activeCartId];

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer"
  >("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [selectedWeightProduct, setSelectedWeightProduct] =
    useState<Product | null>(null);
  const [isWeightSelectorOpen, setIsWeightSelectorOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cuentasClabe, setCuentasClabe] = useState<CuentaClabe[]>([]);
  const [selectedCuentaClabe, setSelectedCuentaClabe] = useState<string>("");
  const [isLoadingClabe, setIsLoadingClabe] = useState(false);
  const [showTransferConfirmDialog, setShowTransferConfirmDialog] = useState(false);
  const [lastKeyPressTime, setLastKeyPressTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce para la búsqueda (350ms de delay - tiempo óptimo para UX)
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Función para formatear CLABE separando cada 3 dígitos
  const formatClabe = (clabe: string): string => {
    if (!clabe) return "";
    // Remover espacios existentes y separar cada 3 dígitos
    const cleanClabe = clabe.replace(/\s/g, "");
    return cleanClabe.match(/.{1,3}/g)?.join(" ") || clabe;
  };

  // Función para cargar cuentas CLABE
  const cargarCuentasClabe = async () => {
    setIsLoadingClabe(true);
    try {
      const cuentas = await dispatch(obtenerCuentasClabe());
      setCuentasClabe(cuentas || []);
    } catch (error) {
      console.error('Error al cargar cuentas CLABE:', error);
    } finally {
      setIsLoadingClabe(false);
    }
  };

  // Cargar cuentas CLABE cuando se cambia a transferencia
  useEffect(() => {
    if (paymentMethod === "transfer") {
      cargarCuentasClabe();
    } else {
      setSelectedCuentaClabe("");
    }
  }, [paymentMethod]);


  // Funciones para manejar múltiples carritos
  const addNewCart = () => {
    const cartId = generateId();
    dispatch(createCart({ cartId }));
  };

  const changeActiveCart = (cartId: string) => {
    dispatch(setActiveCart(cartId));
  };

  const handleRemoveCart = (cartId: string) => {
    if (Object.keys(carts).length > 1) {
      dispatch(removeCart(cartId));
    }
  };

  // Cart calculations
  const total = activeCart?.items?.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0,
  ) || 0;
  const change =
    paymentMethod === "cash" && receivedAmount
      ? parseFloat(receivedAmount) - total
      : 0;

  const handleAddToCart = (product) => {
    if (product.tipo_venta === "peso") {
      setSelectedWeightProduct(product);
      setIsWeightSelectorOpen(true);
    } else if (product.stock > 0) {
      const productWithQuantity = {
        ...product,
        cantidad: 1,
      };
      dispatch(addToCart({ cartId: activeCartId, product: productWithQuantity }));
    }
    setSearchTerm("");
    setHasSearched(false);
  };

  const addWeightToCart = (
    product: Product,
    grams: number,
    displayWeight: string,
  ) => {
    // Si estamos editando un producto existente, reemplazamos la cantidad
    if (selectedWeightProduct && 'cantidad' in selectedWeightProduct) {
      dispatch(updateCartQuantity({
        cartId: activeCartId,
        ...selectedWeightProduct,
        cantidad: grams,
        displayWeight: displayWeight,
      }));
    } else {
      // Si es un producto nuevo, lo agregamos
      const productWithWeight = {
        ...product,
        cantidad: grams,
        displayWeight: displayWeight,
      };
      dispatch(addToCart({ cartId: activeCartId, product: productWithWeight }));
    }
  };

  const updateQuantity = (producto, cantidad) => {
    const currentQuantity = producto.cantidad || 0;
    const newQuantity = currentQuantity + cantidad;

    if (newQuantity <= 0) {
      handleRemoveFromCart(producto.id);
      return;
    }

    const newProducto = {
      ...producto,
      cantidad: newQuantity,
    };
    dispatch(updateCartQuantity({ cartId: activeCartId, ...newProducto }));
  };

  const updateQuantityDirect = (producto, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(producto.id);
      return;
    }

    if (newQuantity > producto.stock) {
      newQuantity = producto.stock;
    }

    const newProducto = {
      ...producto,
      cantidad: newQuantity,
    };
    dispatch(updateCartQuantity({ cartId: activeCartId, ...newProducto }));
  };

  const handleRemoveFromCart = (productId: string) => {
    dispatch(removeFromCart({ cartId: activeCartId, productId }));
  };

  const handleClearCart = () => {
    dispatch(clearCart(activeCartId));
    setReceivedAmount("");
    setSelectedCuentaClabe("");
  };

  const completeSale = async () => {
    if (!activeCart?.items?.length || !currentUser) return;
    if (paymentMethod === "cash" && parseFloat(receivedAmount) < total) return;
    if (paymentMethod === "transfer" && !selectedCuentaClabe) return;

    // Si es transferencia, mostrar modal de confirmación
    if (paymentMethod === "transfer") {
      setShowTransferConfirmDialog(true);
      return;
    }

    // Para otros métodos de pago, procesar directamente
    await processSale();
  };

  const processSale = async () => {
    if (!activeCart?.items?.length || !currentUser) return;

    setIsProcessingSale(true);
    setShowTransferConfirmDialog(false);

    try {
      const result = await dispatch(procesarVenta(
        activeCart.items,
        total,
        paymentMethod,
        selectedCuentaClabe || undefined
      ));
      setReceivedAmount("");
      setPaymentMethod("cash");
      setSelectedCuentaClabe("");

      // Cerrar la pestaña actual después de procesar la venta
      if (Object.keys(carts).length > 1) {
        dispatch(removeCart(activeCartId));
      } else {
        // Si es la única pestaña, solo limpiar el carrito
        dispatch(clearCart(activeCartId));
      }
    } catch (error) {
      console.error("Error al procesar la venta:", error);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const searchProductos = useCallback(async (term: string) => {
    if (!term.trim()) {
      dispatch(limpiarProductos());
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      await dispatch(buscarProductos(term));
    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setIsSearching(false);
    }
  }, [dispatch]);

  // Función para manejar el escaneo de código de barras
  const handleBarcodeScan = useCallback(async (codigo: string) => {
    if (!codigo || codigo.trim() === "") return;

    setIsSearching(true);
    setIsScanning(true);

    try {
      const producto = await dispatch(buscarProductoPorCodigo(codigo));

      if (producto) {
        // Agregar automáticamente al carrito
        if (producto.tipo_venta === "peso") {
          setSelectedWeightProduct(producto);
          setIsWeightSelectorOpen(true);
        } else {
          if (producto.stock > 0) {
            const productWithQuantity = {
              ...producto,
              cantidad: 1,
            };
            dispatch(addToCart({ cartId: activeCartId, product: productWithQuantity }));
          } else {
            dispatch(handleApiError(new Error("Producto sin stock"), "El producto no tiene stock disponible"));
          }
        }
        // Limpiar campo de búsqueda y enfocar nuevamente
        setSearchTerm("");
        setHasSearched(false);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else {
        // Producto no encontrado, intentar búsqueda normal
        await searchProductos(codigo);
      }
    } catch (error) {
      console.error('Error al buscar producto por código:', error);
      dispatch(handleApiError(error, "Error al buscar producto"));
    } finally {
      setIsSearching(false);
      setIsScanning(false);
    }
  }, [dispatch, activeCartId, searchProductos]);

  // Función para manejar cambios en el input de búsqueda
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const now = Date.now();
    const timeDiff = now - lastKeyPressTime;

    setLastKeyPressTime(now);
    setSearchTerm(value);

    // Si la diferencia es < 100ms y > 0, probablemente es un escaneo rápido
    // Pero solo si el valor tiene al menos 3 caracteres (códigos de barras típicamente son más largos)
    if (timeDiff < 100 && timeDiff > 0 && value.length >= 3) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  };

  const handleSearchSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim()) {
        // Si se presiona Enter, tratar como escaneo de código
        await handleBarcodeScan(searchTerm.trim());
      }
    }
  };

  // Función para agregar producto automáticamente cuando se encuentra uno único
  const handleAutoAdd = (product: any) => {
    if (product.tipo_venta === "peso") {
      setSelectedWeightProduct(product);
      setIsWeightSelectorOpen(true);
    } else {
      const productWithQuantity = {
        ...product,
        cantidad: 1,
      };
      dispatch(addToCart({ cartId: activeCartId, product: productWithQuantity }));
    }
    setSearchTerm("");
    setHasSearched(false);
    // Enfocar el input después de agregar
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };



  // Efecto para manejar la búsqueda con debounce
  // Solo buscar si no se está escaneando (para evitar interferir con el escaneo automático)
  useEffect(() => {
    if (debouncedSearchTerm && !isScanning) {
      searchProductos(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, isScanning]);

  // Listener global de teclado para escaneo de códigos de barras (sin necesidad de foco en el input)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input, textarea, o contenteditable
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="textbox"]');

      // Si está en el input de búsqueda, dejar que el handler normal lo maneje
      if (target === searchInputRef.current) {
        return;
      }

      // Si está escribiendo en otro campo, ignorar
      if (isInputFocused) {
        return;
      }

      // Si es Enter y hay buffer, procesar
      if (event.key === "Enter" && barcodeBuffer.trim().length > 0) {
        event.preventDefault();
        handleBarcodeScan(barcodeBuffer.trim());
        setBarcodeBuffer("");
        if (barcodeTimeoutRef.current) {
          clearTimeout(barcodeTimeoutRef.current);
          barcodeTimeoutRef.current = null;
        }
        return;
      }

      // Si es un carácter imprimible (no teclas especiales)
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        const timeDiff = now - lastKeyPressTime;

        // Si los caracteres llegan muy rápido (< 100ms), es probablemente un escaneo
        if (timeDiff < 100 && timeDiff > 0) {
          const newBuffer = barcodeBuffer + event.key;
          setBarcodeBuffer(newBuffer);
          setLastKeyPressTime(now);

          // Limpiar timeout anterior
          if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
          }

          // Si el buffer tiene al menos 3 caracteres, configurar timeout para procesar automáticamente
          // después de una pausa (200ms sin caracteres nuevos)
          if (newBuffer.length >= 3) {
            barcodeTimeoutRef.current = setTimeout(() => {
              handleBarcodeScan(newBuffer);
              setBarcodeBuffer("");
            }, 200);
          }
        } else {
          // Si hay una pausa larga, reiniciar el buffer
          setBarcodeBuffer(event.key);
          setLastKeyPressTime(now);
        }
      } else {
        // Si es una tecla especial y hay buffer, podría ser el final del escaneo
        if (barcodeBuffer.length >= 3) {
          handleBarcodeScan(barcodeBuffer);
          setBarcodeBuffer("");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [barcodeBuffer, lastKeyPressTime, handleBarcodeScan]);

  return (
    <div className="h-full flex flex-col bg-slate-100/50 p-4 gap-4">
      {/* Pestañas de Carritos */}
      <CartTabs
        carts={carts}
        activeCartId={activeCartId}
        onCartChange={changeActiveCart}
        onAddCart={addNewCart}
        onRemoveCart={handleRemoveCart}
      />

      {/* Contenido del Carrito Activo */}
      {activeCart && (
        <div className="flex-1">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 h-full">
            {/* Product Search & Quick Add */}
            <div className="xl:col-span-1 space-y-4 md:space-y-6 flex flex-col h-full">
              <Card className="flex-1 flex flex-col shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center text-xl font-bold">
                    <Scan className="w-6 h-6 mr-3 text-pos-primary" />
                    Búsqueda de Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 flex-1 flex flex-col">
                  {/* Search Input */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-500 ml-1">Buscar o Escanear</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-400">
                        {isSearching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </div>
                      <Input
                        ref={searchInputRef}
                        placeholder="Nombre, código o escanea..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        onKeyDown={handleSearchSubmit}
                        className="pl-11 pr-4 h-14 text-lg bg-slate-50 border-slate-200 focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/10 transition-all rounded-xl shadow-sm"
                        autoFocus
                      />
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setHasSearched(false);
                            searchInputRef.current?.focus();
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick search results */}
                  <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-100 bg-slate-50/50">
                    <AnimatePresence mode="wait">
                      {searchTerm && (hasSearched || isSearching) ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-0 overflow-y-auto p-2 space-y-2"
                        >
                          {products.length > 0 ? (
                            products.map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-pos-primary/50 hover:shadow-sm cursor-pointer transition-all duration-200"
                                onClick={() => handleAddToCart(product)}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${product.tipo_venta === "peso" ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-pos-primary"
                                    }`}>
                                    {product.tipo_venta === "peso" ? (
                                      <Scale className="w-5 h-5" />
                                    ) : (
                                      <Package className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-semibold text-slate-800 truncate">{product.nombre || product.descripcion}</p>
                                    <p className="text-xs text-slate-500 flex items-center">
                                      <span className="font-medium text-slate-600">{product.codigo}</span>
                                      <span className="mx-1.5">•</span>
                                      {getStockDisplayText(product)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right pl-2">
                                  <p className="font-bold text-pos-primary bg-primary/5 px-2 py-1 rounded-md">
                                    {getPriceDisplayText(product)}
                                  </p>
                                </div>
                              </motion.div>
                            ))
                          ) : isSearching ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                              <Loader2 className="w-10 h-10 mb-3 animate-spin text-indigo-500" />
                              <p className="text-sm font-medium text-slate-600">Buscando productos...</p>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">No se encontraron resultados</p>
                              <p className="text-xs mt-1">Intenta con otro código o nombre</p>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400"
                        >
                          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                            <Scan className="w-10 h-10 text-gray-300" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">Listo para buscar</h3>
                          <p className="text-sm text-slate-500 max-w-[200px]">
                            Usa el buscador o escanea un código de barras para comenzar
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shopping Cart & Payment */}
            <div className="xl:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
              <Card className="flex-1 flex flex-col shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 border-b shrink-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-xl font-bold text-slate-800">
                      <div className="p-2 bg-primary/10 rounded-lg mr-3 text-pos-primary">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      Carrito de Compras
                      <Badge variant="secondary" className="ml-3">
                        {activeCart.items.length} {activeCart.items.length === 1 ? 'artículo' : 'artículos'}
                      </Badge>
                    </CardTitle>
                    {activeCart.items.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCart}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Vaciar
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto px-4 pb-4 pt-0 space-y-4 max-h-[50vh]">
                  {activeCart.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <ShoppingCart className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">Tu carrito está vacío</h3>
                      <p className="text-slate-500 max-w-xs">
                        Escanea un producto o búscalo en el panel de la izquierda para comenzar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      <AnimatePresence>
                        {activeCart.items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group"
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.tipo_venta === "peso" ? "bg-orange-50 text-orange-500" : "bg-indigo-50 text-indigo-500"
                              }`}>
                              {item.tipo_venta === "peso" ? <Scale className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <h3 className="font-semibold text-slate-800 text-lg truncate">
                                  {item.nombre || item.descripcion}
                                </h3>
                              </div>
                              <div className="flex items-center flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="text-xs font-normal text-slate-500 bg-slate-50">
                                  {item.codigo || "Sin código"}
                                </Badge>
                                {item.saleType === "weight" && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200">
                                    {formatWeight(item.cantidad)}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                              {/* Quantity Controls */}
                              {item.tipo_venta === "peso" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWeightProduct(item);
                                    setIsWeightSelectorOpen(true);
                                  }}
                                  className="h-9 px-3 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                                >
                                  <Scale className="w-4 h-4 mr-2" />
                                  {formatWeight(item.cantidad)}
                                </Button>
                              ) : (
                                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item, -1)}
                                    className="h-8 w-8 rounded-md hover:bg-white hover:shadow-sm text-slate-600"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    max={item.stock}
                                    value={item.cantidad || 0}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      updateQuantityDirect(item, value);
                                    }}
                                    className="w-12 h-8 text-center bg-transparent border-0 focus-visible:ring-0 p-0 text-sm font-semibold text-slate-700"
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => updateQuantity(item, 1)}
                                    className="h-8 w-8 rounded-md hover:bg-white hover:shadow-sm text-slate-600"
                                    disabled={(item.cantidad || 0) >= item.stock}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}

                              <div className="text-right min-w-[100px]">
                                <p className="font-bold text-lg text-slate-800">
                                  {formatCurrency(calculateItemTotal(item))}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.saleType === "weight"
                                    ? `${formatCurrency(item.precio)}/g` : `${formatCurrency(item.precio)} c/u`}
                                </p>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>

                {/* Total Summary Footer */}
                {activeCart.items.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t shrink-0">
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-slate-500 mb-1">Total a Pagar</div>
                      <div className="text-3xl font-bold text-pos-primary">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Payment Section */}
              {activeCart.items.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm shrink-0">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-500 mb-3 block">Método de Pago</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant={paymentMethod === "cash" ? "default" : "outline"}
                          onClick={() => setPaymentMethod("cash")}
                          className={`h-auto py-3 flex flex-col gap-2 ${paymentMethod === "cash" ? "shadow-md" : "text-slate-600 hover:bg-slate-50 border-slate-200"}`}
                        >
                          <Banknote className="w-6 h-6" />
                          <span>Efectivo</span>
                        </Button>
                        <Button
                          variant={paymentMethod === "card" ? "default" : "outline"}
                          onClick={() => setPaymentMethod("card")}
                          className={`h-auto py-3 flex flex-col gap-2 ${paymentMethod === "card" ? "shadow-md" : "text-slate-600 hover:bg-slate-50 border-slate-200"}`}
                        >
                          <CreditCard className="w-6 h-6" />
                          <span>Tarjeta</span>
                        </Button>
                        <Button
                          variant={paymentMethod === "transfer" ? "default" : "outline"}
                          onClick={() => setPaymentMethod("transfer")}
                          className={`h-auto py-3 flex flex-col gap-2 ${paymentMethod === "transfer" ? "shadow-md" : "text-slate-600 hover:bg-slate-50 border-slate-200"}`}
                        >
                          <ArrowRight className="w-6 h-6" />
                          <span>Transferencia</span>
                        </Button>
                      </div>
                    </div>


                    <AnimatePresence mode="wait">
                      {paymentMethod === "cash" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-visible p-1"
                        >
                          <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 md:col-span-6 space-y-2">
                              <Label className="text-pos-primary font-semibold">Monto Recibido</Label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <Input
                                  type="number"
                                  value={receivedAmount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = parseFloat(value);
                                    if (value === '' || (numValue >= 0 && !isNaN(numValue))) {
                                      setReceivedAmount(value);
                                    }
                                  }}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="text-2xl h-14 pl-8 font-bold border-slate-200 focus:border-pos-primary focus:ring-4 focus:ring-pos-primary/10 relative z-10"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="col-span-12 md:col-span-6 space-y-2">
                              <Label className="text-slate-500">Cambio</Label>
                              <div className={`h-14 rounded-xl border flex items-center px-4 text-2xl font-bold ${change >= 0
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                                }`}>
                                {change >= 0 ? formatCurrency(change) : `-${formatCurrency(Math.abs(change))}`}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "transfer" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <Label>Cuenta CLABE de destino</Label>
                            {isLoadingClabe ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                <span className="text-sm text-muted-foreground">Cargando cuentas...</span>
                              </div>
                            ) : cuentasClabe.length === 0 ? (
                              <div className="space-y-3">
                                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                                  <AlertDescription>
                                    No hay cuentas CLABE configuradas.
                                  </AlertDescription>
                                </Alert>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => navigate("/perfil")}
                                  className="w-full"
                                >
                                  Ir a Perfil para crear cuenta
                                </Button>
                              </div>
                            ) : (
                              <Select
                                value={selectedCuentaClabe}
                                onValueChange={setSelectedCuentaClabe}
                              >
                                <SelectTrigger className="h-12 bg-white">
                                  <SelectValue placeholder="Seleccione una cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cuentasClabe
                                    .filter(cuenta => cuenta.activa !== false)
                                    .map((cuenta) => (
                                      <SelectItem key={cuenta.id} value={cuenta.clabe}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{cuenta.nombre} {cuenta.banco && `- ${cuenta.banco}`}</span>
                                          <span className="text-xs text-muted-foreground">{formatClabe(cuenta.clabe)}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      onClick={completeSale}
                      disabled={
                        !activeCart?.items?.length ||
                        (paymentMethod === "cash" &&
                          (!receivedAmount || parseFloat(receivedAmount) < total)) ||
                        (paymentMethod === "transfer" && !selectedCuentaClabe) ||
                        isProcessingSale
                      }
                      className="w-full h-16 text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                      {isProcessingSale ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-6 h-6 mr-3" />
                          <span>Cobrar {formatCurrency(total)}</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weight Selector Modal */}
      {selectedWeightProduct && (
        <WeightSelector
          product={selectedWeightProduct}
          isOpen={isWeightSelectorOpen}
          onClose={() => {
            setIsWeightSelectorOpen(false);
            setSelectedWeightProduct(null);
          }}
          onAddToCart={addWeightToCart}
          initialGrams={'cantidad' in selectedWeightProduct ? Number(selectedWeightProduct.cantidad) : undefined}

        />
      )}

      {/* Modal de confirmación de transferencia */}
      <Dialog open={showTransferConfirmDialog} onOpenChange={setShowTransferConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Transferencia</DialogTitle>
            <DialogDescription>
              Antes de procesar la venta, confirme si la transferencia ya llegó a la cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Cuenta CLABE seleccionada:</Label>
              <p className="text-sm text-muted-foreground font-mono">
                {selectedCuentaClabe ? formatClabe(selectedCuentaClabe) : "No seleccionada"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Total de la venta:</Label>
              <p className="text-lg font-bold">{formatCurrency(total)}</p>
            </div>
            <Alert>
              <AlertDescription>
                ¿La transferencia por {formatCurrency(total)} ya llegó a la cuenta CLABE {selectedCuentaClabe ? formatClabe(selectedCuentaClabe) : ""}?
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTransferConfirmDialog(false)}
              disabled={isProcessingSale}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={processSale}
              disabled={isProcessingSale}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingSale ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Sí, la transferencia llegó
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

