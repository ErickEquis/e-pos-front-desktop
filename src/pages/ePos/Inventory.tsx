import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Product,
  formatWeight,
  getPriceDisplayText,
  getStockDisplayText,
  obtenerProductosInventario,
  crearProductoInventario,
  actualizarProductoInventario,
  eliminarProductoInventario,
  buscarProductosInventario,
  importarProductosExcel
} from "@/store/slices/e-pos/thunks";
import { formatCurrency } from "@/store/slices/e-pos/thunks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Filter,
  Scale,
  Loader2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";


export default function Inventory() {
  const { products, isLoading } = useSelector((state: any) => state.ePos) as { products: Product[]; isLoading: boolean };
  const dispatch = useDispatch<any>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Debounce para la búsqueda (350ms de delay - tiempo óptimo para UX)
  const debouncedSearchTerm = useDebounce(searchTerm, 350);


  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    costo_compra: "",
    stock: "",
    categoria: "",
    codigo: "",
    tipo_venta: "unidad" as "unidad" | "peso",
    weightUnit: "kg" as "g" | "kg",
    minWeight: "",
  });



  // Cargar productos al montar el componente
  useEffect(() => {
    dispatch(obtenerProductosInventario());
  }, [dispatch]);

  // Extraer categorías únicas y normalizadas (en minúsculas)
  const existingCategories = Array.from(
    new Set(
      products
        .map((p) => p.categoria)
        .filter((cat) => cat && cat !== 'Sin categoría' && cat.trim() !== '')
        .map((cat) => cat.trim().toLowerCase())
    )
  ).sort();

  // Categorías para el filtro (con "all" y capitalizadas para mostrar)
  const categories = [
    "all",
    ...existingCategories.map((cat: string) =>
      cat.charAt(0).toUpperCase() + cat.slice(1)
    ),
  ];
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.nombre && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" ||
      (product.categoria &&
        product.categoria.toLowerCase() === selectedCategory.toLowerCase());
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock < 10) ||
      (stockFilter === "out" && product.stock === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      costo_compra: "",
      stock: "",
      categoria: "",
      codigo: "",
      tipo_venta: "unidad",
      weightUnit: "kg",
      minWeight: "",
    });
    setEditingProduct(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    // Para productos por peso, convertir de gramos a la unidad seleccionada
    let stockDisplay = product.stock.toString();
    let weightUnitDisplay = product.weightUnit || "kg";

    if (product.tipo_venta === "peso") {
      // Si el producto tiene stock en gramos y la unidad por defecto es kg, convertir
      if (product.stock >= 1000) {
        stockDisplay = (product.stock / 1000).toString();
        weightUnitDisplay = "kg";
      } else if (product.stock > 0) {
        weightUnitDisplay = "g";
      } else {
        // Si el stock es 0, mantener kg como unidad por defecto
        weightUnitDisplay = "kg";
      }
    }

    const categoriaProducto = product.categoria || "";
    setFormData({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: product.precio.toString(), // El precio ya está por kilo
      costo_compra: product.costo_compra?.toString() || "",
      stock: stockDisplay,
      categoria: categoriaProducto, // La categoría viene en minúsculas del backend
      codigo: product.codigo === 'Sin código' ? "" : (product.codigo || ""),
      tipo_venta: product.tipo_venta,
      weightUnit: weightUnitDisplay,
      minWeight: product.minWeight?.toString() || "",
    });
    setEditingProduct(product);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.nombre ||
      !formData.precio ||
      !formData.stock ||
      !formData.categoria
    ) {
      console.error("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar que la categoría no esté vacía después de trim
    if (!formData.categoria.trim()) {
      console.error("La categoría no puede estar vacía");
      return;
    }

    // Validar que precio y stock sean números válidos
    const precio = parseFloat(formData.precio);
    const stock = parseInt(formData.stock);

    if (isNaN(precio) || precio <= 0) {
      console.error("El precio debe ser un número válido mayor a 0");
      return;
    }

    if (isNaN(stock) || stock <= 0) {
      console.error("El stock debe ser un número válido mayor a 0");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir stock a gramos si la unidad es kg
      let stockFinal = stock;
      if (formData.tipo_venta === "peso" && formData.weightUnit === "kg") {
        stockFinal = stock * 1000; // Convertir kg a gramos
      }

      // Validar costo de compra si se proporciona
      const costoCompra = formData.costo_compra.trim() !== ""
        ? (() => {
          const costo = parseFloat(formData.costo_compra);
          return !isNaN(costo) && costo >= 0 ? costo : undefined;
        })()
        : undefined;

      // Normalizar categoría a minúsculas (el backend también lo hace, pero lo hacemos aquí para consistencia)
      const categoriaNormalizada = formData.categoria.trim().toLowerCase();

      const productData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion.trim() || undefined,
        precio: precio, // Enviar precio tal como está (por kilo)
        costo_compra: costoCompra,
        stock: stockFinal,
        categoria: categoriaNormalizada,
        codigo: formData.codigo.trim() || undefined,
        tipo_venta: formData.tipo_venta,
        weightUnit:
          formData.tipo_venta === "peso" ? formData.weightUnit : undefined,
        minWeight:
          formData.tipo_venta === "peso" && formData.minWeight
            ? (() => {
              const minWeight = parseInt(formData.minWeight);
              return !isNaN(minWeight) && minWeight > 0 ? minWeight : undefined;
            })()
            : undefined,
      };

      let result;
      if (editingProduct) {
        result = await dispatch(actualizarProductoInventario(editingProduct.id, productData));
      } else {
        result = await dispatch(crearProductoInventario(productData));
      }

      if (result.success) {
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await dispatch(eliminarProductoInventario(productId));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      dispatch(obtenerProductosInventario());
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      await dispatch(buscarProductosInventario(term));
    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: "Agotado", variant: "destructive" as const };
    if (stock < 10)
      return { label: "Stock Bajo", variant: "secondary" as const };
    return { label: "En Stock", variant: "default" as const };
  };

  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario</h1>
          <p className="text-slate-500 mt-1">Gestiona tu catálogo de productos y existencias</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="flex-1 md:flex-none border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  {editingProduct ? (
                    <Edit className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="bg-blue-100 p-1 rounded-md">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct
                    ? "Actualiza la información del producto en tu inventario."
                    : "Completa los detalles para registrar un nuevo producto."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nombre" className="text-sm font-medium text-slate-700">Nombre del Producto *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      placeholder="Ej: Café Americano Tostado"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria" className="text-sm font-medium text-slate-700">Categoría *</Label>
                    <div className="mt-1.5">
                      <CategoryCombobox
                        value={formData.categoria}
                        onValueChange={(value) =>
                          setFormData({ ...formData, categoria: value })
                        }
                        categories={existingCategories}
                        placeholder="Seleccionar categoría..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo_venta" className="text-sm font-medium text-slate-700">Tipo de Venta *</Label>
                    <Select
                      value={formData.tipo_venta}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, tipo_venta: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Por Unidad (pza)</SelectItem>
                        <SelectItem value="peso">Por Peso (kg/g)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center">
                    <Scale className="w-4 h-4 mr-2 text-slate-500" />
                    Detalles de Inventario y Precio
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="precio" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Precio Venta {formData.tipo_venta === "peso" ? "(por kg)" : ""} *
                      </Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="precio"
                          type="number"
                          step="0.01"
                          value={formData.precio}
                          onChange={(e) =>
                            setFormData({ ...formData, precio: e.target.value })
                          }
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                      {formData.tipo_venta === "peso" && formData.precio && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          ${(() => {
                            const precio = parseFloat(formData.precio);
                            return !isNaN(precio) ? (precio / 1000).toFixed(2) : "0.00";
                          })()} / gramo
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="costo_compra" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Costo Compra {formData.tipo_venta === "peso" ? "(por kg)" : ""}
                      </Label>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="costo_compra"
                          type="number"
                          step="0.01"
                          value={formData.costo_compra}
                          onChange={(e) =>
                            setFormData({ ...formData, costo_compra: e.target.value })
                          }
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Stock Actual *
                      </Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          id="stock"
                          type="number"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                          }
                          placeholder="0"
                          className="flex-1"
                        />
                        <div className="flex items-center justify-center bg-slate-100 border border-slate-200 px-3 rounded text-sm text-slate-600 font-medium min-w-[3rem]">
                          {formData.tipo_venta === 'peso' ? (formData.weightUnit === 'kg' ? 'kg' : 'g') : 'unid'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="codigo" className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Código / SKU
                      </Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) =>
                          setFormData({ ...formData, codigo: e.target.value })
                        }
                        placeholder="Opcional"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                {formData.tipo_venta === "peso" && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weightUnit" className="text-xs font-medium text-blue-700">Unidad de Entrada</Label>
                        <Select
                          value={formData.weightUnit}
                          onValueChange={(value: any) =>
                            setFormData({ ...formData, weightUnit: value })
                          }
                        >
                          <SelectTrigger className="mt-1 h-8 bg-white border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                            <SelectItem value="g">Gramos (g)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="minWeight" className="text-xs font-medium text-blue-700">Venta Mínima (g)</Label>
                        <Input
                          id="minWeight"
                          type="number"
                          value={formData.minWeight}
                          onChange={(e) =>
                            setFormData({ ...formData, minWeight: e.target.value })
                          }
                          placeholder="10"
                          className="mt-1 h-8 bg-white border-blue-200"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-600 mt-2">
                      * El sistema almacena internamente en gramos.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="descripcion" className="text-sm font-medium text-slate-700">Descripción (Opcional)</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Detalles adicionales del producto..."
                    className="mt-1.5"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                  className="border-slate-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingProduct ? "Guardar Cambios" : "Registrar Producto"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Package className="w-24 h-24 transform translate-x-4 -translate-y-4" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Productos
              </CardTitle>
              <Package className="h-5 w-5 text-blue-100" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-blue-100 mt-1 opacity-80">
                Productos registrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Stock Bajo</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{lowStockCount}</div>
              <p className="text-xs text-slate-500 mt-1">
                Productos con menos de 10 unidades
              </p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400"></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-white overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Agotados</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{outOfStockCount}</div>
              <p className="text-xs text-slate-500 mt-1">Productos sin stock</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-red-400"></div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              )}
              <Input
                placeholder="Buscar por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-48 bg-white border-slate-200">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(category => category && category !== "").map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "Todas las categorías" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full md:w-48 bg-white border-slate-200">
                  <SelectValue placeholder="Estado del stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="low">Stock Bajo</SelectItem>
                  <SelectItem value="out">Agotados</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || selectedCategory !== "all" || stockFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setStockFilter("all");
                    dispatch(obtenerProductosInventario());
                  }}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  title="Limpiar filtros"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-lg bg-white overflow-hidden flex flex-col h-[calc(100vh-380px)]">
        <div className="overflow-auto flex-1">
          <table className="w-full relative">
            <thead className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-slate-500 text-sm">Producto</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-500 text-sm">Categoría</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-500 text-sm">Precio</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-500 text-sm">Stock</th>
                <th className="text-left py-4 px-6 font-semibold text-slate-500 text-sm">Estado</th>
                <th className="text-right py-4 px-6 font-semibold text-slate-500 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredProducts.map((product, index) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center">
                            <span className="font-semibold text-slate-900">{product.nombre || product.descripcion}</span>
                            {product.tipo_venta === "peso" && (
                              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 text-[10px]">
                                <Scale className="w-3 h-3 mr-1" /> Peso
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {product.codigo || "Sin código"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="border-slate-200 text-slate-600 font-normal bg-white">
                          {product.categoria}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">
                          {getPriceDisplayText(product)}
                        </div>
                        {product.costo_compra !== undefined && product.costo_compra !== null ? (
                          <div className="text-xs text-slate-400 mt-0.5">
                            Costo: {product.tipo_venta === "peso" ? `${formatCurrency(product.costo_compra)}/kg` : formatCurrency(product.costo_compra)}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-700">
                          {getStockDisplayText(product)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={stockStatus.variant} className={
                          stockStatus.variant === "destructive" ? "bg-red-100 text-red-700 hover:bg-red-200 border-0" :
                            stockStatus.variant === "secondary" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0" :
                              "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                        }>
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar producto?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El producto
                                  "{product.nombre || product.descripcion}" será eliminado
                                  permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No se encontraron productos</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-1">Intenta ajustar los filtros o tu búsqueda para encontrar lo que necesitas.</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setStockFilter("all");
                dispatch(obtenerProductosInventario());
              }} className="mt-4 border-slate-200 text-slate-700 hover:bg-slate-50">
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Import Excel Dialog */}
      <ImportExcelDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={async (products) => {
          await dispatch(importarProductosExcel(products));
        }}
      />
    </div>
  );
}
