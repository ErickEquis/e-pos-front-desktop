import React, { useState } from 'react';
import { useUpdater } from '@/hooks/useUpdater';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

export function UpdateBanner() {
    const { status, version, installNow } = useUpdater();
    const [isVisible, setIsVisible] = useState(true);

    if (status !== 'ready' || !isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between shadow-2xl border-b border-white/10 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-full">
                    <Sparkles className="h-4 w-4 animate-pulse text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">
                        ¡Actualización lista para instalar!
                    </span>
                    <span className="text-[11px] opacity-90 leading-tight">
                        Versión {version} descargada con éxito.
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold"
                    onClick={installNow}
                >
                    Reiniciar Ahora
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary-foreground/10"
                    onClick={() => setIsVisible(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
