"""
Test script to verify email sending
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

def test_email():
    print("=" * 60)
    print("Testing Email Configuration")
    print("=" * 60)
    
    # Load configuration
    smtp_server = config('SMTP_SERVER', default='smtp.gmail.com')
    smtp_port = config('SMTP_PORT', default=587, cast=int)
    smtp_username = config('SMTP_USERNAME', default='')
    smtp_password = config('SMTP_PASSWORD', default='')
    admin_email = config('ADMIN_EMAIL', default='')
    
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"SMTP Username: {smtp_username}")
    print(f"SMTP Password: {'*' * len(smtp_password) if smtp_password else 'NOT SET'}")
    print(f"Admin Email: {admin_email}")
    print("=" * 60)
    
    if not smtp_username or not smtp_password:
        print("❌ ERROR: Email credentials not configured!")
        print("Please set SMTP_USERNAME and SMTP_PASSWORD in .env file")
        return False
    
    try:
        print("\n📧 Attempting to send test email...")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = admin_email
        msg['Subject'] = "Test Email from HealthPredict"
        
        body = """
        <html>
          <body>
            <h2>✅ Email Configuration Test Successful!</h2>
            <p>This is a test email from your HealthPredict contact form.</p>
            <p>If you're seeing this, your email configuration is working correctly!</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Server: smtp.gmail.com</li>
              <li>From: {}</li>
              <li>To: {}</li>
            </ul>
          </body>
        </html>
        """.format(smtp_username, admin_email)
        
        msg.attach(MIMEText(body, 'html'))
        
        # Connect and send
        print(f"Connecting to {smtp_server}:{smtp_port}...")
        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            print("Starting TLS...")
            server.starttls()
            
            print("Logging in...")
            server.login(smtp_username, smtp_password)
            
            print("Sending email...")
            server.send_message(msg)
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Email sent successfully!")
        print(f"📬 Check your inbox at: {admin_email}")
        print("=" * 60)
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("\n" + "=" * 60)
        print("❌ AUTHENTICATION ERROR!")
        print("=" * 60)
        print("The username or password is incorrect.")
        print("\nPossible solutions:")
        print("1. Make sure you're using an App Password, not your regular Gmail password")
        print("2. Verify the App Password is correct (no spaces)")
        print("3. Make sure 2-Step Verification is enabled")
        print(f"\nError details: {e}")
        print("=" * 60)
        return False
        
    except smtplib.SMTPException as e:
        print("\n" + "=" * 60)
        print("❌ SMTP ERROR!")
        print("=" * 60)
        print(f"Error: {e}")
        print("=" * 60)
        return False
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ UNEXPECTED ERROR!")
        print("=" * 60)
        print(f"Error: {e}")
        print(f"Error type: {type(e).__name__}")
        print("=" * 60)
        return False

if __name__ == "__main__":
    test_email()
