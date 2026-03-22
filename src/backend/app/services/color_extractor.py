from __future__ import annotations

import cv2
import numpy as np

from app.services.utils import normalize_rgb, rgb_to_hex


class ColorExtractor:
    def __init__(self, k: int = 5):
        self.k_max = k
        self.min_cluster_size_percent = 0.01  # Clusters < 1% of pixels are noise

    # Resize the image to at most this many pixels on the longest edge before
    # running KMeans.  Smaller = faster; 300 px captures colour information well.
    _MAX_SIDE = 300

    def _find_optimal_k(self, pixels: np.ndarray) -> int:
        """Find optimal k using elbow method on within-cluster sum of squares."""
        # Try k from 2 to min(k_max, 10)
        inertias = []
        k_range = range(2, min(self.k_max + 1, 10))

        criteria = (
            cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER,
            20,
            1.0,
        )

        for k in k_range:
            _, _, centers = cv2.kmeans(
                pixels,
                k,
                None,
                criteria,
                3,
                cv2.KMEANS_PP_CENTERS,
            )
            # Compute within-cluster sum of squares (inertia)
            distances = np.min(
                np.sqrt(((pixels - centers[:, np.newaxis]) ** 2).sum(axis=2)), axis=0
            )
            inertia = np.sum(distances**2)
            inertias.append(inertia)

        # Elbow heuristic: find the "knee" where improvement slows
        # Simple approach: pick k where delta2 is smallest (curvature)
        if len(inertias) >= 3:
            deltas = np.diff(inertias)
            delta2 = np.diff(deltas)
            optimal_idx = np.argmin(delta2)
            return int(k_range[optimal_idx + 1])
        return int(k_range[0])

    def extract_dominant_colors(self, image_bytes: bytes) -> list[dict]:
        np_buffer = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
        if image_bgr is None:
            raise ValueError("Invalid image file")

        # --- Resize to cap pixel count before KMeans ---
        h, w = image_bgr.shape[:2]
        if max(h, w) > self._MAX_SIDE:
            scale = self._MAX_SIDE / max(h, w)
            new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
            image_bgr = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        pixels = image_rgb.reshape((-1, 3)).astype(np.float32)

        # Find optimal k using elbow method
        k_optimal = self._find_optimal_k(pixels)

        # K-means++ seeds (KMEANS_PP_CENTERS) converge faster → fewer attempts needed.
        criteria = (
            cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER,
            20,
            1.0,
        )
        _compactness, labels, centers = cv2.kmeans(
            pixels,
            k_optimal,
            None,
            criteria,
            3,
            cv2.KMEANS_PP_CENTERS,
        )

        labels = labels.flatten()
        centers = np.uint8(centers)
        counts = np.bincount(labels)

        # Filter out noise: clusters smaller than min_cluster_size_percent
        total_pixels = len(pixels)
        min_size = max(1, int(total_pixels * self.min_cluster_size_percent))
        
        valid_indices = np.where(counts >= min_size)[0]
        if len(valid_indices) == 0:
            valid_indices = np.array([np.argmax(counts)])
        
        sorted_indices = np.argsort(counts[valid_indices])[::-1]
        
        # Return top 5 colors by frequency
        top_k = min(5, len(sorted_indices))
        dominant_colors: list[dict] = []

        for i in range(top_k):
            cluster_idx = valid_indices[sorted_indices[i]]
            color = normalize_rgb(tuple(centers[cluster_idx]))
            dominant_colors.append(
                {
                    "rgb": [color[0], color[1], color[2]],
                    "hex_code": rgb_to_hex(color),
                    "pixel_count": int(counts[cluster_idx]),
                }
            )

        return dominant_colors
