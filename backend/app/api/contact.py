from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
from datetime import datetime

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str

class ContactResponse(BaseModel):
    success: bool
    message: str

def send_email_notification(contact_data: ContactRequest):
    """Send email notification when contact form is submitted"""
    try:
        # Email configuration from environment variables
        smtp_server = config('SMTP_SERVER', default='smtp.gmail.com')
        smtp_port = config('SMTP_PORT', default=587, cast=int)
        smtp_username = config('SMTP_USERNAME', default='')
        smtp_password = config('SMTP_PASSWORD', default='')
        admin_email = config('ADMIN_EMAIL', default='your-email@gmail.com')
        
        if not smtp_username or not smtp_password:
            print("⚠ Email credentials not configured. Skipping email notification.")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = admin_email
        msg['Subject'] = f"New Contact Form Submission: {contact_data.subject or 'No Subject'}"
        
        # HTML email body
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                🔔 New Contact Form Submission
              </h2>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Name:</strong> {contact_data.name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{contact_data.email}">{contact_data.email}</a></p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> {contact_data.phone or 'Not provided'}</p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> {contact_data.subject or 'No subject'}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
              </div>
              
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <h3 style="color: #2563eb; margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">{contact_data.message}</p>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                <p>This is an automated message from HealthPredict Contact Form</p>
                <p>Reply directly to <a href="mailto:{contact_data.email}">{contact_data.email}</a> to respond</p>
              </div>
            </div>
          </body>
        </html>
        """
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"✓ Email notification sent to {admin_email}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to send email: {e}")
        return False

def send_sms_notification(contact_data: ContactRequest):
    """Send SMS notification using Twilio (optional)"""
    try:
        # Twilio configuration (optional)
        twilio_account_sid = config('TWILIO_ACCOUNT_SID', default='')
        twilio_auth_token = config('TWILIO_AUTH_TOKEN', default='')
        twilio_phone_number = config('TWILIO_PHONE_NUMBER', default='')
        admin_phone = config('ADMIN_PHONE', default='')
        
        if not all([twilio_account_sid, twilio_auth_token, twilio_phone_number, admin_phone]):
            print("⚠ Twilio credentials not configured. Skipping SMS notification.")
            return False
        
        # Import Twilio (only if configured)
        from twilio.rest import Client
        
        client = Client(twilio_account_sid, twilio_auth_token)
        
        message_body = f"""
🔔 New Contact Form Submission

Name: {contact_data.name}
Email: {contact_data.email}
Phone: {contact_data.phone or 'N/A'}
Subject: {contact_data.subject or 'No subject'}

Message: {contact_data.message[:100]}...
        """.strip()
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone_number,
            to=admin_phone
        )
        
        print(f"✓ SMS notification sent to {admin_phone}")
        return True
        
    except ImportError:
        print("⚠ Twilio library not installed. Run: pip install twilio")
        return False
    except Exception as e:
        print(f"✗ Failed to send SMS: {e}")
        return False

@router.post("/submit", response_model=ContactResponse)
async def submit_contact_form(contact: ContactRequest):
    """
    Submit contact form and send notifications via email and/or SMS
    """
    try:
        # Log the contact submission
        print("=" * 60)
        print("📧 NEW CONTACT FORM SUBMISSION")
        print("=" * 60)
        print(f"Name: {contact.name}")
        print(f"Email: {contact.email}")
        print(f"Phone: {contact.phone or 'Not provided'}")
        print(f"Subject: {contact.subject or 'No subject'}")
        print(f"Message: {contact.message}")
        print("=" * 60)
        
        # Send email notification
        email_sent = send_email_notification(contact)
        
        # Send SMS notification (optional)
        sms_sent = send_sms_notification(contact)
        
        # Determine response message
        if email_sent or sms_sent:
            notifications = []
            if email_sent:
                notifications.append("email")
            if sms_sent:
                notifications.append("SMS")
            
            message = f"Thank you for contacting us! Your message has been received and notifications sent via {' and '.join(notifications)}."
        else:
            message = "Thank you for contacting us! Your message has been received. We'll get back to you soon."
        
        return ContactResponse(
            success=True,
            message=message
        )
        
    except Exception as e:
        print(f"✗ Error processing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contact form submission"
        )

@router.get("/test-email")
async def test_email_configuration():
    """Test endpoint to verify email configuration"""
    try:
        smtp_username = config('SMTP_USERNAME', default='')
        admin_email = config('ADMIN_EMAIL', default='')
        
        if not smtp_username:
            return {
                "configured": False,
                "message": "Email not configured. Please set SMTP_USERNAME and SMTP_PASSWORD in .env file"
            }
        
        return {
            "configured": True,
            "smtp_username": smtp_username,
            "admin_email": admin_email,
            "message": "Email configuration found"
        }
    except Exception as e:
        return {
            "configured": False,
            "error": str(e)
        }
