import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  obtenerUsuarios, 
  obtenerRoles, 
  invitarUsuario, 
  actualizarUsuario, 
  eliminarUsuario, 
  buscarUsuarios 
} from "@/store/slices/users/thunks";
import { User, Role } from "@/store/slices/users/usersSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  Mail,
  Loader2,
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
import { Switch } from "@/components/ui/switch";

export default function Users() {
  const dispatch = useDispatch<any>();
  const { users, roles, isLoading } = useSelector((state: any) => state.users);
  const { currentUser } = useSelector((state: any) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state para invitación
  const [inviteFormData, setInviteFormData] = useState({
    nombre: "",
    correo: "",
    id_rol: 11, // Empleado por defecto
  });

  // Form state para edición
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    correo: "",
    id_rol: 11,
    estatus: true,
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    dispatch(obtenerUsuarios());
    dispatch(obtenerRoles());
  }, [dispatch]);

  // Filtrar usuarios
  const filteredUsers = users.filter((user: User) => {
    // Excluir usuarios con rol root (id_rol = 1)
    if (user.id_rol === 1) return false;
    
    const matchesSearch =
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.id_rol.toString() === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.estatus) ||
      (statusFilter === "inactive" && !user.estatus);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetInviteForm = () => {
    setInviteFormData({
      nombre: "",
      correo: "",
      id_rol: 11,
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      nombre: "",
      correo: "",
      id_rol: 11,
      estatus: true,
    });
    setEditingUser(null);
  };

  const openInviteDialog = () => {
    resetInviteForm();
    setIsInviteDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditFormData({
      nombre: user.nombre,
      correo: user.correo,
      id_rol: user.id_rol,
      estatus: user.estatus,
    });
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleInviteSubmit = async () => {
    if (!inviteFormData.nombre || !inviteFormData.correo || !inviteFormData.id_rol) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await dispatch(invitarUsuario(inviteFormData));
      
      if (result.success) {
        setIsInviteDialogOpen(false);
        resetInviteForm();
      }
    } catch (error) {
      console.error('Error al invitar usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingUser || !editFormData.nombre) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await dispatch(actualizarUsuario(editingUser.id, editFormData));
      
      if (result.success) {
        setIsEditDialogOpen(false);
        resetEditForm();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await dispatch(eliminarUsuario(userId));
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      dispatch(buscarUsuarios(searchTerm));
    } else {
      dispatch(obtenerUsuarios());
    }
  };

  const getRoleName = (roleId: number) => {
    const role = roles.find((r: Role) => r.id === roleId);
    return role ? role.descripcion : 'Sin rol';
  };

  const isAdmin = (roleId: number) => {
    const role = roles.find((r: Role) => r.id === roleId);
    return role ? role.is_admin : false;
  };

  const canDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) return false;
    if (isAdmin(user.id_rol)) {
      const admins = users.filter((u: User) => isAdmin(u.id_rol) && u.id !== user.id);
      return admins.length > 0;
    }
    return true;
  };

  const canEditUser = (user: User) => true;
  const canInviteUsers = () => true;

  const activeUsers = users.filter((u: User) => u.estatus && u.id_rol !== 1).length;
  const adminUsers = users.filter((u: User) => Number(u.id_rol) === 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona empleados y permisos</p>
        </div>

        {canInviteUsers() && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openInviteDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Invitar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invitar Usuario</DialogTitle>
                <DialogDescription>
                  Envía una invitación por email para que se una al equipo
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={inviteFormData.nombre}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, nombre: e.target.value })
                    }
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo Electrónico *</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={inviteFormData.correo}
                    onChange={(e) =>
                      setInviteFormData({ ...inviteFormData, correo: e.target.value })
                    }
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div>
                  <Label htmlFor="rol">Rol</Label>
                  <Select
                    value={inviteFormData.id_rol.toString()}
                    onValueChange={(value) =>
                      setInviteFormData({ ...inviteFormData, id_rol: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter((role: Role) => role.id !== 1).map((role: Role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleInviteSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Invitación
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.id_rol !== 1).length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Pueden acceder al sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administradores
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Con permisos completos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.filter((role: Role) => role.id !== 1).map((role: Role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Cargando usuarios...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium">Rol</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-right py-3 px-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: User) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{user.nombre}</p>
                            <p className="text-sm text-gray-500">{user.correo}</p>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="mt-1">
                                Tú
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            isAdmin(user.id_rol) ? "default" : "secondary"
                          }
                        >
                          {isAdmin(user.id_rol) ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              {getRoleName(user.id_rol)}
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3 mr-1" />
                              {getRoleName(user.id_rol)}
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={user.estatus ? "default" : "secondary"}
                          >
                            {user.estatus ? (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end space-x-2">
                          {canEditUser(user) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {canEditUser(user) && canDeleteUser(user) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Eliminar usuario?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El usuario
                                    "{user.nombre}" será eliminado
                                    permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No se encontraron usuarios</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={editFormData.nombre}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, nombre: e.target.value })
                }
                placeholder="Ej: Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="correo">Correo Electrónico *</Label>
              <Input
                id="correo"
                type="email"
                value={editFormData.correo}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, correo: e.target.value })
                }
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={editFormData.id_rol.toString()}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, id_rol: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter((role: Role) => role.id !== 1).map((role: Role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="estatus"
                checked={editFormData.estatus}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, estatus: checked })
                }
              />
              <Label htmlFor="estatus">Usuario activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
