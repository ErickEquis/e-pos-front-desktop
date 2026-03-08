import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { formatCurrency, getDataDashboard } from "@/store/slices/e-pos/thunks";

// Custom hook for counter animation
const useCounterAnimation = (endValue: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(endValue * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration]);

  return count;
};

export default function Dashboard() {
  const { products, users } = useSelector((state: any) => state.ePos);
  const dispatch = useDispatch<any>();

  const metrics = [
    {
      title: "Ventas de Hoy",
      value: 0,
      icon: DollarSign,
      description: `${0} transacciones`,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Ventas",
      value: 0,
      icon: ShoppingCart,
      description: "Todas las transacciones",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Productos",
      value: products.length,
      icon: Package,
      description: `${0} con stock bajo`,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Usuarios Activos",
      value: 0,
      icon: Users,
      description: `${users.length} total`,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  const [metricsValues, setMetricsValues] = useState<any[]>(metrics);
  const [ventas, setVentas] = useState<any[]>([]);
  const [productosStockBajo, setProductosStockBajo] = useState<any[]>([]);

  // Counter animations for each metric
  const ventasHoyCount = useCounterAnimation(metricsValues.find(m => m.title === "Ventas de Hoy")?.value || 0);
  const totalVentasCount = useCounterAnimation(metricsValues.find(m => m.title === "Total Ventas")?.value || 0);
  const productosCount = useCounterAnimation(metricsValues.find(m => m.title === "Productos")?.value || 0);
  const usuariosCount = useCounterAnimation(metricsValues.find(m => m.title === "Usuarios Activos")?.value || 0);

  const getDashboard = async () => {
    const response = await dispatch(getDataDashboard());
    setVentas(response.ventas);
    setProductosStockBajo(response.productos_stock_bajo);

    setMetricsValues(metricsValues.map((metric) => {
      if (metric.title === "Total Ventas") {
        return {
          ...metric,
          value: response.total_venta ?? 0,
          description: `${response.ventas.length} transacciones`
        }
      }
      if (metric.title === "Ventas de Hoy") {
        return {
          ...metric,
          value: response.ventas.length ?? 0,
          description: `${response.ventas.length} transacciones`
        }
      }
      if (metric.title === "Productos") {
        return {
          ...metric,
          value: response.productos.length ?? 0,
          description: `${response.productos.length} productos`
        }
      }
      if (metric.title === "Usuarios Activos") {
        return {
          ...metric,
          value: response.usuarios_activos ?? 0,
          description: `${response.usuarios_inactivos} usuarios inactivos`
        }
      }

      return metric;
    }));
  }

  const pintarMetricas = () => {
    return metricsValues.map((metric) => {
      // Get the animated value based on metric title
      let animatedValue = 0;
      if (metric.title === "Ventas de Hoy") {
        animatedValue = ventasHoyCount;
      } else if (metric.title === "Total Ventas") {
        animatedValue = totalVentasCount;
      } else if (metric.title === "Productos") {
        animatedValue = productosCount;
      } else if (metric.title === "Usuarios Activos") {
        animatedValue = usuariosCount;
      }

      // Format the value based on metric type
      let displayValue: string | number = animatedValue;
      if (metric.title === "Total Ventas") {
        displayValue = formatCurrency(animatedValue);
      } else {
        displayValue = animatedValue.toString();
      }

      return (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div
              className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}
            >
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {displayValue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      )
    });
  }

  useEffect(() => {
    // getVentasHoy();
    pintarMetricas();
    // getVentas();
    getDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu negocio</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {pintarMetricas()}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>Últimas transacciones realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {ventas.slice(0, 10).map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {venta.customerName || "Cliente Anónimo"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(venta.fecha_venta).toLocaleDateString()} -{" "}
                      {venta.productos.length} productos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(venta.total_venta)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {venta.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}
              {ventas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No hay ventas registradas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Productos con Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos que necesitan reposición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {productosStockBajo.slice(0, 5).map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div>
                    <p className="font-medium text-foreground">{producto.descripcion}</p>
                    <p className="text-sm text-muted-foreground">{producto.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {producto.stock} unidades
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(producto.precio)}
                    </p>
                  </div>
                </div>
              ))}
              {productosStockBajo.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p>Todos los productos tienen stock suficiente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
