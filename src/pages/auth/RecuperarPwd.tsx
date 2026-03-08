import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDispatch } from 'react-redux'
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { recuperarPwd } from '@/store/slices/auth/thunks'
import {
    LogIn,
    MailIcon,
} from "lucide-react";
import { cleanAuthState } from '@/store/slices/auth/authSlice'

export const RecuperarPwd = () => {

    const dispatch = useDispatch<any>();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidForm, setIsValidForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(cleanAuthState());
    }, [location, dispatch]);

    useEffect(() => {
        const isFormValid =
            email.trim() !== ""
            && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        setIsValidForm(isFormValid);
    }, [email]);

    const handleRecuperarPwd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response: any = await dispatch(recuperarPwd({ correo: email }));
            if (response && response.success) {
                navigate("/login");
            }
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
        }
    }

    return (
        <CardContent className="space-y-6">
            <form onSubmit={handleRecuperarPwd} className="space-y-4">
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
                        <label htmlFor="email" className="ml-8 absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto start-1">Correo Electrónico</label>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !isValidForm}
                    size="lg"
                >
                    {isLoading ? (
                        <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Recuperando contraseña...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <LogIn className="w-4 h-4 mr-2" />
                            Recuperar contraseña
                        </div>
                    )}
                </Button>

                <div className="space-y-3">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                ¿Ya tienes una cuenta? <Link to="/login" className="text-blue-500">Iniciar sesión</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </CardContent>
    )
}
