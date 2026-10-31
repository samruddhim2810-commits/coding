from fastapi import FastAPI
from routers.ai_assitant import router as ai_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SWASTHYA SENSE API",
    description="Patient AI Health Assistant",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/")
def home():
    return {
        "message": "SWASTHYA SENSE Backend is running"
    }