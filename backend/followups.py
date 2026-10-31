from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, datetime, timezone
from typing import Optional

from database import supabase

router = APIRouter(
    prefix="/followups",
    tags=["Follow-up Management"]
)


class FollowupCreate(BaseModel):
    patient_id: str
    followup_type: str = "Routine"
    scheduled_date: date
    notes: Optional[str] = None


# Create a follow-up
@router.post("/")
def create_followup(data: FollowupCreate):
    try:
        # Check whether patient exists
        patient = (
            supabase.table("patients")
            .select("id")
            .eq("id", data.patient_id)
            .execute()
        )

        if not patient.data:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        result = (
            supabase.table("followups")
            .insert(data.model_dump(mode="json"))
            .execute()
        )

        return {
            "message": "Follow-up scheduled successfully",
            "followup": result.data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Get all follow-ups
@router.get("/")
def get_followups():
    try:
        result = (
            supabase.table("followups")
            .select("*")
            .order("scheduled_date")
            .execute()
        )
        return result.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Get overdue follow-ups
@router.get("/overdue")
def get_overdue_followups():
    try:
        today = date.today().isoformat()

        result = (
            supabase.table("followups")
            .select("*")
            .eq("status", "pending")
            .lt("scheduled_date", today)
            .execute()
        )

        return result.data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Mark a follow-up as completed
@router.patch("/{followup_id}/complete")
def complete_followup(followup_id: str):
    try:
        result = (
            supabase.table("followups")
            .update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            })
            .eq("id", followup_id)
            .eq("status", "pending")
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Pending follow-up not found"
            )

        return {
            "message": "Follow-up completed successfully",
            "followup": result.data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))