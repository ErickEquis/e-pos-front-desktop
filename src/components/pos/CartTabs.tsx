import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Cart {
  items: any[];
  userId: string;
  userName: string;
}

interface CartTabsProps {
  carts: Record<string, Cart>;
  activeCartId: string;
  onCartChange: (cartId: string) => void;
  onAddCart: () => void;
  onRemoveCart: (cartId: string) => void;
}

export function CartTabs({ 
  carts, 
  activeCartId, 
  onCartChange, 
  onAddCart, 
  onRemoveCart 
}: CartTabsProps) {
  return (
    <div className="border-b bg-card">
      <div className="flex flex-wrap gap-1 p-2">
        {Object.entries(carts).map(([cartId, cart]) => (
          <div key={cartId} className="flex items-center">
            <div
              className={`px-3 py-2 md:px-4 md:py-2 rounded-t-lg flex items-center space-x-1 md:space-x-2 transition-colors cursor-pointer text-xs md:text-sm ${
                activeCartId === cartId 
                  ? 'bg-pos-primary text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
              onClick={() => onCartChange(cartId)}
            >
              <span className="font-medium truncate max-w-20 md:max-w-32">{cart.userName}</span>
              {Object.keys(carts).length > 1 && (
                <button
                  className="ml-1 p-0.5 md:p-1 text-red-500 hover:text-red-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCart(cartId);
                  }}
                  title="Eliminar carrito"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        <button
          className="px-3 py-2 md:px-4 md:py-2 rounded-t-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/30 flex items-center space-x-1 transition-colors text-xs md:text-sm"
          onClick={onAddCart}
          title="Agregar nuevo carrito"
        >
          <Plus className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>
    </div>
  );
} 