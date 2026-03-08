import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: string[];
  placeholder?: string;
}

export function CategoryCombobox({
  value,
  onValueChange,
  categories,
  placeholder = "Seleccionar categoría...",
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const filteredCategories = React.useMemo(() => {
    if (!searchValue.trim()) {
      return categories;
    }
    return categories.filter((cat) =>
      cat.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [categories, searchValue]);

  const handleSelect = (category: string) => {
    onValueChange(category);
    setSearchValue("");
    setOpen(false);
  };

  const handleCreateNew = () => {
    if (searchValue.trim()) {
      const newCategory = searchValue.trim().toLowerCase();
      onValueChange(newCategory);
      setSearchValue("");
      setOpen(false);
    }
  };

  const displayValue = value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : placeholder;

  // Cerrar cuando se hace click fuera
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        // Si el click es en el Dialog, no cerrar
        const dialog = (target as HTMLElement).closest('[role="dialog"]');
        if (dialog && dialog.contains(containerRef.current)) {
          return;
        }
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        ref={triggerRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        type="button"
        onClick={() => setOpen(!open)}
      >
        {displayValue}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div
          className="absolute z-[99999] mt-1 w-full rounded-md border bg-popover shadow-md"
          style={{ top: "100%" }}
        >
          <div className="flex flex-col">
            <div className="border-b p-2">
              <Input
                placeholder="Buscar o crear categoría..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredCategories.length === 0 && !searchValue.trim() ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay categorías disponibles
                </div>
              ) : filteredCategories.length === 0 && searchValue.trim() ? (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    No se encontró la categoría "{searchValue}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateNew();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateNew();
                    }}
                    className="w-full"
                    type="button"
                  >
                    Crear "{searchValue.trim()}"
                  </Button>
                </div>
              ) : (
                <div className="p-1">
                  {filteredCategories.map((category) => (
                    <div
                      key={category}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(category);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(category);
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        value.toLowerCase() === category.toLowerCase() && "bg-accent"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.toLowerCase() === category.toLowerCase()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                  ))}
                  {searchValue.trim() &&
                    !categories.includes(searchValue.trim().toLowerCase()) && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateNew();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateNew();
                        }}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground border-t mt-1 pt-1"
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        Crear "{searchValue.trim()}"
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
