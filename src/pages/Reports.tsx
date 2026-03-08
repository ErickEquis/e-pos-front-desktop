import React, { useState } from "react";
import { useAppStore, formatCurrency } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Filter,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Reports() {
  const { state } = useAppStore();
  const { sales, products, users } = state;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");

  // Filter sales based on date range and other filters
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDateRange =
      (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate);
    const matchesEmployee =
      selectedEmployee === "all" || sale.employeeId === selectedEmployee;
    const matchesPayment =
      selectedPaymentMethod === "all" ||
      sale.paymentMethod === selectedPaymentMethod;

    return matchesDateRange && matchesEmployee && matchesPayment;
  });

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTicket =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Group sales by payment method
  const paymentMethodStats = filteredSales.reduce(
    (acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Top selling products
  const productStats = filteredSales.reduce(
    (acc, sale) => {
      sale.items.forEach((item) => {
        if (!acc[item.product.id]) {
          acc[item.product.id] = {
            product: item.product,
            totalSold: 0,
            revenue: 0,
          };
        }
        acc[item.product.id].totalSold += item.quantity;
        acc[item.product.id].revenue += item.quantity * item.product.price;
      });
      return acc;
    },
    {} as Record<string, { product: any; totalSold: number; revenue: number }>,
  );

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Sales by employee
  const employeeStats = filteredSales.reduce(
    (acc, sale) => {
      if (!acc[sale.employeeId]) {
        const employee = users.find((u) => u.id === sale.employeeId);
        acc[sale.employeeId] = {
          employee: employee?.name || "Usuario desconocido",
          sales: 0,
          revenue: 0,
        };
      }
      acc[sale.employeeId].sales += 1;
      acc[sale.employeeId].revenue += sale.total;
      return acc;
    },
    {} as Record<string, { employee: string; sales: number; revenue: number }>,
  );

  // Daily sales for the filtered period
  const dailySales = filteredSales.reduce(
    (acc, sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    },
    {} as Record<string, number>,
  );

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedEmployee("all");
    setSelectedPaymentMethod("all");
  };

  const exportReport = () => {
    // In a real app, this would generate and download a proper report
    const reportData = {
      period: `${dateFrom || "Inicio"} - ${dateTo || "Fin"}`,
      totalRevenue,
      totalTransactions,
      averageTicket,
      sales: filteredSales,
      topProducts,
      employeeStats,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-ventas-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Análisis de ventas y rendimiento</p>
        </div>
        <Button onClick={exportReport} disabled={filteredSales.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <Label>Empleado</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Ventas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">Por transacción</p>
          </CardContent>
        </Card>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((item, index) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-pos-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.totalSold} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">Ingresos</p>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay datos de productos para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(paymentMethodStats).map(([method, amount]) => {
                const percentage =
                  totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                const methodNames = {
                  cash: "Efectivo",
                  card: "Tarjeta",
                  transfer: "Transferencia",
                };

                return (
                  <div key={method} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {methodNames[method as keyof typeof methodNames]}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pos-primary h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {percentage.toFixed(1)}% del total
                    </div>
                  </div>
                );
              })}
              {Object.keys(paymentMethodStats).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay datos de pagos para mostrar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento por Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Empleado</th>
                  <th className="text-left py-3 px-4 font-medium">Ventas</th>
                  <th className="text-left py-3 px-4 font-medium">Ingresos</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Promedio por Venta
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(employeeStats).map((stat, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{stat.employee}</td>
                    <td className="py-3 px-4">{stat.sales}</td>
                    <td className="py-3 px-4 font-semibold">
                      {formatCurrency(stat.revenue)}
                    </td>
                    <td className="py-3 px-4">
                      {formatCurrency(stat.revenue / stat.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {Object.keys(employeeStats).length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  No hay datos de empleados para mostrar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ventas Recientes</span>
            <Badge variant="outline">
              {filteredSales.length} transacciones
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredSales.slice(0, 10).map((sale) => {
              const employee = users.find((u) => u.id === sale.employeeId);
              return (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {sale.customerName || "Cliente Anónimo"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.date).toLocaleString()} - {employee?.name}{" "}
                      - {sale.items.length} productos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(sale.total)}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {filteredSales.length === 0 && (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  No hay ventas para mostrar con los filtros aplicados
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
