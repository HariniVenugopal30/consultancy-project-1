from sqlalchemy.orm import Session

from app.db.models import PaintColor

SEED_PAINTS = [
    {"name": "Alpine White", "hex_code": "#F6F5F0", "brand": "ColorNest", "price": 29.99},
    {"name": "Sunset Ember", "hex_code": "#D96C3A", "brand": "ColorNest", "price": 31.49},
    {"name": "Ocean Drift", "hex_code": "#3E7FA8", "brand": "ColorNest", "price": 34.99},
    {"name": "Forest Moss", "hex_code": "#4D6B3C", "brand": "ColorNest", "price": 30.99},
    {"name": "Charcoal Slate", "hex_code": "#3D4147", "brand": "ColorNest", "price": 35.25},
    {"name": "Citrus Glow", "hex_code": "#E8B923", "brand": "HueWorks", "price": 28.75},
    {"name": "Rose Clay", "hex_code": "#C58B80", "brand": "HueWorks", "price": 32.10},
    {"name": "Midnight Ink", "hex_code": "#1D2940", "brand": "HueWorks", "price": 36.90},
    {"name": "Mint Whisper", "hex_code": "#9DC9BA", "brand": "HueWorks", "price": 27.99},
    {"name": "Sand Dune", "hex_code": "#C9B597", "brand": "WallTone", "price": 26.50},
    {"name": "Lavender Mist", "hex_code": "#B5A5C9", "brand": "WallTone", "price": 29.40},
    {"name": "Crimson Brick", "hex_code": "#8F3A3C", "brand": "WallTone", "price": 33.15},
]


def seed_paints_if_empty(db: Session) -> None:
    existing_count = db.query(PaintColor).count()
    if existing_count > 0:
        return

    db.add_all(PaintColor(**paint) for paint in SEED_PAINTS)
    db.commit()
