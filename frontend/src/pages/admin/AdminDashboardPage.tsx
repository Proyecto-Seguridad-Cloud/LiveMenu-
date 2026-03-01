import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  List,
  UtensilsCrossed,
  QrCode,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import { restaurantService } from "../../services/restaurant";
import { categoriesService } from "../../services/categories";
import { dishesService } from "../../services/dishes";

export function AdminDashboardPage() {
  const { token } = useAuth();

  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryCount, setCategoryCount] = useState(0);
  const [dishCount, setDishCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const restaurant = await restaurantService.getCurrent(token);
        setRestaurantName(restaurant.name);
        setSlug(restaurant.slug);
        setHasRestaurant(true);

        const [cats, dishes] = await Promise.all([
          categoriesService.list(token),
          dishesService.list(token),
        ]);
        setCategoryCount(cats.length);
        setDishCount(dishes.length);
      } catch {
        setHasRestaurant(false);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Estado rápido de configuración del restaurante.
        </p>
      </div>

      {!hasRestaurant ? (
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido a LiveMenu</CardTitle>
            <CardDescription>
              Comienza configurando tu restaurante para empezar a gestionar tu
              menú digital.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/restaurant">
                <Store className="mr-2 size-4" />
                Configurar restaurante
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Restaurante
                </CardTitle>
                <Store className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{restaurantName}</div>
                <p className="text-xs text-muted-foreground">/{slug}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Categorías
                </CardTitle>
                <List className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryCount}</div>
                <p className="text-xs text-muted-foreground">registradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Platos</CardTitle>
                <UtensilsCrossed className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dishCount}</div>
                <p className="text-xs text-muted-foreground">en el menú</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Menú público
                </CardTitle>
                <ExternalLink className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Activo</Badge>
                <a
                  href={`/m/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs text-orange-600 hover:underline"
                >
                  /m/{slug}
                </a>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/admin/restaurant">
                  <Store className="mr-2 size-4" />
                  Restaurante
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/categories">
                  <List className="mr-2 size-4" />
                  Categorías
                </Link>
              </Button>
              <Button asChild>
                <Link to="/admin/dishes/new">
                  <UtensilsCrossed className="mr-2 size-4" />
                  Nuevo plato
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/qr">
                  <QrCode className="mr-2 size-4" />
                  Código QR
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
