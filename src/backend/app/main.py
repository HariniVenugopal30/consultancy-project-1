from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import match, paints
from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_paints_if_empty
from app.services.paint_catalog import catalog

app = FastAPI(
    title="Paint Shop AI Color Matcher",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_paints_if_empty(db)
        catalog.load(db)  # pre-cache paint LAB/RGB vectors
    finally:
        db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(match.router)
app.include_router(paints.router)
