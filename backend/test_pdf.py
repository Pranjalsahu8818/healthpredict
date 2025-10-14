"""
Simple test to verify PDF generation works
"""
from app.services.report_generator import generate_prediction_report, generate_report_filename
from datetime import datetime

# Test data
prediction_data = {
    'id': 'test-123',
    'disease': 'Diabetes',
    'confidence': 0.925,
    'risk_level': 'High',
    'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'symptoms': ['Increased thirst', 'Frequent urination', 'Fatigue'],
    'health_metrics': {'age': 45, 'bmi': 28.5},
    'recommendations': [
        'Consult with a healthcare professional immediately',
        'Schedule a comprehensive medical examination',
        'Monitor your symptoms closely'
    ]
}

user_data = {
    'name': 'Test User',
    'email': 'test@example.com'
}

print("Testing PDF generation...")
print("=" * 60)

try:
    # Generate PDF
    pdf_buffer = generate_prediction_report(prediction_data, user_data)
    
    # Save to file
    filename = generate_report_filename(user_data['name'], prediction_data['id'])
    with open(filename, 'wb') as f:
        f.write(pdf_buffer.read())
    
    print(f"✅ SUCCESS! PDF generated: {filename}")
    print(f"File size: {len(open(filename, 'rb').read())} bytes")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
