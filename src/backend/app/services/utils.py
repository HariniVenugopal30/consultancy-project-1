from __future__ import annotations

import math

import numpy as np


def normalize_rgb(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    """Ensure RGB values are in valid [0, 255] range."""
    return tuple(max(0, min(255, int(c))) for c in rgb)


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    r, g, b = rgb
    return f"#{r:02X}{g:02X}{b:02X}"


def hex_to_rgb(hex_code: str) -> tuple[int, int, int]:
    value = hex_code.strip().lstrip("#")
    if len(value) != 6:
        raise ValueError("hex_code must be 6 hex characters")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def _pivot_rgb(c: float) -> float:
    c = c / 255.0
    return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92


def rgb_to_xyz(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = (_pivot_rgb(channel) for channel in rgb)

    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    return x, y, z


def _pivot_xyz(t: float) -> float:
    return t ** (1 / 3) if t > 0.008856 else (7.787 * t) + (16 / 116)


def xyz_to_lab(xyz: tuple[float, float, float]) -> tuple[float, float, float]:
    x, y, z = xyz
    x_ref, y_ref, z_ref = 0.95047, 1.00000, 1.08883

    x = _pivot_xyz(x / x_ref)
    y = _pivot_xyz(y / y_ref)
    z = _pivot_xyz(z / z_ref)

    l = (116 * y) - 16
    a = 500 * (x - y)
    b = 200 * (y - z)
    return l, a, b


def rgb_to_lab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    return xyz_to_lab(rgb_to_xyz(rgb))


def delta_e_ciede2000(
    lab1: tuple[float, float, float],
    lab2: tuple[float, float, float],
) -> float:
    l1, a1, b1 = lab1
    l2, a2, b2 = lab2

    avg_lp = (l1 + l2) / 2.0
    c1 = math.sqrt(a1 * a1 + b1 * b1)
    c2 = math.sqrt(a2 * a2 + b2 * b2)
    avg_c = (c1 + c2) / 2.0

    g = 0.5 * (1 - math.sqrt((avg_c**7) / (avg_c**7 + 25**7)))
    a1p = (1 + g) * a1
    a2p = (1 + g) * a2
    c1p = math.sqrt(a1p * a1p + b1 * b1)
    c2p = math.sqrt(a2p * a2p + b2 * b2)

    h1p = math.degrees(math.atan2(b1, a1p)) % 360
    h2p = math.degrees(math.atan2(b2, a2p)) % 360

    delta_lp = l2 - l1
    delta_cp = c2p - c1p

    if c1p * c2p == 0:
        delta_hp = 0
    else:
        dh = h2p - h1p
        if dh > 180:
            dh -= 360
        elif dh < -180:
            dh += 360
        delta_hp = dh

    delta_hp_term = 2 * math.sqrt(c1p * c2p) * math.sin(math.radians(delta_hp / 2))

    avg_lp_minus_50_sq = (avg_lp - 50) ** 2
    s_l = 1 + ((0.015 * avg_lp_minus_50_sq) / math.sqrt(20 + avg_lp_minus_50_sq))
    avg_cp = (c1p + c2p) / 2
    s_c = 1 + 0.045 * avg_cp

    if c1p * c2p == 0:
        avg_hp = h1p + h2p
    else:
        h_sum = h1p + h2p
        if abs(h1p - h2p) > 180:
            avg_hp = (h_sum + 360) / 2 if h_sum < 360 else (h_sum - 360) / 2
        else:
            avg_hp = h_sum / 2

    t = (
        1
        - 0.17 * math.cos(math.radians(avg_hp - 30))
        + 0.24 * math.cos(math.radians(2 * avg_hp))
        + 0.32 * math.cos(math.radians(3 * avg_hp + 6))
        - 0.20 * math.cos(math.radians(4 * avg_hp - 63))
    )

    s_h = 1 + 0.015 * avg_cp * t
    delta_theta = 30 * math.exp(-(((avg_hp - 275) / 25) ** 2))
    r_c = 2 * math.sqrt((avg_cp**7) / (avg_cp**7 + 25**7))
    r_t = -r_c * math.sin(math.radians(2 * delta_theta))

    delta_l = delta_lp / s_l
    delta_c = delta_cp / s_c
    delta_h = delta_hp_term / s_h

    return math.sqrt(
        delta_l**2 + delta_c**2 + delta_h**2 + r_t * delta_c * delta_h
    )


def euclidean_rgb_distance(
    rgb1: tuple[int, int, int],
    rgb2: tuple[int, int, int],
) -> float:
    return math.sqrt(
        (rgb1[0] - rgb2[0]) ** 2 + (rgb1[1] - rgb2[1]) ** 2 + (rgb1[2] - rgb2[2]) ** 2
    )


def delta_e_ciede2000_batch(
    source_lab: np.ndarray,
    catalog_labs: np.ndarray,
) -> np.ndarray:
    """Vectorised CIEDE2000: one source color vs N catalog colors.

    Args:
        source_lab: shape (3,)
        catalog_labs: shape (N, 3)

    Returns:
        shape (N,) float64 distances
    """
    l1, a1, b1 = float(source_lab[0]), float(source_lab[1]), float(source_lab[2])
    l2 = catalog_labs[:, 0]
    a2 = catalog_labs[:, 1]
    b2 = catalog_labs[:, 2]

    c1 = np.sqrt(a1 * a1 + b1 * b1)
    c2 = np.sqrt(a2 * a2 + b2 * b2)
    avg_c = (c1 + c2) / 2.0

    g = 0.5 * (1.0 - np.sqrt((avg_c**7) / ((avg_c**7) + (25.0**7))))
    a1p = (1.0 + g) * a1
    a2p = (1.0 + g) * a2
    c1p = np.sqrt(a1p * a1p + b1 * b1)
    c2p = np.sqrt(a2p * a2p + b2 * b2)

    h1p = (np.degrees(np.arctan2(b1, a1p)) + 360.0) % 360.0
    h2p = (np.degrees(np.arctan2(b2, a2p)) + 360.0) % 360.0

    delta_lp = l2 - l1
    delta_cp = c2p - c1p

    dh = h2p - h1p
    dh = np.where(dh > 180.0, dh - 360.0, dh)
    dh = np.where(dh < -180.0, dh + 360.0, dh)
    delta_hp = np.where(c1p * c2p == 0.0, 0.0, dh)
    delta_hp_term = 2.0 * np.sqrt(c1p * c2p) * np.sin(np.radians(delta_hp / 2.0))

    avg_lp = (l1 + l2) / 2.0
    avg_cp = (c1p + c2p) / 2.0

    h_sum = h1p + h2p
    avg_hp = np.where(
        c1p * c2p == 0.0,
        h_sum,
        np.where(
            np.abs(h1p - h2p) > 180.0,
            np.where(h_sum < 360.0, (h_sum + 360.0) / 2.0, (h_sum - 360.0) / 2.0),
            h_sum / 2.0,
        ),
    )

    t = (
        1.0
        - 0.17 * np.cos(np.radians(avg_hp - 30.0))
        + 0.24 * np.cos(np.radians(2.0 * avg_hp))
        + 0.32 * np.cos(np.radians(3.0 * avg_hp + 6.0))
        - 0.20 * np.cos(np.radians(4.0 * avg_hp - 63.0))
    )

    avg_lp_minus_50_sq = (avg_lp - 50.0) ** 2
    s_l = 1.0 + (0.015 * avg_lp_minus_50_sq) / np.sqrt(20.0 + avg_lp_minus_50_sq)
    s_c = 1.0 + 0.045 * avg_cp
    s_h = 1.0 + 0.015 * avg_cp * t

    delta_theta = 30.0 * np.exp(-(((avg_hp - 275.0) / 25.0) ** 2))
    r_c = 2.0 * np.sqrt((avg_cp**7) / ((avg_cp**7) + (25.0**7)))
    r_t = -r_c * np.sin(np.radians(2.0 * delta_theta))

    delta_l = delta_lp / s_l
    delta_c = delta_cp / s_c
    delta_h = delta_hp_term / s_h

    return np.sqrt(
        delta_l**2 + delta_c**2 + delta_h**2 + r_t * delta_c * delta_h
    )
