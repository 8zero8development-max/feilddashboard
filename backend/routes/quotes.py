from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

from database import supabase
from models.invoice import QuoteCreate, QuoteResponse
from services.auth import get_current_user, get_user_from_token_param
from services.pdf import generate_quote_pdf_content

router = APIRouter(prefix="/quotes", tags=["quotes"])


def generate_quote_number():
    response = supabase.table('quotes').select('*', count='exact').execute()
    count = response.count if response.count else 0
    return f"QUO-{str(count + 1).zfill(5)}"


@router.post("", response_model=QuoteResponse)
async def create_quote(data: QuoteCreate, user: dict = Depends(get_current_user)):
    quote_id = str(uuid.uuid4())
    quote_number = generate_quote_number()
    now = datetime.now(timezone.utc)
    
    subtotal = sum(line.get("quantity", 1) * line.get("unit_price", 0) for line in data.lines)
    vat = subtotal * 0.20
    total = subtotal + vat
    
    doc = {
        "id": quote_id,
        "quote_number": quote_number,
        **data.model_dump(),
        "subtotal": subtotal,
        "vat": vat,
        "total": total,
        "status": "draft",
        "valid_until": (now + timedelta(days=data.valid_days)).isoformat(),
        "created_at": now.isoformat()
    }
    supabase.table('quotes').insert(doc).execute()
    return doc


@router.get("", response_model=List[QuoteResponse])
async def get_quotes(status: Optional[str] = None, customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = supabase.table('quotes').select('*')
    if status:
        query = query.eq('status', status)
    if customer_id:
        query = query.eq('customer_id', customer_id)
    response = query.order('created_at', desc=True).limit(1000).execute()
    return response.data


@router.get("/{quote_id}", response_model=QuoteResponse)
async def get_quote(quote_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('quotes').select('*').eq('id', quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Quote not found")
    return response.data[0]


@router.put("/{quote_id}/status")
async def update_quote_status(quote_id: str, status: str, user: dict = Depends(get_current_user)):
    response = supabase.table('quotes').update({"status": status}).eq('id', quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote status updated"}


@router.delete("/{quote_id}")
async def delete_quote(quote_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('quotes').delete().eq('id', quote_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"message": "Quote deleted"}


@router.get("/{quote_id}/pdf")
async def generate_quote_pdf(quote_id: str, user: dict = Depends(get_user_from_token_param)):
    quote_response = supabase.table('quotes').select('*').eq('id', quote_id).execute()
    if not quote_response.data:
        raise HTTPException(status_code=404, detail="Quote not found")
    quote = quote_response.data[0]
    
    customer_response = supabase.table('customers').select('*').eq('id', quote["customer_id"]).execute()
    customer = customer_response.data[0] if customer_response.data else None
    
    buffer = generate_quote_pdf_content(quote, customer)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quote-{quote.get('quote_number', quote_id)}.pdf"}
    )
