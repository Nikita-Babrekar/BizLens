import os
import sys
from contextlib import asynccontextmanager
# pyrefly: ignore[missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure parent package is discoverable when run directly as a script
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

try:
    from .database import engine
    from . import models
    from .routers import ingest, overview, anomaly, root_cause, forecast, export, copilot
except (ImportError, ValueError):
    from app.database import engine
    from app import models
    from app.routers import ingest, overview, anomaly, root_cause, forecast, export, copilot

# Ensure SQLite database tables are created
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="BizLens Analytics API",
    description="Core Data Infrastructure & Analytics API for BizLens business intelligence platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration allowing frontend clients (e.g. Next.js on localhost or production deployment)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://biz-lens-lake.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include core feature routers
app.include_router(ingest.router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(overview.router, prefix="/api/overview", tags=["Overview"])
app.include_router(anomaly.router, prefix="/api/anomaly", tags=["Anomaly"])
app.include_router(root_cause.router, prefix="/api/root-cause", tags=["Root Cause"])
app.include_router(forecast.router, prefix="/api/forecast", tags=["Forecast"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(copilot.router, prefix="/api/copilot", tags=["Copilot"])


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "service": "BizLens Backend API",
        "version": "1.0.0",
        "endpoints": {
            "ingest": "/api/ingest/",
            "overview_kpis": "/api/overview/kpis",
            "export_pdf": "/api/export/pdf",
            "export_excel": "/api/export/excel",
            "export_share": "/api/export/share",
            "copilot_chat": "/api/copilot/chat",
            "docs": "/docs"
        }
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
