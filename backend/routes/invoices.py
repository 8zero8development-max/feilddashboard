from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

from database import supabase
from models.invoice import InvoiceCreate, InvoiceResponse
from services.auth import get_current_user
from services.pdf import generate_invoice_pdf_content

router = APIRouter(prefix="/invoices", tags=["invoices"])


def generate_invoice_number():
    response = supabase.table('invoices').select('*', count='exact').execute()
    count = response.count if response.count else 0
    return f"INV-{str(count + 1).zfill(5)}"


@router.post("", response_model=InvoiceResponse)
async def create_invoice(data: InvoiceCreate, user: dict = Depends(get_current_user)):
    invoice_id = str(uuid.uuid4())
    invoice_number = generate_invoice_number()
    now = datetime.now(timezone.utc)
    
    subtotal = sum(line.get("quantity", 1) * line.get("unit_price", 0) for line in data.lines)
    vat = subtotal * 0.20
    total = subtotal + vat
    
    doc = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        **data.model_dump(),
        "subtotal": subtotal,
        "vat": vat,
        "total": total,
        "status": "unpaid",
        "due_date": (now + timedelta(days=data.due_days)).isoformat(),
        "created_at": now.isoformat()
    }
    supabase.table('invoices').insert(doc).execute()
    return doc


@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(status: Optional[str] = None, customer_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = supabase.table('invoices').select('*')
    if status:
        query = query.eq('status', status)
    if customer_id:
        query = query.eq('customer_id', customer_id)
    response = query.order('created_at', desc=True).limit(1000).execute()
    return response.data


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('invoices').select('*').eq('id', invoice_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return response.data[0]


@router.put("/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, user: dict = Depends(get_current_user)):
    response = supabase.table('invoices').update({"status": status}).eq('id', invoice_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice status updated"}


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    response = supabase.table('invoices').delete().eq('id', invoice_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"message": "Invoice deleted"}


@router.get("/{invoice_id}/pdf")
async def generate_invoice_pdf(invoice_id: str, user: dict = Depends(get_current_user)):
    invoice_response = supabase.table('invoices').select('*').eq('id', invoice_id).execute()
    if not invoice_response.data:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice = invoice_response.data[0]
    
    customer_response = supabase.table('customers').select('*').eq('id', invoice["customer_id"]).execute()
    customer = customer_response.data[0] if customer_response.data else None
    
    buffer = generate_invoice_pdf_content(invoice, customer)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice-{invoice.get('invoice_number', invoice_id)}.pdf"}
    )
