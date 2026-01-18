from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch


def create_pdf_document(buffer: BytesIO):
    return SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=30, 
        leftMargin=30, 
        topMargin=30, 
        bottomMargin=30
    )


def get_title_style():
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        'Title', 
        parent=styles['Heading1'], 
        fontSize=18, 
        textColor=colors.HexColor('#06b6d4')
    )


def get_styles():
    return getSampleStyleSheet()


def generate_quote_pdf_content(quote: dict, customer: dict = None):
    buffer = BytesIO()
    doc = create_pdf_document(buffer)
    styles = get_styles()
    title_style = get_title_style()
    
    elements = []
    
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("QUOTATION", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    info_data = [
        ["Quote Number:", quote.get("quote_number", "")],
        ["Date:", quote.get("created_at", "")[:10]],
        ["Valid Until:", quote.get("valid_until", "")[:10]],
    ]
    t = Table(info_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    if customer:
        elements.append(Paragraph(f"To: {customer.get('company_name', '')}", styles['Normal']))
        elements.append(Paragraph(customer.get('billing_address', ''), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    lines_data = [["Description", "Type", "Qty", "Unit Price", "Total"]]
    for line in quote.get("lines", []):
        qty = line.get("quantity", 1)
        price = line.get("unit_price", 0)
        lines_data.append([
            line.get("description", ""),
            line.get("type", "").title(),
            str(qty),
            f"£{price:.2f}",
            f"£{qty * price:.2f}"
        ])
    
    t2 = Table(lines_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 10))
    
    totals_data = [
        ["", "", "", "Subtotal:", f"£{quote.get('subtotal', 0):.2f}"],
        ["", "", "", "VAT (20%):", f"£{quote.get('vat', 0):.2f}"],
        ["", "", "", "Total:", f"£{quote.get('total', 0):.2f}"],
    ]
    t3 = Table(totals_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t3.setStyle(TableStyle([
        ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
    ]))
    elements.append(t3)
    
    if quote.get("notes"):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Notes:", styles['Heading3']))
        elements.append(Paragraph(quote.get("notes", ""), styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_invoice_pdf_content(invoice: dict, customer: dict = None):
    buffer = BytesIO()
    doc = create_pdf_document(buffer)
    styles = get_styles()
    title_style = get_title_style()
    
    elements = []
    
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("INVOICE", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    info_data = [
        ["Invoice Number:", invoice.get("invoice_number", "")],
        ["Date:", invoice.get("created_at", "")[:10]],
        ["Due Date:", invoice.get("due_date", "")[:10]],
        ["Status:", invoice.get("status", "").upper()],
    ]
    t = Table(info_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    if customer:
        elements.append(Paragraph(f"Bill To: {customer.get('company_name', '')}", styles['Normal']))
        elements.append(Paragraph(customer.get('billing_address', ''), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    lines_data = [["Description", "Type", "Qty", "Unit Price", "Total"]]
    for line in invoice.get("lines", []):
        qty = line.get("quantity", 1)
        price = line.get("unit_price", 0)
        lines_data.append([
            line.get("description", ""),
            line.get("type", "").title(),
            str(qty),
            f"£{price:.2f}",
            f"£{qty * price:.2f}"
        ])
    
    t2 = Table(lines_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t2.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 10))
    
    totals_data = [
        ["", "", "", "Subtotal:", f"£{invoice.get('subtotal', 0):.2f}"],
        ["", "", "", "VAT (20%):", f"£{invoice.get('vat', 0):.2f}"],
        ["", "", "", "Total:", f"£{invoice.get('total', 0):.2f}"],
    ]
    t3 = Table(totals_data, colWidths=[2.5*inch, 1*inch, 0.5*inch, 1*inch, 1*inch])
    t3.setStyle(TableStyle([
        ('FONTNAME', (3, 2), (4, 2), 'Helvetica-Bold'),
        ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
    ]))
    elements.append(t3)
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Payment Terms: Net 30 days", styles['Normal']))
    elements.append(Paragraph("Bank: [Bank Details Here]", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_job_pdf_content(job: dict, customer: dict = None, site: dict = None, completion: dict = None):
    buffer = BytesIO()
    doc = create_pdf_document(buffer)
    styles = get_styles()
    title_style = get_title_style()
    
    elements = []
    
    elements.append(Paragraph("CRAVEN COOLING SERVICES LTD", title_style))
    elements.append(Paragraph("Service Report", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    job_data = [
        ["Job Number:", job.get("job_number", "")],
        ["Type:", job.get("job_type", "").replace("_", " ").title()],
        ["Status:", job.get("status", "").replace("_", " ").title()],
        ["Priority:", job.get("priority", "").title()],
        ["Date:", job.get("scheduled_date", "N/A")],
    ]
    
    t = Table(job_data, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#0f172a')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Customer Details", styles['Heading3']))
    if customer:
        cust_data = [
            ["Company:", customer.get("company_name", "")],
            ["Address:", customer.get("billing_address", "")],
            ["Phone:", customer.get("phone", "")],
        ]
        t2 = Table(cust_data, colWidths=[2*inch, 4*inch])
        t2.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t2)
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Site Details", styles['Heading3']))
    if site:
        site_data = [
            ["Site:", site.get("name", "")],
            ["Address:", site.get("address", "")],
            ["Access Notes:", site.get("access_notes", "")],
        ]
        t3 = Table(site_data, colWidths=[2*inch, 4*inch])
        t3.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t3)
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Job Description", styles['Heading3']))
    elements.append(Paragraph(job.get("description", ""), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    if completion:
        elements.append(Paragraph("Work Completed", styles['Heading3']))
        elements.append(Paragraph(completion.get("engineer_notes", ""), styles['Normal']))
        elements.append(Spacer(1, 10))
        
        time_data = [
            ["Travel Time:", f"{completion.get('travel_time', 0)} minutes"],
            ["Time on Site:", f"{completion.get('time_on_site', 0)} minutes"],
        ]
        t4 = Table(time_data, colWidths=[2*inch, 4*inch])
        t4.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ]))
        elements.append(t4)
        
        if completion.get("parts_used"):
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Parts Used", styles['Heading3']))
            parts_data = [["Part", "Quantity"]]
            for part in completion["parts_used"]:
                parts_data.append([part.get("name", ""), str(part.get("quantity", 1))])
            
            t5 = Table(parts_data, colWidths=[4*inch, 2*inch])
            t5.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#06b6d4')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(t5)
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Customer Signature: ________________________", styles['Normal']))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
