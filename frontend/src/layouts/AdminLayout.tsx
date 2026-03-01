import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  List,
  UtensilsCrossed,
  Image,
  QrCode,
  LogOut,
  X,
  Menu,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "../context/AuthContext";
import { restaurantService } from "../services/restaurant";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Inicio", href: "/admin", icon: LayoutDashboard },
  { label: "Mi Restaurante", href: "/admin/restaurant", icon: Store },
  { label: "Categorías", href: "/admin/categories", icon: List },
  { label: "Platos", href: "/admin/dishes", icon: UtensilsCrossed },
  { label: "Imágenes", href: "/admin/uploads", icon: Image },
  { label: "Código QR", href: "/admin/qr", icon: QrCode },
];

function SidebarContent({
  onClose,
  restaurantSlug,
  restaurantLogoUrl,
  onLogoError,
}: {
  onClose?: () => void;
  restaurantSlug: string;
  restaurantLogoUrl: string;
  onLogoError?: () => void;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between border-b px-4 py-5">
        <div className="flex items-center gap-2">
          {restaurantLogoUrl ? (
            <img
              src={restaurantLogoUrl}
              alt="Logo restaurante"
              className="size-8 rounded-xl border object-cover"
              onError={onLogoError}
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm">
              L
            </span>
          )}
          <h1 className="text-xl font-bold tracking-tight">LiveMenu</h1>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="size-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {restaurantSlug && (
        <div className="border-t px-3 py-3">
          <a
            href={`/m/${restaurantSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="size-4" />
            Ver menú público
          </a>
        </div>
      )}

      <div className="border-t px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token } = useAuth();
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState("");

  useEffect(() => {
    async function loadRestaurantSlug() {
      if (!token) {
        setRestaurantSlug("");
        setRestaurantLogoUrl("");
        return;
      }
      try {
        const restaurant = await restaurantService.getCurrent(token);
        setRestaurantSlug(restaurant.slug);
        setRestaurantLogoUrl(restaurant.logo_url || "");
      } catch {
        setRestaurantSlug("");
        setRestaurantLogoUrl("");
      }
    }
    void loadRestaurantSlug();
  }, [token]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <SidebarContent
          restaurantSlug={restaurantSlug}
          restaurantLogoUrl={restaurantLogoUrl}
          onLogoError={() => setRestaurantLogoUrl("")}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet
        open={sidebarOpen}
        onOpenChange={(v) => !v && setSidebarOpen(false)}
      >
        <SheetContent side="left" className="w-[85vw] max-w-64 p-0" showCloseButton={false}>
          <SidebarContent
            onClose={() => setSidebarOpen(false)}
            restaurantSlug={restaurantSlug}
            restaurantLogoUrl={restaurantLogoUrl}
            onLogoError={() => setRestaurantLogoUrl("")}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-3 sm:h-16 sm:px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="size-10 md:hidden"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:block" />
          <p className="max-w-[70vw] truncate text-right text-sm font-medium text-muted-foreground">Panel administrativo</p>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
