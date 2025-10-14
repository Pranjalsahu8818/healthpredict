"""
Professional Medical-Grade PDF Report Generator for Health Predictions
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.platypus import Frame, PageTemplate
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from io import BytesIO

def generate_prediction_report(prediction_data: dict, user_data: dict) -> BytesIO:
    """
    Generate a professional PDF report for disease prediction
    
    Args:
        prediction_data: Dictionary containing prediction results
        user_data: Dictionary containing user information
    
    Returns:
        BytesIO: PDF file in memory
    """
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # Header
    elements.append(Paragraph("🏥 HealthPredict", title_style))
    elements.append(Paragraph("AI-Powered Disease Prediction Report", styles['Heading3']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Report Information Box
    report_info_data = [
        ['Report Generated:', datetime.now().strftime('%B %d, %Y at %I:%M %p')],
        ['Report ID:', prediction_data.get('id', 'N/A')],
        ['Patient Name:', user_data.get('name', 'N/A')],
        ['Patient Email:', user_data.get('email', 'N/A')],
    ]
    
    report_info_table = Table(report_info_data, colWidths=[2*inch, 4*inch])
    report_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1e40af')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#c7d2fe')),
    ]))
    
    elements.append(report_info_table)
    elements.append(Spacer(1, 0.4*inch))
    
    # Prediction Result Section
    elements.append(Paragraph("Prediction Results", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Get prediction details
    disease = prediction_data.get('disease', 'Unknown')
    confidence = prediction_data.get('confidence', 0) * 100
    risk_level = prediction_data.get('risk_level', 'Unknown')
    
    # Risk level color
    risk_colors = {
        'Low': colors.HexColor('#10b981'),
        'Medium': colors.HexColor('#f59e0b'),
        'High': colors.HexColor('#ef4444'),
    }
    risk_color = risk_colors.get(risk_level, colors.HexColor('#6b7280'))
    
    # Prediction summary table
    prediction_summary = [
        ['Predicted Condition:', disease],
        ['Confidence Level:', f'{confidence:.1f}%'],
        ['Risk Assessment:', risk_level],
        ['Prediction Date:', prediction_data.get('created_at', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))],
    ]
    
    prediction_table = Table(prediction_summary, colWidths=[2*inch, 4*inch])
    prediction_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (1, 2), (1, 2), risk_color),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111827')),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
    ]))
    
    elements.append(prediction_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Input Parameters Section
    elements.append(Paragraph("Input Parameters", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    symptoms = prediction_data.get('symptoms', [])
    if symptoms:
        symptoms_text = ", ".join(symptoms)
        elements.append(Paragraph(f"<b>Reported Symptoms:</b> {symptoms_text}", normal_style))
    
    # Additional health metrics if available
    health_metrics = prediction_data.get('health_metrics', {})
    if health_metrics:
        metrics_data = [[k.replace('_', ' ').title(), str(v)] for k, v in health_metrics.items()]
        
        metrics_table = Table(metrics_data, colWidths=[2.5*inch, 3.5*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ]))
        
        elements.append(Spacer(1, 0.1*inch))
        elements.append(metrics_table)
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Recommendations Section
    elements.append(Paragraph("Recommendations", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    recommendations = prediction_data.get('recommendations', [])
    if not recommendations:
        # Default recommendations based on risk level
        if risk_level == 'High':
            recommendations = [
                "Consult with a healthcare professional immediately",
                "Schedule a comprehensive medical examination",
                "Monitor your symptoms closely and keep a health diary",
                "Follow prescribed treatment plans strictly",
                "Maintain regular follow-up appointments"
            ]
        elif risk_level == 'Medium':
            recommendations = [
                "Schedule an appointment with your doctor for evaluation",
                "Monitor your symptoms and note any changes",
                "Maintain a healthy lifestyle with proper diet and exercise",
                "Get adequate rest and manage stress levels",
                "Consider preventive health screenings"
            ]
        else:
            recommendations = [
                "Continue maintaining a healthy lifestyle",
                "Regular health check-ups as per your age group",
                "Stay physically active and eat a balanced diet",
                "Monitor any new or unusual symptoms",
                "Practice stress management and get adequate sleep"
            ]
    
    for i, rec in enumerate(recommendations, 1):
        elements.append(Paragraph(f"{i}. {rec}", normal_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Important Notice
    elements.append(Paragraph("Important Medical Disclaimer", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    disclaimer_text = """
    <b>⚠️ IMPORTANT:</b> This report is generated by an AI-powered prediction system and is intended for 
    informational purposes only. It is <b>NOT</b> a substitute for professional medical advice, diagnosis, 
    or treatment. Always seek the advice of your physician or other qualified health provider with any 
    questions you may have regarding a medical condition. Never disregard professional medical advice or 
    delay in seeking it because of something you have read in this report.
    <br/><br/>
    The predictions are based on machine learning models trained on historical data and may not account 
    for individual variations, recent medical developments, or unique health circumstances. The accuracy 
    of predictions can vary and should be validated by qualified medical professionals.
    <br/><br/>
    In case of a medical emergency, call your local emergency services immediately.
    """
    
    disclaimer_para = Paragraph(disclaimer_text, normal_style)
    disclaimer_table = Table([[disclaimer_para]], colWidths=[6*inch])
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('BORDER', (0, 0), (-1, -1), 2, colors.HexColor('#f59e0b')),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    
    elements.append(disclaimer_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Next Steps
    elements.append(Paragraph("Next Steps", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    next_steps = [
        "Share this report with your healthcare provider during your next visit",
        "Keep this report for your medical records",
        "Track your health progress using the HealthPredict dashboard",
        "Schedule regular health check-ups as recommended by your doctor",
        "Contact us through the website if you have any questions about this report"
    ]
    
    for i, step in enumerate(next_steps, 1):
        elements.append(Paragraph(f"{i}. {step}", normal_style))
    
    elements.append(Spacer(1, 0.4*inch))
    
    # Footer
    footer_data = [
        ['HealthPredict - AI-Powered Health Insights'],
        ['For support, visit: http://localhost:3000/contact'],
        [f'© {datetime.now().year} HealthPredict. All rights reserved.'],
    ]
    
    footer_table = Table(footer_data, colWidths=[6*inch])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#6b7280')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    
    elements.append(footer_table)
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer and return it
    buffer.seek(0)
    return buffer


def generate_report_filename(user_name: str, prediction_id: str) -> str:
    """Generate a standardized filename for the report"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_name = user_name.replace(' ', '_').replace('.', '')
    return f"HealthPredict_Report_{safe_name}_{timestamp}.pdf"
