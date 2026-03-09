import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { store_lib } from "@/lib/store";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const queryClient = new QueryClient();
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/layout/Sidebar";
// import Header from "@/components/layout/Header";
import Dashboard from "@/pages/ePos/Dashboard";
import Checkout from "@/pages/ePos/Checkout";
import Inventory from "@/pages/ePos/Inventory";
import Users from "@/pages/ePos/Users";
import Logs from "@/pages/ePos/Logs";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import "./App.css";
import Login from "./pages/auth/Login";
import { Registro } from "./pages/auth/Registro";
import { RecuperarPwd } from "./pages/auth/RecuperarPwd";
import { Card, CardHeader, CardTitle } from "./components/ui/card";
import { Store, Menu } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { revisarSesion } from "./store/slices/auth/thunks";
import { cleanAuthState } from "./store/slices/auth/authSlice";
import { logout } from "./store/slices/e-pos/ePosSlice";
import NotificationManager from "@/components/ui/notification-manager";
import Profile from "./pages/ePos/Profile";
import Ventas from "@/pages/ePos/Ventas";
import { UpdaterNotification } from "@/components/UpdaterNotification";
import { UpdateBanner } from "@/components/UpdateBanner";



function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header / Trigger */}
        <div className="md:hidden flex items-center p-4 border-b bg-background shrink-0 gap-3">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-slate-800 bg-slate-900 text-slate-100">
              <Sidebar className="border-none" />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">e-POS</span>
          </div>
        </div>

        {/* <Header /> */}
        <main className="flex-1 overflow-auto p-3 md:p-6 bg-muted/30">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

function LayoutAuth({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState("");
  const dispatch = useDispatch<any>();

  useEffect(() => {
    dispatch(revisarSesion());
    if ((window as any).electronAPI?.updater?.getAppVersion) {
      (window as any).electronAPI.updater.getAppVersion().then((v: string) => setVersion(v));
    }
  }, []);



  return (
    <div className="min-h-screen bg-gradient-to-br from-pos-primary to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm md:max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-pos-primary rounded-2xl flex items-center justify-center">
            <Store className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl font-bold text-foreground">
              e-POS
            </CardTitle>
            <div className="flex flex-col">
              <p className="text-sm md:text-base text-muted-foreground">Sistema de Ventas</p>
              {version && (
                <p className="text-xs text-muted-foreground/80 font-mono tracking-tighter">v{version}</p>
              )}
            </div>

          </div>
        </CardHeader>

        {children}
      </Card>
    </div>
  );
}

function AppContent() {
  const dispatch = useDispatch<any>();
  const authState = useSelector((state: any) => state.auth);

  useEffect(() => {
    dispatch(revisarSesion());
  }, []);

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg">Cargando...</span>
      </div>
    );
  }

  const exp = JSON.parse(localStorage.getItem('data') || '{}').exp;
  const now = new Date().getTime() / 1000;
  if (exp < now) {
    localStorage.removeItem('data');
    dispatch(cleanAuthState());
    dispatch(logout());
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        {!authState.isAuthenticated ? (
          <>
            <Route path="/login" element={<LayoutAuth><Login /></LayoutAuth>} />
            <Route path="/registro" element={<LayoutAuth><Registro /></LayoutAuth>} />
            <Route path="/recuperar-contrasena" element={<LayoutAuth><RecuperarPwd /></LayoutAuth>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          // Rutas protegidas
          <Route element={<Layout />}>
            <Route path="/caja" element={<Checkout />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/perfil" element={<Profile />} />
            {/* Solo admin */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={["10"]}><Dashboard /></ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute roles={["10"]}><Users /></ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute roles={["0"]}><Logs /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/caja" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pos-ui-theme">
        <Provider store={store}>
          <UpdateBanner />
          <AppContent />
          <NotificationManager />
          <UpdaterNotification />
        </Provider>


      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
