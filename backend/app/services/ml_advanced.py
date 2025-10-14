"""
Advanced ML Prediction Service
Uses trained high-accuracy model for disease predictions
"""

from typing import List, Dict, Any
import os
import joblib
import json

try:
    import numpy as np
    import pandas as pd
    HAS_ML_STACK = True
except ImportError:
    HAS_ML_STACK = False

class AdvancedMLService:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.feature_names = None
        self.metadata = None
        
        if HAS_ML_STACK:
            self.load_model()
    
    def load_model(self):
        """Load the trained model and associated files"""
        model_path = 'ml_models/disease_prediction_model.pkl'
        encoder_path = 'ml_models/label_encoder.pkl'
        features_path = 'ml_models/feature_names.pkl'
        metadata_path = 'ml_models/model_metadata.json'
        
        try:
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                self.label_encoder = joblib.load(encoder_path)
                self.feature_names = joblib.load(features_path)
                
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                
                print(f"✓ Loaded ML model: {self.metadata['model_name']}")
                print(f"✓ Model accuracy: {self.metadata['accuracy'] * 100:.2f}%")
                print(f"✓ Supports {self.metadata['num_classes']} diseases")
            else:
                print("⚠ No trained model found. Please run train_model.py first.")
                print("  Using fallback rule-based predictions.")
        except Exception as e:
            print(f"⚠ Error loading model: {e}")
            print("  Using fallback rule-based predictions.")
    
    async def predict_diseases(
        self,
        symptoms: List[Dict[str, str]],
        additional_info: str = "",
        age: int = None,
        gender: str = None,
        medical_history: List[str] = []
    ) -> List[Dict[str, Any]]:
        """Predict diseases based on symptoms using trained ML model"""
        
        if not HAS_ML_STACK or self.model is None:
            return self._rule_based_predictions(symptoms)
        
        try:
            # Prepare input features
            symptom_vector = self._create_symptom_vector(symptoms)
            
            # Get predictions with probabilities
            predictions_proba = self.model.predict_proba([symptom_vector])[0]
            
            # Get top 5 predictions
            top_indices = np.argsort(predictions_proba)[-5:][::-1]
            
            results = []
            for idx in top_indices:
                confidence = float(predictions_proba[idx])
                
                # Only include predictions with >5% confidence
                if confidence > 0.05:
                    disease_name = self.label_encoder.inverse_transform([idx])[0]
                    
                    results.append({
                        'disease_name': disease_name,
                        'confidence_score': confidence,
                        'description': self._get_disease_description(disease_name),
                        'severity': self._get_disease_severity(disease_name),
                        'recommended_actions': self._get_recommended_actions(disease_name)
                    })
            
            return results
            
        except Exception as e:
            print(f"Error in ML prediction: {e}")
            return self._rule_based_predictions(symptoms)
    
    def _create_symptom_vector(self, symptoms: List[Dict[str, str]]) -> List[int]:
        """Create a feature vector from symptoms"""
        # Initialize vector with zeros
        symptom_vector = [0] * len(self.feature_names)
        
        # Set 1 for present symptoms
        for symptom in symptoms:
            symptom_name = symptom.get('name', '').strip()
            
            # Try exact match
            if symptom_name in self.feature_names:
                idx = self.feature_names.index(symptom_name)
                symptom_vector[idx] = 1
            else:
                # Try case-insensitive match
                for i, feature in enumerate(self.feature_names):
                    if feature.lower() == symptom_name.lower():
                        symptom_vector[i] = 1
                        break
        
        return symptom_vector
    
    def _rule_based_predictions(self, symptoms: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Fallback rule-based predictions when ML model is not available"""
        mapping = {
            # Respiratory
            'fever': [('Influenza (Flu)', 0.75), ('Common Cold', 0.55), ('COVID-19', 0.60)],
            'cough': [('Common Cold', 0.65), ('Bronchitis', 0.55), ('Pneumonia', 0.45)],
            'shortness of breath': [('Pneumonia', 0.70), ('Asthma', 0.65), ('COVID-19', 0.60)],
            'chest pain': [('Pneumonia', 0.65), ('Hypertension', 0.45)],
            'sore throat': [('Common Cold', 0.60), ('Sinusitis', 0.45)],
            'runny nose': [('Allergic Rhinitis', 0.70), ('Common Cold', 0.50)],
            'sneezing': [('Allergic Rhinitis', 0.70), ('Common Cold', 0.50)],
            'congestion': [('Sinusitis', 0.65), ('Common Cold', 0.55)],
            'wheezing': [('Asthma', 0.80)],
            'difficulty breathing': [('Asthma', 0.75), ('Pneumonia', 0.65)],
            
            # General
            'fatigue': [('Influenza (Flu)', 0.60), ('COVID-19', 0.55), ('Diabetes', 0.45)],
            'weakness': [('Influenza (Flu)', 0.55), ('Diabetes', 0.50)],
            'chills': [('Influenza (Flu)', 0.65)],
            'sweating': [('Influenza (Flu)', 0.50), ('Tuberculosis', 0.55)],
            'night sweats': [('Tuberculosis', 0.70)],
            'loss of appetite': [('Gastroenteritis', 0.55), ('Depression', 0.45)],
            'weight loss': [('Diabetes', 0.65), ('Tuberculosis', 0.55)],
            'weight gain': [('Hypertension', 0.40), ('Diabetes', 0.35)],
            'dehydration': [('Gastroenteritis', 0.70)],
            
            # Pain
            'headache': [('Migraine', 0.70), ('Sinusitis', 0.50), ('Hypertension', 0.45)],
            'muscle pain': [('Influenza (Flu)', 0.65)],
            'joint pain': [('Arthritis', 0.70)],
            'back pain': [('Arthritis', 0.55), ('Urinary Tract Infection', 0.50)],
            'neck pain': [('Arthritis', 0.50)],
            'abdominal pain': [('Gastroenteritis', 0.65), ('Urinary Tract Infection', 0.45)],
            'pelvic pain': [('Urinary Tract Infection', 0.60)],
            'ear pain': [('Sinusitis', 0.55)],
            'tooth pain': [('Sinusitis', 0.40)],
            
            # Digestive
            'nausea': [('Gastroenteritis', 0.75), ('Migraine', 0.50)],
            'vomiting': [('Gastroenteritis', 0.75)],
            'diarrhea': [('Gastroenteritis', 0.75)],
            'constipation': [('Gastroenteritis', 0.40)],
            'bloating': [('Gastroenteritis', 0.50)],
            'heartburn': [('Gastroenteritis', 0.45)],
            'acid reflux': [('Gastroenteritis', 0.50)],
            'blood in stool': [('Gastroenteritis', 0.60)],
            'difficulty swallowing': [('Sinusitis', 0.45)],
            
            # Skin
            'itching': [('Allergic Rhinitis', 0.75), ('Skin Infection', 0.60)],
            'skin rash': [('Skin Infection', 0.75), ('Allergic Rhinitis', 0.55)],
            'hives': [('Allergic Rhinitis', 0.80)],
            'dry skin': [('Skin Infection', 0.40)],
            'pale skin': [('Diabetes', 0.35)],
            'yellowing of skin': [('Diabetes', 0.50)],
            'bruising': [('Hypertension', 0.35)],
            'swelling': [('Allergic Rhinitis', 0.55)],
            'redness': [('Skin Infection', 0.60)],
            
            # Neurological
            'dizziness': [('Hypertension', 0.60), ('Migraine', 0.45)],
            'confusion': [('Hypertension', 0.45)],
            'memory loss': [('Depression', 0.40)],
            'numbness': [('Diabetes', 0.55)],
            'tingling': [('Diabetes', 0.55)],
            'tremors': [('Anxiety Disorder', 0.50)],
            'seizures': [('Hypertension', 0.40)],
            'loss of consciousness': [('Hypertension', 0.50)],
            'fainting': [('Hypertension', 0.55)],
            'difficulty concentrating': [('Anxiety Disorder', 0.50), ('Depression', 0.45)],
            'slurred speech': [('Hypertension', 0.45)],
            
            # Mental Health
            'anxiety': [('Anxiety Disorder', 0.80)],
            'depression': [('Depression', 0.80)],
            'mood swings': [('Depression', 0.60), ('Anxiety Disorder', 0.50)],
            'irritability': [('Anxiety Disorder', 0.55)],
            'insomnia': [('Anxiety Disorder', 0.60), ('Depression', 0.55)],
            'restlessness': [('Anxiety Disorder', 0.65)],
            'panic attacks': [('Anxiety Disorder', 0.85)],
            
            # Cardiovascular
            'irregular heartbeat': [('Hypertension', 0.70)],
            'rapid heartbeat': [('Anxiety Disorder', 0.60), ('Hypertension', 0.55)],
            'chest tightness': [('Asthma', 0.65), ('Hypertension', 0.50)],
            'high blood pressure': [('Hypertension', 0.90)],
            'low blood pressure': [('Hypertension', 0.70)],
            'palpitations': [('Anxiety Disorder', 0.60), ('Hypertension', 0.55)],
            
            # Sensory
            'blurred vision': [('Diabetes', 0.60), ('Migraine', 0.50)],
            'double vision': [('Migraine', 0.55)],
            'sensitivity to light': [('Migraine', 0.75)],
            'eye pain': [('Migraine', 0.50)],
            'ringing in ears': [('Hypertension', 0.45)],
            'hearing loss': [('Sinusitis', 0.40)],
            'loss of smell': [('COVID-19', 0.70), ('Sinusitis', 0.50)],
            'loss of taste': [('COVID-19', 0.70)],
            
            # Urinary
            'frequent urination': [('Diabetes', 0.70), ('Urinary Tract Infection', 0.65)],
            'painful urination': [('Urinary Tract Infection', 0.80)],
            'blood in urine': [('Urinary Tract Infection', 0.75)],
            'difficulty urinating': [('Urinary Tract Infection', 0.60)],
            'incontinence': [('Urinary Tract Infection', 0.50)],
            
            # Other
            'excessive thirst': [('Diabetes', 0.75)],
            'dry mouth': [('Diabetes', 0.55)],
            'bad breath': [('Sinusitis', 0.40)],
            'hair loss': [('Anxiety Disorder', 0.35)],
            'brittle nails': [('Diabetes', 0.30)],
            'swollen lymph nodes': [('Influenza (Flu)', 0.50)],
            'stiff neck': [('Migraine', 0.45)],
            'leg cramps': [('Diabetes', 0.45)]
        }
        
        preds: List[Dict[str, Any]] = []
        for s in symptoms:
            name = s.get('name', '').lower().strip()
            for disease_name, score in mapping.get(name, []):
                preds.append({
                    'disease_name': disease_name,
                    'confidence_score': score,
                    'description': self._get_disease_description(disease_name),
                    'severity': self._get_disease_severity(disease_name),
                    'recommended_actions': self._get_recommended_actions(disease_name)
                })
        
        # Deduplicate and keep highest score
        best: Dict[str, Dict[str, Any]] = {}
        for p in preds:
            dn = p['disease_name']
            if dn not in best or p['confidence_score'] > best[dn]['confidence_score']:
                best[dn] = p
        
        return sorted(best.values(), key=lambda x: x['confidence_score'], reverse=True)[:5]
    
    def _get_disease_description(self, disease: str) -> str:
        """Get disease description"""
        descriptions = {
            'Common Cold': 'A viral infection of the upper respiratory tract causing mild symptoms',
            'Influenza (Flu)': 'A contagious respiratory illness caused by influenza viruses',
            'COVID-19': 'A respiratory illness caused by the SARS-CoV-2 virus',
            'Pneumonia': 'An infection that inflames air sacs in one or both lungs',
            'Bronchitis': 'Inflammation of the bronchial tubes carrying air to lungs',
            'Asthma': 'A chronic condition affecting airways in the lungs',
            'Allergic Rhinitis': 'Allergic response causing nasal inflammation and symptoms',
            'Gastroenteritis': 'Inflammation of the digestive tract causing stomach upset',
            'Migraine': 'A neurological condition causing intense headaches',
            'Hypertension': 'Persistently elevated blood pressure in arteries',
            'Diabetes': 'A metabolic disorder affecting blood sugar regulation',
            'Urinary Tract Infection': 'Infection in any part of the urinary system',
            'Sinusitis': 'Inflammation or swelling of sinus tissue',
            'Arthritis': 'Inflammation of joints causing pain and stiffness',
            'Anxiety Disorder': 'Mental health condition causing excessive worry',
            'Depression': 'Mood disorder causing persistent sadness',
            'Skin Infection': 'Bacterial, viral, or fungal infection of the skin',
            'Tuberculosis': 'Serious bacterial infection primarily affecting lungs'
        }
        return descriptions.get(disease, 'A medical condition requiring professional evaluation')
    
    def _get_disease_severity(self, disease: str) -> str:
        """Get disease severity"""
        severity_map = {
            'Common Cold': 'mild',
            'Influenza (Flu)': 'moderate',
            'COVID-19': 'moderate',
            'Pneumonia': 'severe',
            'Bronchitis': 'moderate',
            'Asthma': 'moderate',
            'Allergic Rhinitis': 'mild',
            'Gastroenteritis': 'moderate',
            'Migraine': 'moderate',
            'Hypertension': 'moderate',
            'Diabetes': 'severe',
            'Urinary Tract Infection': 'moderate',
            'Sinusitis': 'mild',
            'Arthritis': 'moderate',
            'Anxiety Disorder': 'moderate',
            'Depression': 'moderate',
            'Skin Infection': 'mild',
            'Tuberculosis': 'severe'
        }
        return severity_map.get(disease, 'moderate')
    
    def _get_recommended_actions(self, disease: str) -> List[str]:
        """Get recommended actions"""
        actions = {
            'Common Cold': [
                'Rest and stay hydrated',
                'Use over-the-counter cold medications',
                'Gargle with warm salt water'
            ],
            'Influenza (Flu)': [
                'Rest and drink plenty of fluids',
                'Consider antiviral medications within 48 hours',
                'Monitor for complications'
            ],
            'COVID-19': [
                'Self-isolate immediately',
                'Monitor oxygen levels',
                'Seek medical attention if breathing worsens',
                'Stay hydrated and rest'
            ],
            'Pneumonia': [
                'Seek immediate medical attention',
                'Take prescribed antibiotics as directed',
                'Get plenty of rest and fluids'
            ],
            'Gastroenteritis': [
                'Stay hydrated with clear fluids',
                'Avoid solid foods initially',
                'Rest and avoid dairy temporarily'
            ],
            'Migraine': [
                'Rest in a dark, quiet room',
                'Apply cold compress to head',
                'Take prescribed migraine medications'
            ],
            'Asthma': [
                'Use prescribed inhaler',
                'Avoid known triggers',
                'Monitor breathing closely'
            ],
            'Allergic Rhinitis': [
                'Avoid allergens',
                'Use antihistamines',
                'Consider allergy testing'
            ],
            'Skin Infection': [
                'Keep area clean and dry',
                'Apply prescribed topical treatment',
                'Avoid scratching',
                'See dermatologist if persistent'
            ]
        }
        return actions.get(disease, [
            'Consult with a healthcare professional',
            'Monitor symptoms closely',
            'Seek medical attention if symptoms worsen'
        ])
