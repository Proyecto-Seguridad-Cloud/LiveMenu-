import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Phone, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { menuService } from "../../services/menu";
import { analyticsService } from "../../services/analytics";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import type { PublicMenuResponse } from "../../types/menu";
import { cn, formatCurrency } from "@/lib/utils";

export function PublicMenuPage() {
  const { slug } = useParams();

  const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const { trackEvent } = useInteractionTracker(slug);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const dishRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const maxScrollDepthRef = useRef(0);

  useEffect(() => {
    async function loadMenu() {
      if (!slug) {
        setLoading(false);
        setErrorMessage("Slug de restaurante inválido");
        return;
      }
      try {
        const response = await menuService.getBySlug(slug);
        setMenu(response);
        if (response.categories.length > 0) {
          setActiveCategoryId(response.categories[0].id);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No fue posible cargar el menú"
        );
      } finally {
        setLoading(false);
      }
    }
    void loadMenu();
  }, [slug]);

  // Track scan event for analytics
  useEffect(() => {
    if (slug) {
      analyticsService.recordScan(slug);
    }
  }, [slug]);

  // IntersectionObserver for scroll tracking (categories)
  useEffect(() => {
    if (!menu || menu.categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id);
            const cat = menu.categories.find((c) => c.id === entry.target.id);
            if (cat) {
              trackEvent("category_view", {
                category_id: cat.id,
                category_name: cat.name,
              });
            }
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const category of menu.categories) {
      const el = sectionRefs.current[category.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [menu, trackEvent]);

  // IntersectionObserver for dish views
  useEffect(() => {
    if (!menu || menu.categories.length === 0) return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.has(entry.target.id)) {
            seen.add(entry.target.id);
            const dishId = entry.target.id;
            for (const cat of menu.categories) {
              const dish = cat.dishes.find((d) => d.id === dishId);
              if (dish) {
                trackEvent("dish_view", {
                  dish_id: dish.id,
                  dish_name: dish.name,
                });
                break;
              }
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    for (const cat of menu.categories) {
      for (const dish of cat.dishes) {
        const el = dishRefs.current[dish.id];
        if (el) observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [menu, trackEvent]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const depth = Math.min(scrollTop / docHeight, 1);
      const rounded = Math.round(depth * 4) / 4; // 0, 0.25, 0.50, 0.75, 1.0
      if (rounded > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = rounded;
        trackEvent("scroll_depth", { depth: rounded });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackEvent]);

  const scrollToCategory = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      isScrollingRef.current = true;

      const el = sectionRefs.current[categoryId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    },
    []
  );

  // Auto-scroll nav to keep active tab visible
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategoryId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Cargando menú...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </main>
    );
  }

  if (!menu) return null;

  const { restaurant, categories } = menu;

  return (
    <main className="mx-auto max-w-lg min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-6">
        <div className="flex items-center gap-4">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="size-14 rounded-full border object-cover"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-sm text-muted-foreground">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        {(restaurant.phone || restaurant.address || restaurant.hours) && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {restaurant.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3" />
                {restaurant.phone}
              </span>
            )}
            {restaurant.address && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {restaurant.address}
              </span>
            )}
            {restaurant.hours && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Horarios disponibles
              </span>
            )}
          </div>
        )}
      </header>

      {/* Category Nav */}
      {categories.length > 0 && (
        <nav
          ref={navRef}
          className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b bg-background px-4 py-3 scrollbar-none"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              data-active={activeCategoryId === category.id}
              onClick={() => scrollToCategory(category.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategoryId === category.id
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-transparent bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {category.name}
            </button>
          ))}
        </nav>
      )}

      {/* Menu Content */}
      <div className="px-4 pb-10">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            className="pt-6"
          >
            <h2 className="mb-1 text-lg font-bold">{category.name}</h2>
            {category.description && (
              <p className="mb-3 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}

            <div className="space-y-3">
              {category.dishes.map((dish) => (
                <div
                  key={dish.id}
                  id={dish.id}
                  ref={(el) => {
                    dishRefs.current[dish.id] = el;
                  }}
                  className="flex gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">
                        {dish.name}
                      </h3>
                      <div className="shrink-0 text-right">
                        {dish.price_offer ? (
                          <>
                            <span className="text-sm font-bold text-orange-600">
                              {formatCurrency(Number(dish.price_offer))}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground line-through">
                              {formatCurrency(Number(dish.price))}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-orange-600">
                            {formatCurrency(Number(dish.price))}
                          </span>
                        )}
                      </div>
                    </div>
                    {dish.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {dish.description}
                      </p>
                    )}
                    {dish.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dish.tags.map((tag) => (
                          <Badge
                            key={`${dish.id}-${tag}`}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {dish.image_url && (
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="size-20 shrink-0 rounded-lg border object-cover"
                    />
                  )}
                </div>
              ))}
              {category.dishes.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin platos disponibles en esta categoría.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
