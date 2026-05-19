from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from . import models
from .database import engine
from .routes import auth_routes, project_routes, task_routes, dashboard_routes
import os

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(project_routes.router)
app.include_router(task_routes.router)
app.include_router(dashboard_routes.router)

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/dashboard")
def serve_dashboard():
    return FileResponse(os.path.join(frontend_dir, "dashboard.html"))
