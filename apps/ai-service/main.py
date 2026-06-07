from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="RI's Academy AI Service",
    description="RAG-based MCQ Generator and AI services for RI's Academy",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"service": "RI's Academy AI Service", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
