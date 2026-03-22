from __future__ import annotations

import asyncio

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response

from app.schemas.color import MatchColorsResponse
from app.services.color_extractor import ColorExtractor
from app.services.overlay import PaintOverlayService
from app.services.paint_catalog import catalog
from app.services.request_cache import image_match_cache

router = APIRouter(tags=["Color Matching"])

_extractor = ColorExtractor(k=5)  # reuse across requests


@router.post("/match-colors", response_model=MatchColorsResponse)
async def match_colors(
    file: UploadFile = File(...),
    algorithm: str = Query("ciede2000", pattern="^ciede2000$"),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()
    cache_key = image_match_cache.build_key(image_bytes, algorithm=algorithm, top_k=4)
    cached_payload = image_match_cache.get(cache_key)
    if cached_payload is not None:
        return {"extracted_colors": cached_payload}

    # Run CPU-bound work in a thread so the async event loop stays unblocked.
    def _process() -> list[dict]:
        try:
            extracted = _extractor.extract_dominant_colors(image_bytes)
        except ValueError as err:
            raise err

        payload = []
        for item in extracted:
            rgb_tuple = tuple(item["rgb"])
            matches = catalog.match(rgb_tuple, algorithm=algorithm, top_k=4)
            best_match = matches[0] if matches else None
            alternatives = matches[1:4] if len(matches) > 1 else []
            payload.append(
                {
                    "rgb": item["rgb"],
                    "hex_code": item["hex_code"],
                    "best_match": best_match,
                    "alternatives": alternatives,
                    "matches": matches,
                }
            )
        return payload

    try:
        result = await asyncio.to_thread(_process)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    image_match_cache.set(cache_key, result)
    return {"extracted_colors": result}


@router.post("/overlay-color")
async def overlay_color(
    file: UploadFile = File(...),
    paint_hex: str = Query(..., min_length=7, max_length=7),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()
    overlay_service = PaintOverlayService()

    try:
        result_png = overlay_service.apply_overlay(image_bytes, paint_hex)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    return Response(content=result_png, media_type="image/png")


@router.post("/apply-color")
async def apply_color(
    image: UploadFile = File(...),
    selected_hex: str = Form(..., min_length=7, max_length=7),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await image.read()
    overlay_service = PaintOverlayService()

    try:
        result_png = overlay_service.apply_color(image_bytes=image_bytes, selected_hex=selected_hex)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

    return Response(content=result_png, media_type="image/png")
