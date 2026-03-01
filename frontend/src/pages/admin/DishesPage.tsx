import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "../../context/AuthContext";
import { categoriesService } from "../../services/categories";
import { dishesService } from "../../services/dishes";
import { ApiError } from "../../services/http";
import type { Category } from "../../types/category";
import type { Dish } from "../../types/dish";
import { formatCurrency } from "@/lib/utils";

export function DishesPage() {
  const { token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [restaurantMissing, setRestaurantMissing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [cats, allDishes] = await Promise.all([
          categoriesService.list(token),
          dishesService.list(token),
        ]);
        setCategories(cats);
        setDishes(allDishes);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true);
        } else {
          toast.error(
            error instanceof Error
              ? error.message
              : "No fue posible cargar platos"
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [token]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedCategoryId !== "all" && dish.category_id !== selectedCategoryId)
        return false;
      if (availabilityFilter === "true" && !dish.available) return false;
      if (availabilityFilter === "false" && dish.available) return false;
      if (searchText.trim()) {
        return dish.name.toLowerCase().includes(searchText.trim().toLowerCase());
      }
      return true;
    });
  }, [dishes, selectedCategoryId, availabilityFilter, searchText]);

  async function toggleAvailability(dish: Dish) {
    if (!token) return;
    try {
      const updated = await dishesService.updateAvailability(
        token,
        dish.id,
        !dish.available
      );
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success(
        updated.available ? "Plato marcado disponible" : "Plato marcado no disponible"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar"
      );
    }
  }

  async function handleConfirmDelete() {
    if (!token || !deleteId) return;
    try {
      await dishesService.remove(token, deleteId);
      setDishes((prev) => prev.filter((d) => d.id !== deleteId));
      toast.success("Plato eliminado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar plato"
      );
    } finally {
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (restaurantMissing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Platos</CardTitle>
          <CardDescription>
            Primero debes crear tu restaurante y categorías.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/restaurant">Ir a Mi Restaurante</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/categories">Ir a Categorías</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Platos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los platos de tu menú.
          </p>
        </div>
        <Button className="w-full sm:w-auto" asChild>
          <Link to="/admin/dishes/new">
            <Plus className="mr-2 size-4" />
            Nuevo plato
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:min-w-[220px] sm:flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar plato..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={availabilityFilter}
              onValueChange={setAvailabilityFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Disponibles</SelectItem>
                <SelectItem value="false">No disponibles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dish Grid */}
      {filteredDishes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No hay platos para los filtros seleccionados.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDishes.map((dish) => (
            <Card key={dish.id} className="overflow-hidden">
              {dish.image_url && (
                <div className="px-4 pt-4">
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                </div>
              )}
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{dish.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryMap.get(dish.category_id) || "Sin categoría"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {dish.price_offer ? (
                      <>
                        <p className="text-sm line-through text-muted-foreground">
                          {formatCurrency(Number(dish.price))}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(Number(dish.price_offer))}
                        </p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(Number(dish.price))}
                      </p>
                    )}
                  </div>
                </div>

                {dish.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dish.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dish.available}
                      onCheckedChange={() => toggleAvailability(dish)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {dish.available ? "Disponible" : "No disponible"}
                    </span>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-secondary hover:text-primary"
                      asChild
                    >
                      <Link to={`/admin/dishes/${dish.id}/edit`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteId(dish.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
