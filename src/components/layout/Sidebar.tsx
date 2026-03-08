import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Store,
  Calculator,
  LogOut,
  User,
  Bell,
  Menu,
  TerminalSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cerrarSesion } from "@/store/slices/auth/thunks";

const navigation = [
  {
    name: "Caja",
    href: "/caja",
    icon: Calculator,
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: Package,
  },
  {
    name: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Sistema Logs",
    href: "/logs",
    icon: TerminalSquare,
  },
  // {
  //   name: "Usuarios",
  //   href: "/usuarios",
  //   icon: Users,
  // },
  // {
  //   name: "Reportes",
  //   href: "/reports",
  //   icon: FileText,
  // },
];

export default function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const { currentUser } = useSelector((state: any) => state.auth);
  const rol = currentUser?.rol;

  const handleLogout = () => {
    dispatch(cerrarSesion());
  };

  // Filtrar navegación: solo admin (id_rol === 10) puede ver 'Usuarios' y 'Dashboard'
  const filteredNavigation = navigation.filter((item) => {
    if (item.href === "/usuarios") {
      return rol === "10";
    }
    if (item.href === "/dashboard") {
      return rol === "10";
    }
    if (item.href === "/logs") {
      return String(rol) === "0";
    }
    // Ventas está disponible para todos los usuarios
    return true;
  });

  return (
    <div className={cn("flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">e-POS</h1>
            <p className="text-sm text-slate-300">Sistema de Ventas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors duration-200 cursor-pointer",
                isActive && "bg-blue-600 text-white shadow-md",
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions & Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-2">
          {/* User Profile Link */}
          <div
            onClick={() => navigate("/perfil")}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex-1 min-w-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-600/30 group-hover:border-blue-500 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                {currentUser?.nombre?.split(" ")[0] || "Usuario"}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-medium">
                {rol === "10" ? "Admin" : "Cajero"}
              </p>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <div className="scale-90">
              <ThemeToggle />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-slate-900"></span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
