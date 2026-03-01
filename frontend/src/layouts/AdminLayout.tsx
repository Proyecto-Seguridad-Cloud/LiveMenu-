import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  List,
  UtensilsCrossed,
  Image,
  QrCode,
  BarChart3,
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
  { label: "Analíticas", href: "/admin/analytics", icon: BarChart3 },
];

function SidebarContent({
  onClose,
  restaurantSlug,
}: {
  onClose?: () => void;
  restaurantSlug: string;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500 text-xs font-extrabold text-white">
            L
          </span>
          <h1 className="text-lg font-bold">LiveMenu</h1>
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

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
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
        <div className="border-t px-2 py-2">
          <a
            href={`/m/${restaurantSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="size-4" />
            Ver menú público
          </a>
        </div>
      )}

      <div className="border-t px-2 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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

  useEffect(() => {
    async function loadRestaurantSlug() {
      if (!token) {
        setRestaurantSlug("");
        return;
      }
      try {
        const restaurant = await restaurantService.getCurrent(token);
        setRestaurantSlug(restaurant.slug);
      } catch {
        setRestaurantSlug("");
      }
    }
    void loadRestaurantSlug();
  }, [token]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:block">
        <SidebarContent restaurantSlug={restaurantSlug} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet
        open={sidebarOpen}
        onOpenChange={(v) => !v && setSidebarOpen(false)}
      >
        <SheetContent side="left" className="w-60 p-0">
          <SidebarContent
            onClose={() => setSidebarOpen(false)}
            restaurantSlug={restaurantSlug}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:block" />
          <p className="text-sm text-muted-foreground">Panel administrativo</p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
