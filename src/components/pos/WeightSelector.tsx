import { useState } from "react";
import {
  Product,
  formatWeight,
  // parseWeight,
  formatCurrency,
} from "@/store/slices/e-pos/thunks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Scale, Plus } from "lucide-react";

interface WeightSelectorProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, grams: number, displayWeight: string) => void;
  initialGrams?: number; // Para edición
}

export default function WeightSelector({
  product,
  isOpen,
  onClose,
  onAddToCart,
  initialGrams,
}: WeightSelectorProps) {
  const [weightInput, setWeightInput] = useState(initialGrams ? initialGrams.toString() : "");
  const [usePrice, setUsePrice] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const handleWeightChange = (value: string) => {
    setWeightInput(value);
    setUsePrice(false);
    setPriceInput("");
  };

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    setUsePrice(true);  
    setWeightInput("");
  };

  const calculateFromPrice = () => {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) return 0;
    // product.precio es precio por kilo, necesitamos precio por gramo
    const precioPorGramo = product.precio / 1000;
    return Math.round(price / precioPorGramo);
  };

  const calculateFromWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return 0;
    return weight;
  };

  const finalGrams = usePrice ? calculateFromPrice() : calculateFromWeight();
  const finalPrice = finalGrams * (product.precio / 1000);
  const isValid =
    finalGrams >= (product.minWeight || 0) && finalGrams <= product.stock;

  const handleAdd = () => {
    if (!isValid) return;

    onAddToCart(product, finalGrams, formatWeight(finalGrams));
    setWeightInput("");
    setPriceInput("");
    setUsePrice(false);
    onClose();
  };

  const quickWeights = [100, 250, 500, 1000]; // Pesos rápidos en gramos

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Scale className="w-5 h-5 mr-2" />
            {product.nombre || product.descripcion}
          </DialogTitle>
          <DialogDescription>
            Especifica la cantidad que deseas agregar al carrito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Precio por kilo</p>
            <p className="text-lg font-semibold text-pos-primary">
              {formatCurrency(product.precio)}
            </p>
            <p className="text-xs text-muted-foreground">
              Stock disponible: {formatWeight(product.stock)}
            </p>
          </div>

          {/* Quick Weight Buttons */}
          <div>
            <Label className="text-sm font-medium">Cantidades rápidas</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {quickWeights.map((weight) => (
                <Button
                  key={weight}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWeightInput(weight.toString());
                    setUsePrice(false);
                    setPriceInput("");
                  }}
                  disabled={weight > product.stock}
                  className="text-xs"
                >

                  {weight < 1000 ? `${weight}g` : `${(weight / 1000)}kg`}
                </Button>
              ))}
            </div>
          </div>

          {/* Weight Input */}
          <div>
            <Label htmlFor="weight">Cantidad en gramos</Label>
            <Input
              id="weight"
              type="number"
              value={weightInput}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder={`Mín: ${product.minWeight || 0}g`}
              className="mt-1"
            />
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="price">O especifica el valor en pesos</Label>
            <Input
              id="price"
              type="number"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Ej: 20, 50, 100"
              className="mt-1"
            />
          </div>

          {/* Calculation Preview */}
          {finalGrams > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {formatWeight(finalGrams)}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {(finalGrams / 1000).toFixed(3)} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-900 dark:text-blue-100">
                    {formatCurrency(finalPrice)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {formatCurrency(product.precio / 1000)}/g
                  </p>
                </div>
              </div>

              {!isValid && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {finalGrams < (product.minWeight || 0) &&
                    `Cantidad mínima: ${formatWeight(product.minWeight || 0)}`}
                  {finalGrams > product.stock &&
                    `Stock insuficiente. Máximo: ${formatWeight(product.stock)}`}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!isValid || finalGrams <= 0}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
