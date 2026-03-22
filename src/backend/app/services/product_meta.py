from __future__ import annotations


def build_product_id(paint_id: int) -> str:
    return f"PNT-{paint_id:04d}"
