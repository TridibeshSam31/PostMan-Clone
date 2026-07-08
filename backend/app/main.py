import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import collections, environments, history, requests, runner, folders, organizations, teams, workspaces
from app import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed.run_seed()
    yield


app = FastAPI(title="Postman Clone API", version="1.0.0", lifespan=lifespan)

# Read allowed origins from env; fall back to localhost for local dev.
# On Render, set ALLOWED_ORIGINS=https://postman-clone-ivory.vercel.app
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001",
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(collections.router)
app.include_router(requests.router)
app.include_router(environments.router)
app.include_router(history.router)
app.include_router(runner.router)
app.include_router(folders.router)
app.include_router(organizations.router)
app.include_router(teams.router)
app.include_router(workspaces.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
