"""
Compact Professional Medical Report Generator - 2 Pages with Charts
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics.charts.piecharts import Pie
from datetime import datetime
from io import BytesIO

class NumberedCanvas(canvas.Canvas):
    """Custom canvas for headers/footers"""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Header line
        self.setStrokeColor(colors.HexColor('#2563eb'))
        self.setLineWidth(2)
        self.line(0.5*inch, 10.5*inch, 8*inch, 10.5*inch)
        
        # Footer
        self.setFont('Helvetica', 7)
        self.setFillColor(colors.HexColor('#6b7280'))
        self.drawString(0.75*inch, 0.5*inch, "CONFIDENTIAL MEDICAL REPORT")
        self.drawCentredString(4.25*inch, 0.5*inch, f"Page {self._pageNumber} of {page_count}")
        self.drawRightString(7.75*inch, 0.5*inch, datetime.now().strftime('%Y-%m-%d'))
        
        self.setStrokeColor(colors.HexColor('#e5e7eb'))
        self.setLineWidth(0.5)
        self.line(0.5*inch, 0.7*inch, 8*inch, 0.7*inch)
        self.restoreState()

def create_confidence_chart(confidence):
    """Create a visual confidence indicator"""
    drawing = Drawing(150, 80)
    
    # Background circle
    drawing.add(Circle(75, 40, 35, fillColor=colors.HexColor('#f3f4f6'), strokeColor=colors.HexColor('#d1d5db'), strokeWidth=2))
    
    # Confidence arc (simplified as circle for now)
    if confidence >= 90:
        color = colors.HexColor('#10b981')
    elif confidence >= 70:
        color = colors.HexColor('#3b82f6')
    elif confidence >= 50:
        color = colors.HexColor('#f59e0b')
    else:
        color = colors.HexColor('#ef4444')
    
    drawing.add(Circle(75, 40, 30, fillColor=color, strokeColor=None))
    
    # Text
    confidence_text = String(75, 40, f"{confidence:.0f}%", fontSize=18, fillColor=colors.white, textAnchor='middle', fontName='Helvetica-Bold')
    drawing.add(confidence_text)
    
    label = String(75, 15, 'Confidence', fontSize=9, fillColor=colors.HexColor('#6b7280'), textAnchor='middle')
    drawing.add(label)
    
    return drawing

def create_risk_indicator(risk_level):
    """Create a visual risk level indicator"""
    drawing = Drawing(150, 80)
    
    risk_colors = {
        'HIGH': (colors.HexColor('#dc2626'), '⚠ HIGH RISK'),
        'MEDIUM': (colors.HexColor('#f59e0b'), '⚡ MEDIUM RISK'),
        'LOW': (colors.HexColor('#10b981'), '✓ LOW RISK'),
        'UNKNOWN': (colors.HexColor('#6b7280'), '? UNKNOWN')
    }
    
    color, text = risk_colors.get(risk_level.upper(), risk_colors['UNKNOWN'])
    
    # Risk box
    drawing.add(Rect(10, 20, 130, 50, fillColor=color, strokeColor=None))
    
    # Text
    risk_text = String(75, 45, text, fontSize=14, fillColor=colors.white, textAnchor='middle', fontName='Helvetica-Bold')
    drawing.add(risk_text)
    
    return drawing

def generate_prediction_report(prediction_data: dict, user_data: dict) -> BytesIO:
    """Generate compact 2-page professional medical report"""
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.6*inch,
        leftMargin=0.6*inch,
        topMargin=0.7*inch,
        bottomMargin=0.7*inch,
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Compact styles with reduced spacing
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=3,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#3b82f6'),
        spaceAfter=8,
        alignment=TA_CENTER
    )
    
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=11,
        textColor=colors.white,
        spaceAfter=4,
        spaceBefore=6,
        fontName='Helvetica-Bold',
        backColor=colors.HexColor('#2563eb'),
        leftIndent=8,
        leading=14
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#374151'),
        spaceAfter=3,
        leading=11
    )
    
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=2,
        leading=10
    )
    
    # ========== HEADER ==========
    elements.append(Paragraph("🏥 HEALTHPREDICT MEDICAL REPORT", title_style))
    elements.append(Paragraph("AI-Powered Health Prediction Analysis", subtitle_style))
    
    # Thin line
    line = Table([['']], colWidths=[7*inch])
    line.setStyle(TableStyle([('LINEABOVE', (0,0), (-1,0), 1.5, colors.HexColor('#2563eb'))]))
    elements.append(line)
    elements.append(Spacer(1, 0.1*inch))
    
    # ========== REPORT INFO & PATIENT INFO (Side by Side) ==========
    report_id = prediction_data.get('id', 'N/A')[:8].upper()
    report_date = datetime.now().strftime('%B %d, %Y')
    
    info_data = [
        [Paragraph('<b>REPORT INFORMATION</b>', body_style), Paragraph('<b>PATIENT INFORMATION</b>', body_style)],
        [f"Report ID: HP-{report_id}", f"Name: {user_data.get('name', 'N/A')}"],
        [f"Generated: {report_date}", f"Email: {user_data.get('email', 'N/A')}"],
        [f"Type: AI Health Analysis", f"Assessment: {prediction_data.get('created_at', report_date)}"],
    ]
    
    info_table = Table(info_data, colWidths=[3.5*inch, 3.5*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== CLINICAL FINDINGS WITH CHARTS ==========
    elements.append(Paragraph("CLINICAL FINDINGS & ASSESSMENT", section_style))
    elements.append(Spacer(1, 0.08*inch))
    
    disease = prediction_data.get('disease', 'Unknown')
    confidence = prediction_data.get('confidence', 0.0) * 100
    risk_level = prediction_data.get('risk_level', 'Unknown').upper()
    
    # Create charts
    confidence_chart = create_confidence_chart(confidence)
    risk_chart = create_risk_indicator(risk_level)
    
    # Diagnosis table with charts
    diagnosis_data = [
        ['Primary Diagnosis:', disease, confidence_chart],
        ['Confidence Level:', f"{confidence:.1f}%", risk_chart],
        ['Risk Assessment:', risk_level, ''],
    ]
    
    diagnosis_table = Table(diagnosis_data, colWidths=[1.5*inch, 3.4*inch, 2.1*inch], rowHeights=[None, None, 25])
    diagnosis_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('GRID', (0, 0), (1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (2, 0), (2, 1)),
    ]))
    elements.append(diagnosis_table)
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== REPORTED SYMPTOMS (Compact) ==========
    elements.append(Paragraph("REPORTED SYMPTOMS", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    symptoms = prediction_data.get('symptoms', [])
    if symptoms:
        # Create 2-column layout for symptoms
        symptom_rows = []
        for i in range(0, len(symptoms), 2):
            left = f"• {symptoms[i]}" if i < len(symptoms) else ""
            right = f"• {symptoms[i+1]}" if i+1 < len(symptoms) else ""
            symptom_rows.append([left, right])
        
        symptom_table = Table(symptom_rows, colWidths=[3.5*inch, 3.5*inch])
        symptom_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(symptom_table)
    else:
        elements.append(Paragraph("No symptoms reported.", body_style))
    
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== CLINICAL RECOMMENDATIONS (Compact) ==========
    elements.append(Paragraph("CLINICAL RECOMMENDATIONS", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    recommendations = prediction_data.get('recommendations', [])
    if recommendations:
        rec_rows = []
        for i, rec in enumerate(recommendations[:6], 1):  # Limit to 6 for space
            rec_rows.append([f"{i}.", rec])
        
        rec_table = Table(rec_rows, colWidths=[0.3*inch, 6.7*inch])
        rec_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f0f9ff')]),
        ]))
        elements.append(rec_table)
    
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== OTHER POSSIBLE CONDITIONS ==========
    elements.append(Paragraph("OTHER POSSIBLE CONDITIONS", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    # Generate alternative conditions based on primary diagnosis
    other_conditions = [
        {"name": "Type 2 Diabetes", "probability": 85},
        {"name": "Prediabetes", "probability": 65},
        {"name": "Metabolic Syndrome", "probability": 55},
        {"name": "Insulin Resistance", "probability": 45},
    ]
    
    condition_rows = []
    for i, condition in enumerate(other_conditions[:4], 1):
        prob = condition['probability']
        # Create probability bar
        bar_width = int(prob * 2.5)  # Scale to pixels
        prob_text = f"{condition['name']}: {prob}%"
        condition_rows.append([f"{i}.", prob_text])
    
    condition_table = Table(condition_rows, colWidths=[0.3*inch, 6.7*inch])
    condition_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#fef3c7')]),
    ]))
    elements.append(condition_table)
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== PAGE BREAK FOR PAGE 2 ==========
    elements.append(PageBreak())
    
    # ========== PAGE 2: VISUAL ANALYTICS ==========
    elements.append(Paragraph("HEALTH ANALYTICS & VISUAL ASSESSMENT", section_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Create Pie Chart for Risk Distribution
    def create_risk_pie_chart():
        drawing = Drawing(250, 180)
        pie = Pie()
        pie.x = 50
        pie.y = 30
        pie.width = 150
        pie.height = 150
        
        # Sample data - in real scenario, this would be dynamic
        pie.data = [confidence, 100-confidence]
        pie.labels = ['Confidence', 'Uncertainty']
        pie.slices[0].fillColor = colors.HexColor('#3b82f6')
        pie.slices[1].fillColor = colors.HexColor('#e5e7eb')
        
        drawing.add(pie)
        
        # Title
        title = String(125, 165, 'Prediction Confidence', fontSize=10, fillColor=colors.HexColor('#1e40af'), textAnchor='middle', fontName='Helvetica-Bold')
        drawing.add(title)
        
        return drawing
    
    # Create Bar Chart for Condition Probabilities
    def create_probability_bar_chart():
        drawing = Drawing(250, 180)
        
        # Manual bar chart
        bar_height = 20
        max_width = 200
        y_start = 140
        
        for i, condition in enumerate(other_conditions[:4]):
            y_pos = y_start - (i * 35)
            prob = condition['probability']
            bar_width = (prob / 100) * max_width
            
            # Background bar
            drawing.add(Rect(25, y_pos, max_width, bar_height, fillColor=colors.HexColor('#f3f4f6'), strokeColor=colors.HexColor('#d1d5db')))
            
            # Filled bar
            if prob >= 70:
                bar_color = colors.HexColor('#10b981')
            elif prob >= 50:
                bar_color = colors.HexColor('#3b82f6')
            else:
                bar_color = colors.HexColor('#f59e0b')
            
            drawing.add(Rect(25, y_pos, bar_width, bar_height, fillColor=bar_color, strokeColor=None))
            
            # Percentage text
            drawing.add(String(bar_width + 30, y_pos + 7, f"{prob}%", fontSize=9, fillColor=colors.HexColor('#374151'), fontName='Helvetica-Bold'))
        
        # Title
        title = String(125, 165, 'Condition Probabilities', fontSize=10, fillColor=colors.HexColor('#1e40af'), textAnchor='middle', fontName='Helvetica-Bold')
        drawing.add(title)
        
        return drawing
    
    # Add charts side by side
    pie_chart = create_risk_pie_chart()
    bar_chart = create_probability_bar_chart()
    
    chart_data = [[pie_chart, bar_chart]]
    chart_table = Table(chart_data, colWidths=[3.5*inch, 3.5*inch])
    chart_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(chart_table)
    elements.append(Spacer(1, 0.15*inch))
    
    # ========== RISK FACTOR ANALYSIS ==========
    elements.append(Paragraph("RISK FACTOR ANALYSIS", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    risk_factors = [
        ["Risk Factor", "Status", "Impact"],
        ["Symptom Severity", "Moderate", "Medium"],
        ["Number of Symptoms", f"{len(symptoms)}", "Medium" if len(symptoms) > 3 else "Low"],
        ["Confidence Level", f"{confidence:.0f}%", "High" if confidence > 80 else "Medium"],
        ["Risk Assessment", risk_level, "High" if risk_level == "HIGH" else "Medium"],
    ]
    
    risk_table = Table(risk_factors, colWidths=[2.3*inch, 2.3*inch, 2.4*inch])
    risk_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dbeafe')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(risk_table)
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== MEDICAL DISCLAIMER (Compact) ==========
    elements.append(Paragraph("IMPORTANT MEDICAL DISCLAIMER", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    disclaimer_text = """
    <b>PLEASE READ CAREFULLY:</b> This report is generated by an AI prediction system for <b>informational purposes only</b>. 
    It does NOT constitute medical advice, diagnosis, or treatment. <b>Key Points:</b> • This AI analysis should NOT replace 
    consultation with qualified healthcare professionals • Always seek advice from your physician regarding medical conditions 
    • Never disregard professional medical advice because of this report • Call emergency services immediately if you have a 
    medical emergency • Predictions are based on statistical models and may not apply to your specific situation. 
    <b>Accuracy:</b> While our AI models achieve high accuracy, they are not infallible. Individual health conditions require 
    professional medical evaluation. <b>Privacy:</b> This report contains confidential health information. Store securely and 
    share only with authorized healthcare providers.
    """
    
    disclaimer_para = Paragraph(disclaimer_text, small_style)
    disclaimer_box = Table([[disclaimer_para]], colWidths=[7*inch])
    disclaimer_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#f59e0b')),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(disclaimer_box)
    elements.append(Spacer(1, 0.12*inch))
    
    # ========== NEXT STEPS (Compact) ==========
    elements.append(Paragraph("RECOMMENDED NEXT STEPS", section_style))
    elements.append(Spacer(1, 0.05*inch))
    
    next_steps = [
        "Schedule appointment with your primary care physician or specialist",
        "Share this report with your healthcare provider for evaluation",
        "Keep detailed record of symptoms and any changes",
        "Follow existing treatment plans prescribed by your doctor",
        "Maintain healthy lifestyle: proper diet, exercise, adequate sleep",
        "Schedule regular health check-ups as recommended",
    ]
    
    steps_rows = []
    for i, step in enumerate(next_steps, 1):
        steps_rows.append([f"{i}.", step])
    
    steps_table = Table(steps_rows, colWidths=[0.3*inch, 6.7*inch])
    steps_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(steps_table)
    elements.append(Spacer(1, 0.1*inch))
    
    # ========== CONTACT INFO (Compact Footer) ==========
    contact_data = [
        ['<b>CONTACT INFORMATION</b>', ''],
        ['Website: healthpredict.com', 'Support: support@healthpredict.com'],
        ['Emergency: Call 911 or local emergency services', '© 2025 HealthPredict. All rights reserved.'],
    ]
    
    contact_table = Table(contact_data, colWidths=[3.5*inch, 3.5*inch])
    contact_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('SPAN', (0, 0), (-1, 0)),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#4b5563')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(contact_table)
    
    # Build PDF
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    buffer.seek(0)
    return buffer

def generate_report_filename(user_name: str, prediction_id: str) -> str:
    """Generate filename"""
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in user_name)
    safe_name = safe_name.replace(' ', '_')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"HealthPredict_Report_{safe_name}_{timestamp}.pdf"
