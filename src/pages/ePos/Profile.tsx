import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, MailIcon, Lock, AlertCircle, CreditCard, Plus, Edit, Trash2 } from "lucide-react";
import { cambiarContrasenia } from "@/store/slices/auth/thunks";
import { obtenerCuentasClabe, crearCuentaClabe, actualizarCuentaClabe, eliminarCuentaClabe, CuentaClabe } from "@/store/slices/e-pos/thunks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Profile = () => {
  const dispatch = useDispatch<any>();
  const { currentUser, isLoading } = useSelector((state: any) => state.auth);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Función para formatear CLABE separando cada 3 dígitos
  const formatClabe = (clabe: string): string => {
    if (!clabe) return "";
    // Remover espacios existentes y separar cada 3 dígitos
    const cleanClabe = clabe.replace(/\s/g, "");
    return cleanClabe.match(/.{1,3}/g)?.join(" ") || clabe;
  };
  
  // Estados para cuentas CLABE
  const [cuentasClabe, setCuentasClabe] = useState<CuentaClabe[]>([]);
  const [isCuentasLoading, setIsCuentasLoading] = useState(false);
  const [isCuentaDialogOpen, setIsCuentaDialogOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaClabe | null>(null);
  const [cuentaToDelete, setCuentaToDelete] = useState<CuentaClabe | null>(null);
  const [cuentaForm, setCuentaForm] = useState({
    clabe: "",
    banco: "",
    nombre: "",
  });

  // Cargar cuentas CLABE al montar el componente
  useEffect(() => {
    loadCuentasClabe();
  }, []);

  const loadCuentasClabe = async () => {
    setIsCuentasLoading(true);
    try {
      const cuentas = await dispatch(obtenerCuentasClabe());
      setCuentasClabe(cuentas || []);
    } catch (error) {
      console.error("Error al cargar cuentas CLABE:", error);
    } finally {
      setIsCuentasLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    if (!currentPwd || !newPwd || !confirmPwd) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    const payload = {
      contrasenia_actual: currentPwd,
      nueva_contrasenia: newPwd,
      correo: currentUser?.correo
    };

    const result = await dispatch(cambiarContrasenia(payload));
    
    if (result.success) {
      setMensaje(result.mensaje || "Contraseña cambiada correctamente");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setShowPasswordFields(false);
    } else {
      setError(result.mensaje || "Error al cambiar la contraseña");
    }
  };

  // Handlers para cuentas CLABE
  const handleOpenCuentaDialog = (cuenta?: CuentaClabe) => {
    if (cuenta) {
      setEditingCuenta(cuenta);
      setCuentaForm({
        clabe: cuenta.clabe,
        banco: cuenta.banco || "",
        nombre: cuenta.nombre || "",
      });
    } else {
      setEditingCuenta(null);
      setCuentaForm({
        clabe: "",
        banco: "",
        nombre: "",
      });
    }
    setIsCuentaDialogOpen(true);
  };

  const handleCloseCuentaDialog = () => {
    setIsCuentaDialogOpen(false);
    setEditingCuenta(null);
    setCuentaForm({
      clabe: "",
      banco: "",
      nombre: "",
    });
    setError("");
    setMensaje("");
  };

  const handleSubmitCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cuentaForm.clabe || !cuentaForm.banco || !cuentaForm.nombre) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    // Validar formato CLABE (18 dígitos)
    if (!/^\d{18}$/.test(cuentaForm.clabe)) {
      setError("La CLABE debe tener exactamente 18 dígitos.");
      return;
    }

    setError("");
    setIsCuentasLoading(true);

    try {
      let result;
      if (editingCuenta) {
        result = await dispatch(actualizarCuentaClabe(editingCuenta.id, cuentaForm));
      } else {
        result = await dispatch(crearCuentaClabe(cuentaForm));
      }

      if (result.success) {
        await loadCuentasClabe();
        handleCloseCuentaDialog();
        setMensaje(result.mensaje || "Cuenta CLABE guardada correctamente");
        setTimeout(() => setMensaje(""), 5000);
      } else {
        setError(result.mensaje || "Error al guardar la cuenta CLABE");
      }
    } catch (error) {
      setError("Error al procesar la solicitud");
    } finally {
      setIsCuentasLoading(false);
    }
  };

  const handleDeleteCuenta = async () => {
    if (!cuentaToDelete) return;

    setIsCuentasLoading(true);
    try {
      const result = await dispatch(eliminarCuentaClabe(cuentaToDelete.id));
      if (result.success) {
        await loadCuentasClabe();
        setCuentaToDelete(null);
        setMensaje(result.mensaje || "Cuenta CLABE eliminada correctamente");
        setTimeout(() => setMensaje(""), 5000);
      } else {
        setError(result.mensaje || "Error al eliminar la cuenta CLABE");
      }
    } catch (error) {
      setError("Error al procesar la solicitud");
    } finally {
      setIsCuentasLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Sección de información del usuario y cambio de contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                value={currentUser?.nombre || ""}
                className="pl-10"
                disabled
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="correo">Correo</label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="correo"
                name="correo"
                type="email"
                value={currentUser?.correo || ""}
                className="pl-10"
                disabled
              />
            </div>
          </div>
          <Button
            type="button"
            variant={showPasswordFields ? "secondary" : "default"}
            className="w-full"
            onClick={() => setShowPasswordFields((v) => !v)}
          >
            {showPasswordFields ? "Cancelar" : "Cambiar contraseña"}
          </Button>
          {showPasswordFields && (
            <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {mensaje && (
                <Alert variant="success">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mensaje}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <label htmlFor="currentPwd" className="text-sm font-medium">Contraseña actual</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="currentPwd"
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="newPwd" className="text-sm font-medium">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="newPwd"
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPwd" className="text-sm font-medium">Confirmar nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPwd"
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Cambiando contraseña..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Sección de cuentas CLABE */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cuentas CLABE</CardTitle>
            <Button
              onClick={() => handleOpenCuentaDialog()}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar cuenta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isCuentasLoading && cuentasClabe.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando cuentas CLABE...</p>
            </div>
          ) : cuentasClabe.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay cuentas CLABE registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>CLABE</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentasClabe.map((cuenta) => (
                    <TableRow key={cuenta.id}>
                      <TableCell className="font-medium">{cuenta.nombre}</TableCell>
                      <TableCell>{cuenta.banco}</TableCell>
                      <TableCell className="font-mono">{formatClabe(cuenta.clabe)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCuentaDialog(cuenta)}
                            disabled={isCuentasLoading}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCuentaToDelete(cuenta)}
                            disabled={isCuentasLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar cuenta CLABE */}
      <Dialog open={isCuentaDialogOpen} onOpenChange={setIsCuentaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCuenta ? "Editar cuenta CLABE" : "Nueva cuenta CLABE"}
            </DialogTitle>
            <DialogDescription>
              {editingCuenta
                ? "Modifica los datos de la cuenta CLABE"
                : "Ingresa los datos de la nueva cuenta CLABE"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCuenta}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la cuenta *</Label>
                <Input
                  id="nombre"
                  value={cuentaForm.nombre}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, nombre: e.target.value })
                  }
                  placeholder="Ej: Cuenta Principal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco">Banco *</Label>
                <Input
                  id="banco"
                  value={cuentaForm.banco}
                  onChange={(e) =>
                    setCuentaForm({ ...cuentaForm, banco: e.target.value })
                  }
                  placeholder="Ej: BBVA, Banamex, Santander"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clabe">CLABE *</Label>
                <Input
                  id="clabe"
                  value={cuentaForm.clabe}
                  onChange={(e) =>
                    setCuentaForm({
                      ...cuentaForm,
                      clabe: e.target.value.replace(/\D/g, "").slice(0, 18),
                    })
                  }
                  placeholder="18 dígitos"
                  maxLength={18}
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  La CLABE debe tener exactamente 18 dígitos
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCuentaDialog}
                disabled={isCuentasLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCuentasLoading}>
                {isCuentasLoading
                  ? "Guardando..."
                  : editingCuenta
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!cuentaToDelete}
        onOpenChange={(open) => !open && setCuentaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta CLABE?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cuenta CLABE "{cuentaToDelete?.nombre}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCuentaToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCuenta}
              className="bg-red-600 hover:bg-red-700"
              disabled={isCuentasLoading}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile; 