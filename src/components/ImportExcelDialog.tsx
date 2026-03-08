import * as React from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExcelRow {
  nombre?: string;
  descripcion?: string;
  precio?: number | string;
  costo_compra?: number | string;
  stock?: number | string;
  categoria?: string;
  codigo?: string;
  tipo_venta?: string;
  unidad_peso?: string;
  peso_minimo?: number | string;
  [key: string]: any;
}

interface ParsedProduct {
  nombre: string;
  descripcion?: string;
  precio: number;
  costo_compra?: number;
  stock: number;
  categoria?: string;
  codigo?: string;
  tipo_venta: "unidad" | "peso";
  weightUnit?: "g" | "kg";
  minWeight?: number;
  rowNumber: number;
  errors: string[];
  isValid: boolean;
}

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: ParsedProduct[]) => Promise<void>;
}

export function ImportExcelDialog({
  open,
  onOpenChange,
  onImport,
}: ImportExcelDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = React.useState<ParsedProduct[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet, {
        range: 1,
        defval: "",
      });

      const products: ParsedProduct[] = jsonData.map((row, index) => {
        const rowNumber = index + 2; // +2 porque la fila 1 es encabezado y el índice empieza en 0
        const errors: string[] = [];
        let isValid = true;

        // Validar nombre
        const nombre = String(row.nombre || row.Nombre || "").trim();
        if (!nombre) {
          errors.push("Nombre es requerido");
          isValid = false;
        }

        // Descripción (opcional)
        const descripcion = String(row.descripcion || row.Descripción || row.descripción || "").trim() || undefined;

        // Validar precio
        const precioStr = String(row.precio || row.Precio || "").trim();
        const precio = parseFloat(precioStr);
        if (!precioStr || isNaN(precio) || precio <= 0) {
          errors.push("Precio debe ser un número mayor a 0");
          isValid = false;
        }

        // Validar stock
        const stockStr = String(row.stock || row.Stock || "").trim();
        const stock = parseFloat(stockStr);
        if (!stockStr || isNaN(stock) || stock <= 0) {
          errors.push("Stock debe ser un número mayor a 0");
          isValid = false;
        }

        // Validar tipo_venta
        const tipoVentaStr = String(row.tipo_venta || row["Tipo Venta"] || row["tipo venta"] || "unidad").trim().toLowerCase();
        const tipoVenta = tipoVentaStr === "peso" ? "peso" : "unidad";

        // Costo de compra (opcional)
        let costoCompra: number | undefined;
        const costoStr = String(row.costo_compra || row["Costo Compra"] || row["costo compra"] || "").trim();
        if (costoStr) {
          const costo = parseFloat(costoStr);
          if (!isNaN(costo) && costo >= 0) {
            costoCompra = costo;
          } else {
            errors.push("Costo de compra debe ser un número mayor o igual a 0");
          }
        }

        // Categoría (opcional)
        const categoria = String(row.categoria || row.Categoría || row.categoría || "").trim().toLowerCase() || undefined;

        // Código (opcional)
        const codigo = String(row.codigo || row.Código || row.código || "").trim() || undefined;

        // Para productos por peso
        let weightUnit: "g" | "kg" | undefined;
        let minWeight: number | undefined;

        if (tipoVenta === "peso") {
          const unidadStr = String(row.unidad_peso || row["Unidad Peso"] || row["unidad peso"] || "kg").trim().toLowerCase();
          weightUnit = unidadStr === "g" ? "g" : "kg";

          // Convertir stock a gramos si la unidad es kg
          let stockFinal = stock;
          if (weightUnit === "kg") {
            stockFinal = stock * 1000;
          }

          // Peso mínimo (opcional)
          const minWeightStr = String(row.peso_minimo || row["Peso Mínimo"] || row["peso minimo"] || "").trim();
          if (minWeightStr) {
            const minWeightNum = parseFloat(minWeightStr);
            if (!isNaN(minWeightNum) && minWeightNum > 0) {
              minWeight = minWeightNum;
            }
          }

          return {
            nombre,
            descripcion,
            precio,
            costo_compra: costoCompra,
            stock: stockFinal,
            categoria,
            codigo,
            tipo_venta: "peso" as const,
            weightUnit,
            minWeight,
            rowNumber,
            errors,
            isValid,
          };
        }

        return {
          nombre,
          descripcion,
          precio,
          costo_compra: costoCompra,
          stock: Math.floor(stock), // Stock debe ser entero para productos por unidad
          categoria,
          codigo,
          tipo_venta: "unidad" as const,
          rowNumber,
          errors,
          isValid,
        };
      });

      setParsedProducts(products);
    } catch (error) {
      console.error("Error al parsear archivo Excel:", error);
      setParsedProducts([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Instrucciones en la primera fila
    const instructions = [
      "Nombre del producto (requerido)",
      "Descripción del producto (opcional)",
      "Precio de venta, número mayor a 0 (requerido)",
      "Costo de compra, número >= 0 (opcional)",
      "Cantidad en stock, número mayor a 0 (requerido). Si es peso y unidad es kg, poner en kilogramos",
      "Categoría del producto (opcional)",
      "Código de barras (opcional)",
      "Escribir 'unidad' o 'peso' (requerido)",
      "Si tipo venta es 'peso', escribir 'g' o 'kg' (opcional)",
      "Si tipo venta es 'peso', peso mínimo en gramos (opcional)"
    ];

    // Nombres de columnas en la segunda fila
    const headers = [
      "Nombre",
      "Descripción",
      "Precio",
      "Costo Compra",
      "Stock",
      "Categoría",
      "Código",
      "Tipo Venta",
      "Unidad Peso",
      "Peso Mínimo (g)"
    ];

    // Crear datos de ejemplo para la plantilla
    const exampleRow1 = {
      "Nombre": "Ejemplo Producto",
      "Descripción": "Descripción del producto ejemplo",
      "Precio": 120.00,
      "Costo Compra": 80.00,
      "Stock": 48,
      "Categoría": "chocolate",
      "Código": "123456",
      "Tipo Venta": "unidad",
      "Unidad Peso": "",
      "Peso Mínimo (g)": ""
    };

    const exampleRow2 = {
      "Nombre": "Ejemplo Producto por Peso",
      "Descripción": "",
      "Precio": 11.20,
      "Costo Compra": 7.00,
      "Stock": 25,
      "Categoría": "",
      "Código": "789012",
      "Tipo Venta": "peso",
      "Unidad Peso": "kg",
      "Peso Mínimo (g)": 25
    };

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Crear worksheet con instrucciones, encabezados y ejemplos
    const wsData = [
      instructions, // Fila 1: Instrucciones
      headers,       // Fila 2: Nombres de columnas
      [             // Fila 3: Ejemplo 1 (por unidad)
        exampleRow1["Nombre"],
        exampleRow1["Descripción"],
        exampleRow1["Precio"],
        exampleRow1["Costo Compra"],
        exampleRow1["Stock"],
        exampleRow1["Categoría"],
        exampleRow1["Código"],
        exampleRow1["Tipo Venta"],
        exampleRow1["Unidad Peso"],
        exampleRow1["Peso Mínimo (g)"]
      ],
      [             // Fila 4: Ejemplo 2 (por peso)
        exampleRow2["Nombre"],
        exampleRow2["Descripción"],
        exampleRow2["Precio"],
        exampleRow2["Costo Compra"],
        exampleRow2["Stock"],
        exampleRow2["Categoría"],
        exampleRow2["Código"],
        exampleRow2["Tipo Venta"],
        exampleRow2["Unidad Peso"],
        exampleRow2["Peso Mínimo (g)"]
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 12 }, // Precio
      { wch: 15 }, // Costo Compra
      { wch: 12 }, // Stock
      { wch: 20 }, // Categoría
      { wch: 20 }, // Código
      { wch: 15 }, // Tipo Venta
      { wch: 15 }, // Unidad Peso
      { wch: 18 }  // Peso Mínimo
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Descargar archivo
    XLSX.writeFile(wb, "plantilla_importacion_productos.xlsx");
  };

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setParsedProducts([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleImport = async () => {
    const validProducts = parsedProducts.filter((p) => p.isValid);
    if (validProducts.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      await onImport(validProducts);
      // Limpiar después de importar exitosamente
      setFile(null);
      setParsedProducts([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error al importar productos:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedProducts.filter((p) => p.isValid).length;
  const errorCount = parsedProducts.filter((p) => !p.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-green-100 p-1 rounded-md">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            Importar Productos desde Excel
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) para cargar productos masivamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pasos de importación */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Descarga la plantilla</p>
                <p className="text-xs text-slate-500 mb-2">Usa nuestro formato estándar para evitar errores.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 text-xs border-slate-200"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Descargar Plantilla
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Sube tu archivo</p>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col gap-2">
                    {!file && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing || isImporting}
                        className="w-full h-20 border-dashed border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-1"
                      >
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-500">Click para seleccionar archivo</span>
                      </Button>
                    )}

                    {file && (
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-sm">
                            <p className="font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Cambiar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {parsedProducts.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Revisión</p>
                  <p className="text-xs text-slate-500">
                    Verifica que los datos sean correctos antes de importar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Procesando */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Procesando archivo...</span>
            </div>
          )}

          {/* Resumen */}
          {parsedProducts.length > 0 && !isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Vista Previa</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {parsedProducts.length} filas encontradas
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${validCount > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validCount} Válidos
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-red-50 text-red-700 border-red-200 text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorCount} Errores
                  </div>
                )}
              </div>

              {/* Preview de productos */}
              <div className="border border-slate-200 rounded-lg max-h-[300px] overflow-y-auto shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs w-10">#</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Nombre</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Precio</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Stock</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Tipo</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedProducts.map((product, index) => (
                      <tr
                        key={index}
                        className={`hover:bg-slate-50 transition-colors ${!product.isValid ? "bg-red-50/50" : ""}`}
                      >
                        <td className="py-2 px-3 text-xs text-slate-400">{product.rowNumber}</td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-900 truncate max-w-[150px]" title={product.nombre}>{product.nombre}</div>
                          {product.codigo && <div className="text-[10px] text-slate-400 font-mono">{product.codigo}</div>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">${product.precio}</td>
                        <td className="py-2 px-3 text-slate-600">{product.stock}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-[10px] h-5 font-normal">
                            {product.tipo_venta === 'peso' ? 'Peso' : 'Unid.'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          {product.isValid ? (
                            <div className="flex items-center text-green-600 text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Ok
                            </div>
                          ) : (
                            <div className="group relative cursor-help">
                              <div className="flex items-center text-red-600 text-xs font-medium">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                Error
                              </div>
                              <div className="invisible group-hover:visible absolute right-0 top-6 w-48 p-2 bg-red-900 text-white text-xs rounded shadow-lg z-20">
                                {product.errors.join(", ")}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setParsedProducts([]);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              onOpenChange(false);
            }}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0 || isImporting || isProcessing}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar ${validCount} producto${validCount !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
