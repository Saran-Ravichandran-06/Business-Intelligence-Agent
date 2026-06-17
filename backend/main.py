from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.routes.health import router as health_router
from backend.routes.dataset import router as dataset_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.agent import router as agent_router
from backend.routes.reports import router as reports_router


def create_app() -> FastAPI:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    app = FastAPI(
        title="AI BI Analyst API",
        version="0.1.0",
        description="Backend foundation for AI Business Intelligence Analyst project.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(dataset_router)
    app.include_router(dashboard_router)
    app.include_router(agent_router)
    app.include_router(reports_router)
    return app


app = create_app()

