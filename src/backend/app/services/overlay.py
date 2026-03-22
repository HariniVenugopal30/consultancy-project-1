from __future__ import annotations

import cv2
import numpy as np

from app.services.utils import hex_to_rgb


class PaintOverlayService:
    @staticmethod
    def _decode_image(image_bytes: bytes) -> np.ndarray:
        np_buffer = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
        if image_bgr is None:
            raise ValueError("Invalid image file")
        return image_bgr

    @staticmethod
    def detect_paintable_mask(
        image_bgr: np.ndarray,
        value_min: int = 90,
        sat_max: int = 85,
    ) -> np.ndarray:
        image_hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

        # Favor bright, low-saturation surfaces (typical wall regions).
        lower = np.array([0, 0, value_min], dtype=np.uint8)
        upper = np.array([179, sat_max, 255], dtype=np.uint8)
        mask = cv2.inRange(image_hsv, lower, upper)

        # Clean small artifacts and soften boundaries for natural transitions.
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.GaussianBlur(mask, (7, 7), 0)
        return mask

    @staticmethod
    def blend_color_preserve_texture(
        image_bgr: np.ndarray,
        target_hex: str,
        mask: np.ndarray,
        alpha: float = 0.45,
    ) -> np.ndarray:
        r, g, b = hex_to_rgb(target_hex)
        target_bgr = np.full_like(image_bgr, (b, g, r), dtype=np.uint8)

        # Tint with alpha, then restore original luminance channel to retain shadows/texture.
        tinted = cv2.addWeighted(target_bgr, alpha, image_bgr, 1.0 - alpha, 0)

        orig_lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        tinted_lab = cv2.cvtColor(tinted, cv2.COLOR_BGR2LAB)
        tinted_lab[:, :, 0] = orig_lab[:, :, 0]
        textured_tinted = cv2.cvtColor(tinted_lab, cv2.COLOR_LAB2BGR)

        # Convert soft mask to float alpha map for seamless region blending.
        alpha_map = (mask.astype(np.float32) / 255.0)[:, :, None]
        mixed = (
            textured_tinted.astype(np.float32) * alpha_map
            + image_bgr.astype(np.float32) * (1.0 - alpha_map)
        )
        return np.clip(mixed, 0, 255).astype(np.uint8)

    @staticmethod
    def _encode_png(image_bgr: np.ndarray) -> bytes:
        success, encoded = cv2.imencode(".png", image_bgr)
        if not success:
            raise ValueError("Failed to encode overlaid image")
        return encoded.tobytes()

    def apply_color(
        self,
        image_bytes: bytes,
        selected_hex: str,
        alpha: float = 0.45,
    ) -> bytes:
        image_bgr = self._decode_image(image_bytes)
        mask = self.detect_paintable_mask(image_bgr)
        result = self.blend_color_preserve_texture(image_bgr, selected_hex, mask, alpha=alpha)
        return self._encode_png(result)

    def apply_overlay(
        self,
        image_bytes: bytes,
        target_hex: str,
        alpha: float = 0.45,
    ) -> bytes:
        return self.apply_color(image_bytes=image_bytes, selected_hex=target_hex, alpha=alpha)
