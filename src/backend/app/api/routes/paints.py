from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import PaintColor
from app.schemas.color import PaintColorOut

router = APIRouter(prefix="/paints", tags=["Paint Colors"])


@router.get("", response_model=list[PaintColorOut])
def list_paints(db: Session = Depends(get_db)):
    return db.query(PaintColor).order_by(PaintColor.id.asc()).all()
