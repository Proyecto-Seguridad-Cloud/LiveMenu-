import { useEffect, useState, type ComponentType } from "react";
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

function StatTile({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="px-4 pb-1">
        <p className="text-3xl font-bold leading-none tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

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
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight sm:text-[24px]">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
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
          <Card className="gap-4 py-4">
            <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
              <div className="min-w-0">
                <CardTitle className="truncate text-base font-semibold">
                  {restaurantName}
                </CardTitle>
                <CardDescription className="mt-1 break-all text-xs">
                  /{slug}
                </CardDescription>
              </div>
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Store className="size-5" />
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-1">
              <a
                href={`/m/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" />
                Ver menú público
              </a>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
              title="Categorías"
              value={String(categoryCount)}
              subtitle="registradas"
              icon={List}
            />
            <StatTile
              title="Platos"
              value={String(dishCount)}
              subtitle="en el menú"
              icon={UtensilsCrossed}
            />
            <Card className="gap-3 py-4">
              <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Menú
                </CardTitle>
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ExternalLink className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="px-4 pb-1">
                <Badge variant="secondary" className="mb-1">
                  Activo
                </Badge>
                <p className="truncate text-xs text-muted-foreground">/m/{slug}</p>
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estado
                </CardTitle>
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
                  <QrCode className="size-4" />
                </span>
              </CardHeader>
              <CardContent className="px-4 pb-1">
                <p className="text-lg font-bold leading-none">Listo</p>
                <p className="mt-1 text-xs text-muted-foreground">panel operativo</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[20px] font-semibold">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:flex sm:flex-wrap">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/admin/restaurant">
                  <Store className="mr-2 size-4" />
                  Restaurante
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/admin/categories">
                  <List className="mr-2 size-4" />
                  Categorías
                </Link>
              </Button>
              <Button className="w-full sm:w-auto" asChild>
                <Link to="/admin/dishes/new">
                  <UtensilsCrossed className="mr-2 size-4" />
                  Nuevo plato
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
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
