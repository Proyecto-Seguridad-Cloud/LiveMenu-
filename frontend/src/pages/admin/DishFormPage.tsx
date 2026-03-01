import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { categoriesService } from "../../services/categories";
import { dishesService } from "../../services/dishes";
import { ApiError } from "../../services/http";
import type { Category } from "../../types/category";

type DishFormPageProps = {
  mode: "new" | "edit";
};

const ALLOWED_TAGS = [
  "vegetariano",
  "vegano",
  "sin gluten",
  "sin lactosa",
  "picante",
  "nuevo",
  "recomendado",
  "popular",
];

function toNumber(value: string): number | null {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function DishFormPage({ mode }: DishFormPageProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceOffer, setPriceOffer] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantMissing, setRestaurantMissing] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const cats = await categoriesService.list(token);
        setCategories(cats);

        if (mode === "new") {
          if (cats.length > 0) setCategoryId(cats[0].id);
          return;
        }

        if (!id) {
          toast.error("No se encontró el identificador del plato");
          return;
        }

        const dish = await dishesService.get(token, id);
        setCategoryId(dish.category_id);
        setName(dish.name);
        setDescription(dish.description ?? "");
        setPrice(String(dish.price));
        setPriceOffer(dish.price_offer === null ? "" : String(dish.price_offer));
        setImageUrl(dish.image_url ?? "");
        setSelectedTags(dish.tags);
        setFeatured(dish.featured);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantMissing(true);
        } else {
          toast.error(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el formulario"
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [id, mode, token]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    if (!categoryId) {
      toast.error("Debes seleccionar una categoría");
      return;
    }
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const priceValue = toNumber(price);
    if (priceValue === null || priceValue <= 0) {
      toast.error("El precio base debe ser mayor a 0");
      return;
    }
    const offerValue = priceOffer.trim() ? toNumber(priceOffer) : null;
    if (offerValue !== null && offerValue <= 0) {
      toast.error("El precio oferta debe ser mayor a 0");
      return;
    }
    if (offerValue !== null && offerValue >= priceValue) {
      toast.error("El precio de oferta debe ser menor que el precio base");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        price_offer: offerValue,
        image_url: imageUrl.trim() || null,
        featured,
        tags: selectedTags,
      };

      if (mode === "new") {
        await dishesService.create(token, payload);
        toast.success("Plato creado correctamente");
      } else {
        if (!id) return;
        await dishesService.update(token, id, payload);
        toast.success("Plato actualizado correctamente");
      }
      navigate("/admin/dishes", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar plato"
      );
    } finally {
      setSaving(false);
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
          <CardTitle>
            {mode === "new" ? "Nuevo Plato" : "Editar Plato"}
          </CardTitle>
          <CardDescription>
            Debes crear tu restaurante y categorías primero.
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

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "new" ? "Nuevo Plato" : "Editar Plato"}
          </CardTitle>
          <CardDescription>
            Necesitas al menos una categoría para crear platos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/admin/categories">Crear categoría</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/dishes">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "new" ? "Nuevo Plato" : "Editar Plato"}
          </h1>
          <p className="text-muted-foreground">
            Completa la información del plato.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Pizza Margherita"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Precio base</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer">Precio oferta</Label>
                <Input
                  id="offer"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                  value={priceOffer}
                  onChange={(e) => setPriceOffer(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Descripción corta del plato"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen</Label>
              <Input
                id="imageUrl"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Puedes subir imágenes en{" "}
                <Link
                  to="/admin/uploads"
                  className="text-orange-600 hover:underline"
                >
                  Gestión de Imágenes
                </Link>{" "}
                y pegar la URL.
              </p>
            </div>

            {/* Tag Selector */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={
                      selectedTags.includes(tag) ? "default" : "outline"
                    }
                    className="cursor-pointer select-none"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={featured}
                onCheckedChange={setFeatured}
                id="featured"
              />
              <Label htmlFor="featured">Marcar como destacado</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {mode === "new" ? "Crear plato" : "Guardar cambios"}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/dishes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
