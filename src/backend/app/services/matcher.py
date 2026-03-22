from __future__ import annotations

import colorsys
import heapq

import numpy as np
from colormath.color_diff import delta_e_cie2000
from colormath.color_objects import LabColor
from sqlalchemy.orm import Session

from app.db.models import PaintColor
from app.services.color_semantics import semantic_colors
from app.services.product_meta import build_product_id
from app.services.utils import (
    hex_to_rgb,
    rgb_to_lab,
)

# colormath<=3.0 uses numpy.asscalar, removed in NumPy 2.x.
if not hasattr(np, "asscalar"):
    np.asscalar = lambda value: value.item()


def lab_tuple_to_colormath(lab: tuple[float, float, float]) -> LabColor:
    return LabColor(lab_l=lab[0], lab_a=lab[1], lab_b=lab[2])


def rgb_to_lab_colormath(rgb: tuple[int, int, int]) -> LabColor:
    return lab_tuple_to_colormath(rgb_to_lab(rgb))


def compute_delta_e(source_lab: LabColor, target_lab: LabColor) -> float:
    return float(delta_e_cie2000(source_lab, target_lab))


def match_quality(delta_e: float) -> str:
    if delta_e < 2:
        return "Excellent"
    if delta_e < 5:
        return "Good"
    if delta_e < 10:
        return "Average"
    return "Poor"


def accuracy_percentage(delta_e: float) -> float:
    return round(max(0.0, 100.0 - delta_e), 2)


def rgb_similarity_features(rgb: tuple[int, int, int]) -> tuple[float, float]:
    """Return saturation and brightness in [0, 1] for ranking similarity."""
    r, g, b = rgb
    _, saturation, brightness = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    return saturation, brightness


def ranking_key(
    delta_e: float,
    brightness_diff: float,
    saturation_diff: float,
) -> tuple[float, float]:
    """Delta E is primary; brightness/saturation differences break ties."""
    secondary = (brightness_diff * 0.6) + (saturation_diff * 0.4)
    return (delta_e, secondary)


def build_match_payload(paint: PaintColor, delta_e: float) -> dict:
    return {
        "id": paint.id,
        "product_id": build_product_id(paint.id),
        "name": paint.name,
        "hex_code": paint.hex_code,
        "brand": paint.brand,
        "price": float(paint.price),
        "delta_e": round(float(delta_e), 4),
        "match_quality": match_quality(delta_e),
        "accuracy": accuracy_percentage(delta_e),
        "semantic_color": semantic_colors.lookup(paint.hex_code),
    }


class PaintMatcher:
    def __init__(self, db: Session):
        self.db = db

    def match(
        self,
        source_rgb: tuple[int, int, int],
        algorithm: str = "ciede2000",
        top_k: int = 3,
    ) -> list[dict]:
        paints = self.db.query(PaintColor).all()
        if not paints:
            return []

        if algorithm != "ciede2000":
            raise ValueError("algorithm must be 'ciede2000'")

        source_lab = rgb_to_lab_colormath(source_rgb)
        source_saturation, source_brightness = rgb_similarity_features(source_rgb)
        nearest: list[tuple[tuple[float, float], float, PaintColor]] = []

        for paint in paints:
            paint_rgb = hex_to_rgb(paint.hex_code)
            distance = compute_delta_e(source_lab, rgb_to_lab_colormath(paint_rgb))
            paint_saturation, paint_brightness = rgb_similarity_features(paint_rgb)
            brightness_diff = abs(source_brightness - paint_brightness)
            saturation_diff = abs(source_saturation - paint_saturation)
            nearest.append((ranking_key(distance, brightness_diff, saturation_diff), distance, paint))

        best = heapq.nsmallest(top_k, nearest, key=lambda item: item[0])
        return [build_match_payload(paint, delta_e) for _, delta_e, paint in best]
