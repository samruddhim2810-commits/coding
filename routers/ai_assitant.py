from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini_service import ask_gemini

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str
    language: str = "English"


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    try:
        print ("gemini reached ")
        reply = ask_gemini(
            message=request.message,
            language=request.language
        )

        return ChatResponse(reply=reply)

    except Exception as e:
        print("GEMINI ERROR:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="AI assistant is temporarily unavailable"
        )