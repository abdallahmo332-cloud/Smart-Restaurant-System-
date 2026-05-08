from functools import lru_cache
from collections import Counter
from django.db.models import Count
from sentence_transformers import SentenceTransformer
import numpy as np

from ..models import Order, Reservation, MenuItem

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


@lru_cache(maxsize=1)
def get_embedding_model():
    return SentenceTransformer(MODEL_NAME)


def cosine_similarity(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


class RecommendationService:
    def __init__(self):
        self.model = get_embedding_model()

    def build_user_profile_text(self, user):
        orders = (
            Order.objects.filter(user=user)
            .select_related("restaurant")
            .prefetch_related("items__menu_item")
            .order_by("-created_at")[:20]
        )
        reservations = (
            Reservation.objects.filter(user=user)
            .select_related("restaurant")
            .order_by("-created_at")[:20]
        )

        parts = []
        for order in orders:
            parts.extend([order.restaurant.name, order.restaurant.type or ""])
            for item in order.items.all():
                parts.extend([item.menu_item.name, item.menu_item.type])

        for reservation in reservations:
            parts.extend([reservation.restaurant.name, reservation.restaurant.type or ""])

        return " ".join([p for p in parts if p]).strip()

    def build_candidate_text(self, item):
        return f"{item.name} {item.type} {item.restaurant.name} {item.restaurant.type or ''}".strip()

    def recommend_for_user(self, user, limit=10, restaurant_id=None):
        candidates = MenuItem.objects.select_related("restaurant").all()
        if restaurant_id:
            candidates = candidates.filter(restaurant_id=restaurant_id)

        profile_text = self.build_user_profile_text(user)

        # fallback للمستخدم الجديد
        if not profile_text:
            return self._fallback_recommendations(candidates, limit)

        user_vec = self.model.encode(profile_text, normalize_embeddings=True)

        # تفضيلات بسيطة من التاريخ
        top_types = self._top_user_types(user)
        top_restaurants = self._top_user_restaurants(user)

        scored = []
        for item in candidates:
            cand_text = self.build_candidate_text(item)
            item_vec = self.model.encode(cand_text, normalize_embeddings=True)
            base = cosine_similarity(user_vec, item_vec)

            boost = 0.0
            if item.type in top_types:
                boost += 0.12
            if item.restaurant.type and item.restaurant.type in top_types:
                boost += 0.08
            if item.restaurant.id in top_restaurants:
                boost += 0.10

            scored.append((base + boost, item))

        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:limit]

    def _top_user_types(self, user):
        type_counter = Counter()

        orders = Order.objects.filter(user=user).prefetch_related("items__menu_item")
        for order in orders:
            for oi in order.items.all():
                if oi.menu_item.type:
                    type_counter[oi.menu_item.type] += oi.quantity

        reservations = Reservation.objects.filter(user=user).select_related("restaurant")
        for res in reservations:
            if res.restaurant.type:
                type_counter[res.restaurant.type] += 1

        return {t for t, _ in type_counter.most_common(5)}

    def _top_user_restaurants(self, user):
        qs = (
            Order.objects.filter(user=user)
            .values("restaurant_id")
            .annotate(c=Count("id"))
            .order_by("-c")
        )
        return {row["restaurant_id"] for row in qs[:5]}

    def _fallback_recommendations(self, candidates, limit):
        popularity = (
            candidates.annotate(order_count=Count("restaurant__orders"))
            .order_by("-order_count", "name")[:limit]
        )
        return [(0.0, item) for item in popularity]