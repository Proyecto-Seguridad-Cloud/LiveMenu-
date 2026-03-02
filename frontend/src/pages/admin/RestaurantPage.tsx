import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
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
import { useAuth } from "../../context/AuthContext";
import { restaurantService } from "../../services/restaurant";
import { ApiError } from "../../services/http";
import type { RestaurantPayload } from "../../types/restaurant";

export function RestaurantPage() {
  const { token } = useAuth();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hoursRaw, setHoursRaw] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasRestaurant = useMemo(() => Boolean(restaurantId), [restaurantId]);

  useEffect(() => {
    async function loadRestaurant() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const restaurant = await restaurantService.getCurrent(token);
        setRestaurantId(restaurant.id);
        setSlug(restaurant.slug);
        setName(restaurant.name);
        setDescription(restaurant.description || "");
        setLogoUrl(restaurant.logo_url || "");
        setPhone(restaurant.phone || "");
        setAddress(restaurant.address || "");
        setHoursRaw(
          restaurant.hours ? JSON.stringify(restaurant.hours, null, 2) : ""
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setRestaurantId(null);
          setSlug("");
        } else {
          toast.error(
            error instanceof Error
              ? error.message
              : "No fue posible cargar restaurante"
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void loadRestaurant();
  }, [token]);

  function buildPayload(): RestaurantPayload | null {
    if (!name.trim()) {
      toast.error("El nombre del restaurante es obligatorio");
      return null;
    }
    let parsedHours: Record<string, unknown> | null = null;
    if (hoursRaw.trim()) {
      try {
        const parsed = JSON.parse(hoursRaw);
        parsedHours =
          typeof parsed === "object" && parsed !== null ? parsed : null;
      } catch {
        toast.error("Horarios debe ser un JSON válido");
        return null;
      }
    }
    return {
      name: name.trim(),
      description: description.trim() || null,
      logo_url: logoUrl.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      hours: parsedHours,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);
      const response = hasRestaurant
        ? await restaurantService.update(token, payload)
        : await restaurantService.create(token, payload);

      setRestaurantId(response.id);
      setSlug(response.slug);
      toast.success(
        hasRestaurant
          ? "Restaurante actualizado correctamente"
          : "Restaurante creado correctamente"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar restaurante"
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Mi Restaurante</h1>
        <p className="text-sm text-muted-foreground">
          Datos principales, logo, contacto y horarios.
        </p>
      </div>

      {!hasRestaurant && (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">
              Aún no tienes restaurante configurado. Completa el formulario para
              crearlo.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold">
            {hasRestaurant ? "Editar información" : "Crear restaurante"}
          </CardTitle>
          {hasRestaurant && slug && (
            <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              Slug: <code className="text-xs">{slug}</code>
              <a
                href={`/m/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                Ver menú
              </a>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="La Parrilla del Chef"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Especialistas en cortes y brasas."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle 123 #45-67"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Horarios (JSON opcional)</Label>
              <Textarea
                id="hours"
                rows={4}
                placeholder='{"lunes":"8:00-18:00"}'
                value={hoursRaw}
                onChange={(e) => setHoursRaw(e.target.value)}
              />
            </div>

            <div className="grid gap-2 pt-2 sm:flex">
              <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {hasRestaurant ? "Guardar cambios" : "Crear restaurante"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
