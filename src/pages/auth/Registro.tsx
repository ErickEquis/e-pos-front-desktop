import React, { useEffect, useState } from "react";
import { useDispatch } from 'react-redux'
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  MailIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { crearUsuario } from "@/store/slices/auth/thunks";
import { cleanAuthState } from "@/store/slices/auth/authSlice";

export const Registro = () => {
  const dispatch = useDispatch<any>();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPwd, setConfirmarPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmarPwd, setShowConfirmarPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidForm, setIsValidForm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(cleanAuthState());
  }, [location, dispatch]);

  useEffect(() => {
    const isFormValid =
      nombre !== "" &&
      email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      password.trim() !== "" &&
      confirmarPwd.trim() !== "" &&
      password === confirmarPwd;
    setIsValidForm(isFormValid);
  }, [nombre, email, password, confirmarPwd]);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const payload = {
      nombre: nombre,
      contrasenia: password,
      correo: email
    };

    try {
      await dispatch(crearUsuario(payload));
      setIsLoading(false);
      navigate("/login");
    } catch (error) {
      setIsLoading(false);
    }
    setNombre("");
    setEmail("");
    setPassword("");
    setConfirmarPwd("");
  };

  return (
    <CardContent className="space-y-6">
      <form onSubmit={handleRegistro} className="space-y-4">

        <div className="space-y-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder=" "
              className="pl-10"
              required
            />
            <label
              htmlFor="nombre"
              className="ml-8 absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Nombre de usuario
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="pl-10"
              required
            />
            <label
              htmlFor="email"
              className="ml-8 absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Correo Electrónico
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="pl-10 pr-10"
              required
            />
            <label
              htmlFor="password"
              className="ml-8 absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="confirmarPwd"
              type={showConfirmarPwd ? "text" : "password"}
              value={confirmarPwd}
              onChange={(e) => setConfirmarPwd(e.target.value)}
              placeholder=" "
              className="pl-10 pr-10"
              required
            />
            <label
              htmlFor="confirmarPwd"
              className="ml-8 absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1"
            >
              Confirmar contraseña
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmarPwd(!showConfirmarPwd)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmarPwd ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !isValidForm} size="lg">
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Registrando usuario...
            </div>
          ) : (
            <div className="flex items-center">
              <LogIn className="w-4 h-4 mr-2" />
              Registrarse
            </div>
          )}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login" className="text-blue-500">
                Iniciar sesión
              </Link>
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};
