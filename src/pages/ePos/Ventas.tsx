import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Eye, Trash2, Search, CalendarIcon, DollarSign, TrendingUp, Activity, History } from 'lucide-react';
import { eposApi as api } from "@/api/e-posApi";
import { useSelector } from 'react-redux';
import { RootState } from "@/store/store";
import { motion, AnimatePresence } from "framer-motion";

export default function Ventas() {
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Calculate default dates (Last 30 days) to ensure data visibility
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    idUsuario: 'all',
    search: '',
  });

  // Estados para estadísticas
  const [periodoTotalVentas, setPeriodoTotalVentas] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [stats, setStats] = useState<any>(null);
  const [estadisticasVentas, setEstadisticasVentas] = useState<any>(null);

  // Estados para gráficos/top
  const [tipoTopProductos, setTipoTopProductos] = useState<'unidad' | 'peso'>('unidad');
  const [criterioTopProductos, setCriterioTopProductos] = useState<'cantidad' | 'ganancia'>('cantidad');

  // Estados modales
  const [loading, setLoading] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [detalleVenta, setDetalleVenta] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any[]>([]);
  const [originalCantidad, setOriginalCantidad] = useState<{ [key: number]: number }>({});
  const [ventaAEliminar, setVentaAEliminar] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historialVenta, setHistorialVenta] = useState<any[]>([]);


  const userId = useSelector((state: RootState) => state.auth.currentUser?.id);
  const userRole = useSelector((state: RootState) => state.auth.currentUser?.rol);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/usuarios');
        setUsers(res.data || []);
      } catch (error) {
        console.error("Error cargando usuarios", error);
      }
    };
    fetchUsers();
  }, []);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      // User confirmed API does not support filtering, so we fetch all
      const res = await api.get(`/ventas`);
      const ventasData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      console.log("Ventas Data Loaded:", ventasData); // DEBUG LOG
      setSales(ventasData);

      try {
        const statsRes = await api.get(`/ventas-estadisticas`);
        setStats(statsRes.data);
      } catch (err) {
        // Fallback stats logic handled via memos
        console.error("Error loading stats", err);
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Error al cargar ventas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []); // Only load once on mount, filtering is client-side

  // MOVED UP: Must be defined before used in other useMemos
  const ventasFiltradas = useMemo(() => {
    let filtered = sales;

    // Filter by Date (Client-side)
    // Using fecha_venta_raw now provided by backend for correct comparison
    if (filtros.fechaDesde) {
      filtered = filtered.filter(v => {
        const fechaVenta = v.fecha_venta_raw?.split(' ')[0] || v.fecha_venta_raw?.split('T')[0] || v.date?.split(' ')[0] || v.fecha_venta?.split(' ')[0]; // Fallbacks
        // Basic lexicographical comparison works for ISO dates (YYYY-MM-DD vs YYYY-MM-DD)
        // console.log(`Comparing ${fechaVenta} >= ${filtros.fechaDesde}`);
        return fechaVenta >= filtros.fechaDesde;
      });
    }
    if (filtros.fechaHasta) {
      filtered = filtered.filter(v => {
        const fechaVenta = v.fecha_venta_raw?.split(' ')[0] || v.fecha_venta_raw?.split('T')[0] || v.date?.split(' ')[0] || v.fecha_venta?.split(' ')[0]; // Fallbacks
        return fechaVenta <= filtros.fechaHasta;
      });
    }

    // Filter by User (Client-side)
    if (filtros.idUsuario && filtros.idUsuario !== 'all') {
      filtered = filtered.filter(v => {
        // Loose comparison for ID (number vs string)
        const matchId = (v.usuario_id && String(v.usuario_id) == String(filtros.idUsuario)) ||
          (v.id_usuario && String(v.id_usuario) == String(filtros.idUsuario));

        if (matchId) return true;

        // Fallback: match by name if ID fails
        const selectedUser = users.find(u => String(u.id) == String(filtros.idUsuario));
        if (selectedUser) {
          return (v.usuario_nombre && v.usuario_nombre === selectedUser.nombre) ||
            (v.usuario && v.usuario === selectedUser.nombre);
        }
        return false;
      });
    }

    // Filter by Search
    if (filtros.search) {
      const lower = filtros.search.toLowerCase();
      filtered = filtered.filter((v: any) =>
        (v.usuario_nombre || '').toLowerCase().includes(lower) ||
        (v.id || '').toString().includes(lower) ||
        (v.metodo_pago || '').toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [sales, filtros.search, filtros.fechaDesde, filtros.fechaHasta, filtros.idUsuario, users]);

  // Derived stats from filtered view
  const totalVentasPeriodo = useMemo(() => {
    const source = ventasFiltradas;
    const total = source.reduce((acc, v) => acc + Number(v.total_venta || v.total || 0), 0);
    const cantidad = source.length;
    const totalGanancia = source.reduce((acc, v) => acc + Number(v.ganancia_total || 0), 0);
    const margen = total > 0 ? (totalGanancia / total) * 100 : 0;
    return { total, cantidad, margen, ganancia: totalGanancia };
  }, [ventasFiltradas]);

  useEffect(() => {
    if (stats) setEstadisticasVentas(stats);
  }, [stats]);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(val));
  };

  const handleVerDetalle = async (id: number) => {
    setSelectedVentaId(id);
    setIsDetailOpen(true);
    setDetalleVenta(null);
    try {
      const res = await api.get(`/ventas/${id}`);
      setDetalleVenta(res.data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" });
    }
  };

  const handleEditar = async (venta: any) => {
    try {
      const res = await api.get(`/ventas/${venta.id}`);
      const data = res.data;
      const productos = data.productos.map((p: any) => ({
        ...p,
        cantidad: Number(p.cantidad),
      }));
      const originalMap: any = {};
      productos.forEach((p: any, i: number) => { originalMap[i] = Number(p.cantidad); });

      setEditForm(productos);
      setOriginalCantidad(originalMap);
      setSelectedVentaId(venta.id);
      setIsEditOpen(true);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo preparar edición", variant: "destructive" });
    }
  };

  const handleEditChange = (index: number, field: string, value: any) => {
    const newForm = [...editForm];
    newForm[index][field] = value;
    setEditForm(newForm);
  };

  const handleGuardarEdicion = async () => {
    try {
      const payload = {
        productos: editForm.map(p => ({
          ...p, // Include all original fields (nombre, descripcion, categoria, codigo, etc.)
          id: p.id || p.producto_id,
          cantidad: p.cantidad,
          precio: p.precio,
          tipo_venta: p.tipo_venta
        })),
        total_venta: editForm.reduce((acc, p) => {
          const qty = Number(p.cantidad);
          const price = Number(p.precio);
          const subtotal = p.tipo_venta === 'peso' ? (qty / 1000) * price : qty * price;
          return acc + subtotal;
        }, 0)
      };
      await api.patch(`/ventas/${selectedVentaId}`, payload);
      toast({ title: "Éxito", description: "Venta actualizada correctamente" });
      setIsEditOpen(false);
      cargarVentas();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar la venta", variant: "destructive" });
    }
  };

  const handleVerHistorial = async (id: number) => {
    setSelectedVentaId(id);
    setIsHistoryOpen(true);
    setHistorialVenta([]);
    try {
      const res = await api.get(`/ventas-historial/${id}`);
      setHistorialVenta(res.data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar el historial", variant: "destructive" });
    }
  };

  const handleEliminar = (id: number) => {
    setVentaAEliminar(id);
  };

  const confirmarEliminar = async () => {
    if (!ventaAEliminar) return;
    try {
      await api.delete(`/ventas/${ventaAEliminar}`);
      toast({ title: "Venta eliminada", description: "La venta ha sido anulada." });
      cargarVentas();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar la venta", variant: "destructive" });
    } finally {
      setVentaAEliminar(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-2 max-w-[1600px] mx-auto pb-10"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reporte de Ventas</h1>
          <p className="text-slate-500 mt-1">Gestión y análisis de transacciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 border-slate-200 shadow-sm" onClick={cargarVentas}>
            <History className="w-4 h-4" /> Actualizar
          </Button>

        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Ventas", val: formatCurrency(totalVentasPeriodo.total), sub: `${totalVentasPeriodo.cantidad} transacciones`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "Ganancia Neta", val: formatCurrency(totalVentasPeriodo.ganancia), sub: "Margen promedio", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Margen Global", val: `${totalVentasPeriodo.margen.toFixed(1)}%`, sub: "Rentabilidad", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Caja Actual", val: "$0.00", sub: "Cierre pendiente", icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg shadow-slate-200/50 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.val}</div>
              <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filter Bar - Glassmorphism */}
      <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-4 sticky top-4 z-30">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Buscar..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                className="pl-10 h-10 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl shadow-inner"
              />
            </div>
            <div className="flex gap-2 items-center p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              <Input type="date" value={filtros.fechaDesde} onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })} className="h-8 w-36 bg-transparent border-0 focus:ring-0 text-sm shadow-none" />
              <span className="text-slate-300">|</span>
              <Input type="date" value={filtros.fechaHasta} onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })} className="h-8 w-36 bg-transparent border-0 focus:ring-0 text-sm shadow-none" />
            </div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Select value={filtros.idUsuario} onValueChange={(val) => setFiltros({ ...filtros, idUsuario: val })}>
              <SelectTrigger className="w-[180px] h-10 bg-white border-0 shadow-sm rounded-xl"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map((u: any) => (<SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
            {(filtros.search || filtros.idUsuario !== 'all' || filtros.fechaDesde || filtros.fechaHasta) && (
              <Button variant="ghost" onClick={() => setFiltros({ ...filtros, search: '', idUsuario: 'all', fechaDesde: '', fechaHasta: '' })} className="h-10 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl">Limpiar</Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Areas */}
      {estadisticasVentas && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Products */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-slate-800">Top Productos</CardTitle>
                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
                  {['cantidad', 'ganancia'].map(type => (
                    <button key={type} onClick={() => setCriterioTopProductos(type as any)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${criterioTopProductos === type ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                      {type === 'cantidad' ? 'Volumen' : 'Ganancia'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 space-y-5">
                {(() => {
                  const list = tipoTopProductos === 'peso' ? (estadisticasVentas.top_productos_peso || []) : (estadisticasVentas.top_productos_unidad || []);
                  const sorted = [...list].sort((a, b) => (criterioTopProductos === 'cantidad' ? (b.cantidad || 0) - (a.cantidad || 0) : (b.ganancia || 0) - (a.ganancia || 0)));
                  const max = Math.max(...sorted.map(p => criterioTopProductos === 'cantidad' ? (p.cantidad || 0) : (p.ganancia || 0)), 1);

                  return sorted.slice(0, 5).map((p: any, idx: number) => {
                    const val = criterioTopProductos === 'cantidad' ? (p.cantidad || 0) : (p.ganancia || 0);
                    const pct = Math.min((val / max) * 100, 100);
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : idx === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center text-xs font-bold`}>{idx + 1}</span>
                            {p.nombre}
                          </span>
                          <span className="font-bold text-slate-900">{criterioTopProductos === 'cantidad' ? p.cantidad : formatCurrency(p.ganancia)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-blue-300'}`} />
                        </div>
                      </div>
                    )
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Top Sellers */}
          <Card className="border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4"><CardTitle className="text-base font-bold text-slate-800">Top Vendedores</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              {estadisticasVentas.top_vendedores?.slice(0, 4).map((v: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-50 text-indigo-600'}`}>{v.nombre.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800">{v.nombre}</h4>
                      {idx === 0 && <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px] px-1.5">Top</Badge>}
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-slate-500">{v.cantidad_ventas} ventas</span>
                      <span className="font-bold text-slate-900">{formatCurrency(v.total_ventas)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modern Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border-0 flex flex-col h-[600px] overflow-hidden relative">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                {['Fecha', 'Total', 'Ganancia', 'Método', 'Vendedor', 'Estado', 'Acciones'].map((h, i) => (
                  <th key={i} className={`px-6 py-5 ${i > 1 ? 'hidden sm:table-cell' : ''} ${i > 3 ? 'hidden md:table-cell' : ''} ${i > 4 ? 'hidden lg:table-cell' : ''} ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ventasFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center text-slate-400">No se encontraron ventas</td></tr>
              ) : (
                ventasFiltradas.map((venta: any, index: number) => (
                  <motion.tr
                    key={venta.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-slate-50/80 transition-all border-l-4 border-transparent hover:border-blue-500"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{venta.fecha_venta?.split(' ')[0]}</div>
                      <div className="text-xs text-slate-400">{venta.fecha_venta?.split(' ')[1]}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-base">{formatCurrency(venta.total_venta || venta.total)}</td>
                    <td className="px-6 py-4 hidden sm:table-cell"><Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-0">+{formatCurrency(venta.ganancia_total)}</Badge></td>
                    <td className="px-6 py-4 hidden sm:table-cell"><Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">{venta.metodo_pago === 'cash' ? 'Efectivo' : venta.metodo_pago}</Badge></td>
                    <td className="px-6 py-4 hidden md:table-cell font-medium text-slate-600">{venta.usuario_nombre}</td>
                    <td className="px-6 py-4 hidden lg:table-cell">{venta.modificado && <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Editado</Badge>}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => handleVerDetalle(venta.id)}><Eye className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full" onClick={() => handleVerHistorial(venta.id)}><History className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" onClick={() => handleEditar(venta)}><Edit className="w-4 h-4" /></Button>
                        {(Number(userRole) === 10 || Number(userRole) === 0) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleEliminar(venta.id)}><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Confirmar eliminación</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmarEliminar} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Dialogs (Simplified for brevity, assuming same content but updated styles) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl bg-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="text-xl font-bold">Editar Venta #{selectedVentaId}</DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Same table logic as before, just ensuring clean styles */}
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 border-b"><th className="pb-3 text-left">Producto</th><th className="pb-3 text-center">Cantidad</th><th className="pb-3 text-right">Total</th></tr></thead>
              <tbody>
                {editForm.map((p, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-medium">{p.nombre}</td>
                    <td className="py-3 flex justify-center gap-2 items-center">
                      {p.tipo_venta !== 'peso' && <Button size="sm" variant="outline" className="h-8 w-8" onClick={() => handleEditChange(i, 'cantidad', Math.max(0, Number(p.cantidad) - 1))}>-</Button>}
                      <Input type="number" value={p.tipo_venta === 'peso' ? Number(p.cantidad) / 1000 : p.cantidad} onChange={e => handleEditChange(i, 'cantidad', p.tipo_venta === 'peso' ? Number(e.target.value) * 1000 : Number(e.target.value))} className="w-20 text-center h-8" />
                      {p.tipo_venta !== 'peso' && <Button size="sm" variant="outline" className="h-8 w-8" onClick={() => handleEditChange(i, 'cantidad', Number(p.cantidad) + 1)}>+</Button>}
                    </td>
                    <td className="py-3 text-right font-bold">{formatCurrency(Number(p.cantidad) * (p.tipo_venta === 'peso' ? p.precio / 1000 : p.precio))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardarEdicion} className="bg-blue-600">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <History className="w-5 h-5 text-amber-500" /> Historial de Cambios
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {historialVenta.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No hay cambios registrados</p>
                <p className="text-xs text-slate-400">Esta venta se mantiene original</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-8 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {historialVenta.map((h: any, i: number) => (
                  <div key={i} className="relative pl-6">
                    {/* Timestamp dot */}
                    <div className="absolute left-[-5px] top-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full z-10 box-content"></div>

                    <div className="mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{h.fecha_modificacion}</span>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-50">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {h.usuario_nombre?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">Modificado por <span className="text-slate-900 font-bold">{h.usuario_nombre}</span></span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs text-slate-400 mb-1">Total Venta</span>
                          <span className="block text-base font-bold text-slate-900">{formatCurrency(h.total_venta)}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400 mb-1">Ganancia</span>
                          <span className="block text-base font-bold text-emerald-600">+{formatCurrency(h.ganancia_total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t justify-center">
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="w-full">Cerrar Historial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-3xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div><h2 className="text-xl font-bold">Detalle #{selectedVentaId}</h2><p className="opacity-70 text-sm">{detalleVenta?.fecha_venta}</p></div>
            <Badge className={detalleVenta?.modificado ? 'bg-amber-500' : 'bg-emerald-500'}>{detalleVenta?.modificado ? 'Modificado' : 'Original'}</Badge>
          </div>
          <div className="p-6">
            {/* Product List */}
            <div className="space-y-2 mb-6">
              {detalleVenta?.productos.map((p: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-800">{p.nombre} <span className="text-slate-400 text-xs ml-2">x {p.cantidad}</span></div>
                  <div className="font-bold">{formatCurrency(Number(p.cantidad) * (p.tipo_venta === 'peso' ? p.precio / 1000 : p.precio))}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              <Button onClick={() => { setIsDetailOpen(false); handleEditar(detalleVenta); }} className="bg-blue-600">Editar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
