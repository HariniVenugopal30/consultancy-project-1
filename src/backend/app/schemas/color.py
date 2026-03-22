from pydantic import BaseModel


class SemanticColorInfo(BaseModel):
    hex: str
    name: str
    mood: str
    recommended_for: list[str]


class PaintMatch(BaseModel):
    id: int
    product_id: str
    name: str
    hex_code: str
    brand: str
    price: float
    delta_e: float
    match_quality: str
    accuracy: float
    semantic_color: SemanticColorInfo


class ExtractedColorResult(BaseModel):
    rgb: list[int]
    hex_code: str
    best_match: PaintMatch | None
    alternatives: list[PaintMatch]
    matches: list[PaintMatch]


class MatchColorsResponse(BaseModel):
    extracted_colors: list[ExtractedColorResult]


class PaintColorOut(BaseModel):
    id: int
    name: str
    hex_code: str
    brand: str
    price: float

    class Config:
        from_attributes = True
