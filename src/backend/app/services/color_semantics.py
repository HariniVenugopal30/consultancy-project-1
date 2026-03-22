from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from app.services.utils import delta_e_ciede2000_batch, hex_to_rgb, rgb_to_lab


class ColorSemanticsService:
    def __init__(self, dataset_path: Path | None = None) -> None:
        self._dataset_path = dataset_path or Path(__file__).resolve().parents[1] / "data" / "color_semantics.json"
        self._by_hex: dict[str, dict] = {}
        self._records: list[dict] = []
        self._lab_array: np.ndarray | None = None
        self._load()

    @staticmethod
    def _normalize_hex(hex_code: str) -> str:
        code = hex_code.strip().upper()
        return code if code.startswith("#") else f"#{code}"

    def _load(self) -> None:
        raw = json.loads(self._dataset_path.read_text(encoding="utf-8"))
        records: list[dict] = []
        lab_rows: list[tuple[float, float, float]] = []

        for item in raw:
            hex_code = self._normalize_hex(item["hex"])
            record = {
                "hex": hex_code,
                "name": item["name"],
                "mood": item["mood"],
                "recommended_for": item["recommended_for"],
            }
            records.append(record)
            self._by_hex[hex_code] = record
            lab_rows.append(rgb_to_lab(hex_to_rgb(hex_code)))

        self._records = records
        self._lab_array = np.array(lab_rows, dtype=np.float64)

    def lookup(self, hex_code: str) -> dict:
        normalized = self._normalize_hex(hex_code)
        exact = self._by_hex.get(normalized)
        if exact:
            return exact

        source_lab = np.array(rgb_to_lab(hex_to_rgb(normalized)), dtype=np.float64)
        distances = delta_e_ciede2000_batch(source_lab, self._lab_array)
        nearest_idx = int(np.argmin(distances))
        return self._records[nearest_idx]


semantic_colors = ColorSemanticsService()
