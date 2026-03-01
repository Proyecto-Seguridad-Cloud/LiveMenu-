import time
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories.restaurant_repository import get_restaurant_by_slug
from app.repositories.category_repository import list_categories_by_restaurant
from app.repositories.dish_repository import list_dishes


_menu_cache: dict[str, tuple[float, dict]] = {}


class MenuService:
    @staticmethod
    async def get_public_menu(db: AsyncSession, slug: str) -> dict:
        now = time.time()
        cached = _menu_cache.get(slug)
        if cached and cached[0] > now:
            return cached[1]

        restaurant = await get_restaurant_by_slug(db, slug)
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menú no encontrado")

        categories = await list_categories_by_restaurant(db, restaurant.id)
        active_categories = [category for category in categories if category.active]
        category_ids = [category.id for category in active_categories]

        dishes = await list_dishes(db, category_ids=category_ids, available=True) if category_ids else []

        dishes_by_category: dict[str, list] = {}
        for dish in dishes:
            category_key = str(dish.category_id)
            dishes_by_category.setdefault(category_key, []).append(dish)

        payload = {
            "restaurant": {
                "id": restaurant.id,
                "name": restaurant.name,
                "slug": restaurant.slug,
                "description": restaurant.description,
                "logo_url": restaurant.logo_url,
                "phone": restaurant.phone,
                "address": restaurant.address,
                "hours": restaurant.hours,
            },
            "categories": [
                {
                    "id": category.id,
                    "name": category.name,
                    "description": category.description,
                    "position": category.position,
                    "dishes": [
                        {
                            "id": dish.id,
                            "name": dish.name,
                            "description": dish.description,
                            "price": dish.price,
                            "price_offer": dish.price_offer,
                            "image_url": dish.image_url,
                            "featured": dish.featured,
                            "tags": dish.tags,
                        }
                        for dish in dishes_by_category.get(str(category.id), [])
                    ],
                }
                for category in active_categories
            ],
        }

        ttl_seconds = max(1, settings.MENU_CACHE_TTL_SECONDS)
        _menu_cache[slug] = (now + ttl_seconds, payload)
        return payload

    @staticmethod
    def clear_cache() -> None:
        _menu_cache.clear()
