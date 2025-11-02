from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

router = APIRouter()

class ContactFormData(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    subject: str
    message: str
    phone: Optional[str] = None
    company: Optional[str] = None

@router.post("/submit")
async def submit_contact_form(form_data: ContactFormData):
    """Handle contact form submission and send email"""
    try:
        # Email configuration
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        recipient_email = "jayanthkorupolu.2000@gmail.com"
        
        if not sender_email or not sender_password:
            raise HTTPException(
                status_code=500, 
                detail="Email configuration not found. Please configure SMTP settings."
            )
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = f"EcoTrack Contact Form: {form_data.subject}"
        
        # Email body
        email_body = f"""
        New Contact Form Submission from EcoTrack AI Website
        
        Name: {form_data.firstName} {form_data.lastName}
        Email: {form_data.email}
        Subject: {form_data.subject}
        {f"Phone: {form_data.phone}" if form_data.phone else ""}
        {f"Company: {form_data.company}" if form_data.company else ""}
        
        Message:
        {form_data.message}
        
        ---
        This message was sent from the EcoTrack AI contact form.
        """
        
        msg.attach(MIMEText(email_body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        
        return {
            "success": True, 
            "message": "Thank you for your message! We'll get back to you within 24 hours."
        }
        
    except smtplib.SMTPException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send email: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/test")
async def test_email_config():
    """Test endpoint to check email configuration"""
    sender_email = os.getenv("SENDER_EMAIL")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    
    return {
        "smtp_server": smtp_server,
        "sender_email": sender_email,
        "configured": bool(sender_email and os.getenv("SENDER_PASSWORD"))
    }
