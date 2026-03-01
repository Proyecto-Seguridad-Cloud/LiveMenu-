import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Phone, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { menuService } from "../../services/menu";
import type { PublicMenuResponse } from "../../types/menu";
import { cn, formatCurrency } from "@/lib/utils";

export function PublicMenuPage() {
  const { slug } = useParams();

  const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

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

  // IntersectionObserver for scroll tracking
  useEffect(() => {
    if (!menu || menu.categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id);
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
  }, [menu]);

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
    <main className="mx-auto min-h-screen max-w-lg bg-background md:max-w-2xl lg:max-w-3xl">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4">
        <div className="flex items-start gap-3">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="size-14 shrink-0 rounded-xl border object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-secondary text-base font-bold text-primary">
              {restaurant.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>

        {(restaurant.phone || restaurant.address || restaurant.hours) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {restaurant.phone && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                <Phone className="size-3" />
                {restaurant.phone}
              </span>
            )}
            {restaurant.address && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
                <MapPin className="size-3" />
                {restaurant.address}
              </span>
            )}
            {restaurant.hours && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1">
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
          className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b bg-background/95 px-4 py-2.5 backdrop-blur scrollbar-none"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              data-active={activeCategoryId === category.id}
              onClick={() => scrollToCategory(category.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeCategoryId === category.id
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
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
            className="pt-5"
          >
            <h2 className="mb-1 text-xl font-bold tracking-tight sm:text-2xl">{category.name}</h2>
            {category.description && (
              <p className="mb-3 text-sm leading-snug text-muted-foreground">
                {category.description}
              </p>
            )}

            <div className="space-y-3">
              {category.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex gap-3 rounded-2xl border bg-card p-2.5 sm:p-3"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-tight tracking-tight sm:text-xl">
                      {dish.name}
                    </h3>
                    {dish.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground sm:text-sm">
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

                  <div className="shrink-0 flex w-20 flex-col items-end gap-2 sm:w-24">
                    <div className="text-right leading-none">
                      {dish.price_offer ? (
                        <>
                          <p className="text-lg font-bold text-primary sm:text-xl">
                            {formatCurrency(Number(dish.price_offer))}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-through">
                            {formatCurrency(Number(dish.price))}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-primary sm:text-xl">
                          {formatCurrency(Number(dish.price))}
                        </p>
                      )}
                    </div>

                    {dish.image_url && (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="size-[72px] rounded-xl border object-cover sm:size-20"
                      />
                    )}
                  </div>
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
