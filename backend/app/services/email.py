from typing import Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

# Email configuration
SMTP_SERVER = config("SMTP_SERVER", default="smtp.gmail.com")
SMTP_PORT = config("SMTP_PORT", default=587)
SMTP_USERNAME = config("SMTP_USERNAME", default="")
SMTP_PASSWORD = config("SMTP_PASSWORD", default="")
FROM_EMAIL = config("FROM_EMAIL", default="noreply@healthpredict.com")

async def send_verification_email(email: str, verification_token: str) -> bool:
    """Send email verification to user"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Verify your HealthPredict account"
        
        # Email body
        body = f"""
        <html>
        <body>
            <h2>Welcome to HealthPredict!</h2>
            <p>Thank you for registering with HealthPredict. Please click the link below to verify your account:</p>
            <p><a href="http://localhost:3000/verify?token={verification_token}">Verify Account</a></p>
            <p>If you didn't create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The HealthPredict Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False

async def send_welcome_email(email: str, name: str) -> bool:
    """Send welcome email to newly registered user"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("⚠ Email credentials not configured. Skipping welcome email.")
            return False
            
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USERNAME
        msg['To'] = email
        msg['Subject'] = "Welcome to HealthPredict! 🏥"
        
        # HTML email body
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px;">🏥 HealthPredict</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Health Insights</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="color: #667eea; margin-top: 0;">Welcome, {name}! 🎉</h2>
              
              <p style="font-size: 16px; color: #555;">
                Thank you for registering with <strong>HealthPredict</strong>! We're excited to have you on board.
              </p>
              
              <p style="font-size: 16px; color: #555;">
                Your account has been successfully created and you can now access all our features:
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #667eea; margin-top: 0; font-size: 18px;">✨ What You Can Do:</h3>
                <ul style="color: #555; padding-left: 20px; margin: 10px 0;">
                  <li style="margin: 10px 0;">🔍 <strong>Disease Prediction</strong> - Get AI-powered health predictions with 97%+ accuracy</li>
                  <li style="margin: 10px 0;">📊 <strong>Health Analytics</strong> - Track your health trends over time</li>
                  <li style="margin: 10px 0;">📝 <strong>Prediction History</strong> - Access all your past predictions</li>
                  <li style="margin: 10px 0;">👤 <strong>Personal Dashboard</strong> - Manage your health profile</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;">
                  Get Started Now →
                </a>
              </div>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Important:</strong> HealthPredict is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #555; margin-top: 30px;">
                If you have any questions or need assistance, feel free to reach out to us through the contact page.
              </p>
              
              <p style="font-size: 16px; color: #555;">
                Stay healthy! 💙
              </p>
              
              <p style="font-size: 16px; color: #555; margin-bottom: 0;">
                Best regards,<br>
                <strong>The HealthPredict Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                © 2025 HealthPredict. All rights reserved.
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                You received this email because you registered at HealthPredict.
              </p>
              <p style="margin: 5px 0; font-size: 12px;">
                <a href="http://localhost:3000/contact" style="color: #667eea; text-decoration: none;">Contact Us</a> | 
                <a href="http://localhost:3000/about" style="color: #667eea; text-decoration: none;">About</a>
              </p>
            </div>
          </body>
        </html>
        """
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✓ Welcome email sent to {email}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to send welcome email: {e}")
        return False

async def send_password_reset_email(email: str, reset_token: str) -> bool:
    """Send password reset email to user"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Reset your HealthPredict password"
        
        # Email body
        body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password for HealthPredict. Click the link below to reset your password:</p>
            <p><a href="http://localhost:3000/reset-password?token={reset_token}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The HealthPredict Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(FROM_EMAIL, email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False
