"""In-memory paint catalog cache with pre-computed LAB vectors.

Loaded once at server startup; subsequent requests never touch the database
for matching.
"""
from __future__ import annotations

import heapq

from sqlalchemy.orm import Session

from app.services.utils import (
    hex_to_rgb,
    rgb_to_lab,
)
from app.services.matcher import (
    accuracy_percentage,
    compute_delta_e,
    lab_tuple_to_colormath,
    match_quality,
    ranking_key,
    rgb_similarity_features,
    rgb_to_lab_colormath,
)
from app.services.color_semantics import semantic_colors
from app.services.product_meta import build_product_id


class PaintCatalogCache:
    def __init__(self) -> None:
        self._paints: list[dict] = []
        self._lab_colors: list = []
        self._sv_features: list[tuple[float, float]] = []

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def load(self, db: Session) -> None:
        """Convert all paint records into pre-computed LAB color objects."""
        from app.db.models import PaintColor

        records = db.query(PaintColor).all()
        paints, lab_colors, sv_features = [], [], []

        for paint in records:
            rgb = hex_to_rgb(paint.hex_code)
            lab = rgb_to_lab(rgb)
            paints.append(
                {
                    "id": paint.id,
                    "product_id": build_product_id(paint.id),
                    "name": paint.name,
                    "hex_code": paint.hex_code,
                    "brand": paint.brand,
                    "price": float(paint.price),
                }
            )
            lab_colors.append(lab_tuple_to_colormath(lab))
            sv_features.append(rgb_similarity_features(rgb))

        self._paints = paints
        self._lab_colors = lab_colors
        self._sv_features = sv_features

    @property
    def is_loaded(self) -> bool:
        return len(self._paints) > 0

    # ------------------------------------------------------------------
    # Matching
    # ------------------------------------------------------------------

    def match(
        self,
        source_rgb: tuple[int, int, int],
        algorithm: str = "ciede2000",
        top_k: int = 3,
    ) -> list[dict]:
        if not self._paints:
            return []

        if algorithm != "ciede2000":
            raise ValueError("algorithm must be 'ciede2000'")

        source_lab = rgb_to_lab_colormath(source_rgb)
        source_saturation, source_brightness = rgb_similarity_features(source_rgb)
        scored: list[tuple[tuple[float, float], int, float]] = []

        for index, paint_lab in enumerate(self._lab_colors):
            delta_e = compute_delta_e(source_lab, paint_lab)
            paint_saturation, paint_brightness = self._sv_features[index]
            brightness_diff = abs(source_brightness - paint_brightness)
            saturation_diff = abs(source_saturation - paint_saturation)
            scored.append((ranking_key(delta_e, brightness_diff, saturation_diff), index, delta_e))

        best = heapq.nsmallest(top_k, scored, key=lambda item: item[0])

        return [
            {
                **self._paints[index],
                "delta_e": round(float(delta_e), 4),
                "match_quality": match_quality(delta_e),
                "accuracy": accuracy_percentage(delta_e),
                "semantic_color": semantic_colors.lookup(self._paints[index]["hex_code"]),
            }
            for _, index, delta_e in best
        ]


# Module-level singleton — imported by main.py (startup) and routes.
catalog = PaintCatalogCache()
