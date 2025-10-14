from typing import List, Dict, Any
import os

# Optional heavy ML dependencies. For local runs on Windows without build tools,
# we gracefully degrade to a simple rule-based predictor.
try:
    import numpy as np  # type: ignore
    import pandas as pd  # type: ignore
    from sklearn.ensemble import RandomForestClassifier  # type: ignore
    from sklearn.preprocessing import LabelEncoder  # type: ignore
    import joblib  # type: ignore
    HAS_ML_STACK = True
except Exception:
    np = None  # type: ignore
    pd = None  # type: ignore
    RandomForestClassifier = None  # type: ignore
    LabelEncoder = None  # type: ignore
    joblib = None  # type: ignore
    HAS_ML_STACK = False

class MLPredictionService:
    def __init__(self):
        self.model = None
        self.symptom_encoder = LabelEncoder() if HAS_ML_STACK else None
        self.disease_encoder = LabelEncoder() if HAS_ML_STACK else None
        if HAS_ML_STACK:
            self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load existing model or train a new one"""
        model_path = "ml_models/disease_prediction_model.pkl"
        
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                print("Loaded existing ML model")
            except Exception as e:
                print(f"Failed to load model: {e}")
                self.train_model()
        else:
            self.train_model()
    
    def train_model(self):
        """Train a new disease prediction model"""
        if not HAS_ML_STACK:
            # No-op if ML stack is unavailable
            print("ML stack not available; using rule-based predictions.")
            return
        print("Training new ML model...")
        
        # Sample training data (in production, this would come from a real medical dataset)
        training_data = self.generate_sample_training_data()
        
        # Prepare features and labels
        X = training_data[['symptom_encoded', 'severity_encoded', 'duration_encoded']]
        y = training_data['disease_encoded']
        
        # Train Random Forest model
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        
        self.model.fit(X, y)
        
        # Save model
        os.makedirs("ml_models", exist_ok=True)
        joblib.dump(self.model, model_path)
        print("Model trained and saved successfully")
    
    def generate_sample_training_data(self):
        """Generate sample training data for demonstration"""
        # This is simplified sample data - in production, use real medical datasets
        
        symptoms = [
            'fever', 'headache', 'cough', 'fatigue', 'nausea', 'vomiting',
            'diarrhea', 'abdominal_pain', 'chest_pain', 'shortness_of_breath',
            'sore_throat', 'runny_nose', 'muscle_aches', 'chills', 'sweating'
        ]
        
        diseases = [
            'common_cold', 'flu', 'gastroenteritis', 'pneumonia', 'migraine',
            'hypertension', 'diabetes', 'anxiety', 'depression', 'allergies'
        ]
        
        severities = ['mild', 'moderate', 'severe']
        durations = ['hours', 'days', 'weeks', 'months']
        
        # Generate sample data
        data = []
        for _ in range(1000):
            symptom = np.random.choice(symptoms)
            disease = np.random.choice(diseases)
            severity = np.random.choice(severities)
            duration = np.random.choice(durations)
            
            # Add some logic to make predictions more realistic
            if symptom in ['fever', 'cough', 'fatigue'] and disease in ['flu', 'common_cold']:
                confidence = np.random.uniform(0.6, 0.9)
            elif symptom in ['nausea', 'vomiting', 'diarrhea'] and disease == 'gastroenteritis':
                confidence = np.random.uniform(0.7, 0.9)
            else:
                confidence = np.random.uniform(0.1, 0.6)
            
            data.append({
                'symptom': symptom,
                'disease': disease,
                'severity': severity,
                'duration': duration,
                'confidence': confidence
            })
        
        if not HAS_ML_STACK:
            return None
        df = pd.DataFrame(data)
        
        # Encode categorical variables
        df['symptom_encoded'] = self.symptom_encoder.fit_transform(df['symptom'])
        df['disease_encoded'] = self.disease_encoder.fit_transform(df['disease'])
        df['severity_encoded'] = LabelEncoder().fit_transform(df['severity'])
        df['duration_encoded'] = LabelEncoder().fit_transform(df['duration'])
        
        return df
    
    async def predict_diseases(
        self,
        symptoms: List[Dict[str, str]],
        additional_info: str = "",
        age: int = None,
        gender: str = None,
        medical_history: List[str] = []
    ) -> List[Dict[str, Any]]:
        """Predict diseases based on symptoms"""
        
        if not HAS_ML_STACK or not self.model:
            # Rule-based fallback when ML stack isn't available
            return self._rule_based_predictions(symptoms)
        
        # Prepare input features
        predictions = []
        
        for symptom in symptoms:
            try:
                # Encode symptom
                symptom_encoded = self.symptom_encoder.transform([symptom['name']])[0]
                severity_encoded = self._encode_severity(symptom['severity'])
                duration_encoded = self._encode_duration(symptom['duration'])
                
                # Make prediction
                X = np.array([[symptom_encoded, severity_encoded, duration_encoded]])
                prediction_proba = self.model.predict_proba(X)[0]
                
                # Get top predictions
                top_indices = np.argsort(prediction_proba)[-3:][::-1]  # Top 3
                
                for idx in top_indices:
                    if prediction_proba[idx] > 0.1:  # Only include predictions with >10% confidence
                        disease_name = self.disease_encoder.inverse_transform([idx])[0]
                        
                        predictions.append({
                            'disease_name': disease_name.replace('_', ' ').title(),
                            'confidence_score': float(prediction_proba[idx]),
                            'description': self._get_disease_description(disease_name),
                            'severity': self._get_disease_severity(disease_name),
                            'recommended_actions': self._get_recommended_actions(disease_name)
                        })
                
            except Exception as e:
                print(f"Error processing symptom {symptom['name']}: {e}")
                continue
        
        # Remove duplicates and sort by confidence
        unique_predictions = {}
        for pred in predictions:
            disease = pred['disease_name']
            if disease not in unique_predictions or pred['confidence_score'] > unique_predictions[disease]['confidence_score']:
                unique_predictions[disease] = pred
        
        # Sort by confidence score
        sorted_predictions = sorted(
            unique_predictions.values(),
            key=lambda x: x['confidence_score'],
            reverse=True
        )
        
        return sorted_predictions[:5]  # Return top 5 predictions

    def _rule_based_predictions(self, symptoms: List[Dict[str, str]]):
        mapping = {
            'fever': [('Flu', 0.7), ('Common Cold', 0.5)],
            'cough': [('Common Cold', 0.6), ('Pneumonia', 0.4)],
            'fatigue': [('Flu', 0.5), ('Anxiety', 0.3)],
            'nausea': [('Gastroenteritis', 0.7)],
            'vomiting': [('Gastroenteritis', 0.7)],
            'diarrhea': [('Gastroenteritis', 0.7)],
            'chest_pain': [('Pneumonia', 0.6)],
            'headache': [('Migraine', 0.6)],
            'shortness_of_breath': [('Pneumonia', 0.7), ('Asthma', 0.6)],
            'sore_throat': [('Common Cold', 0.5)],
            'runny_nose': [('Allergies', 0.5)],
            'itching': [('Allergies', 0.7), ('Skin Condition', 0.5)],
            'skin_rash': [('Allergies', 0.7), ('Skin Condition', 0.6)],
            'skin rash': [('Allergies', 0.7), ('Skin Condition', 0.6)],
            'muscle_pain': [('Flu', 0.6)],
            'joint_pain': [('Arthritis', 0.6)],
            'dizziness': [('Hypertension', 0.5)],
            'sweating': [('Flu', 0.4)],
            'chills': [('Flu', 0.6)],
            'abdominal_pain': [('Gastroenteritis', 0.6)],
            'back_pain': [('Muscle Strain', 0.5)],
            'neck_pain': [('Muscle Strain', 0.5)],
            'loss_of_appetite': [('Gastroenteritis', 0.5)],
            'weight_loss': [('Diabetes', 0.4)]
        }
        preds: List[Dict[str, Any]] = []
        for s in symptoms:
            name = s.get('name', '').lower()
            for disease_name, score in mapping.get(name, []):
                preds.append({
                    'disease_name': disease_name,
                    'confidence_score': score,
                    'description': self._get_disease_description(disease_name.replace(' ', '_').lower()),
                    'severity': self._get_disease_severity(disease_name.replace(' ', '_').lower()),
                    'recommended_actions': self._get_recommended_actions(disease_name.replace(' ', '_').lower())
                })
        # Deduplicate by disease keeping highest score
        best: Dict[str, Dict[str, Any]] = {}
        for p in preds:
            dn = p['disease_name']
            if dn not in best or p['confidence_score'] > best[dn]['confidence_score']:
                best[dn] = p
        return sorted(best.values(), key=lambda x: x['confidence_score'], reverse=True)[:5]
    
    def _encode_severity(self, severity: str) -> int:
        """Encode severity level"""
        severity_map = {'mild': 0, 'moderate': 1, 'severe': 2}
        return severity_map.get(severity.lower(), 1)
    
    def _encode_duration(self, duration: str) -> int:
        """Encode duration"""
        duration_map = {'hours': 0, 'days': 1, 'weeks': 2, 'months': 3}
        return duration_map.get(duration.lower(), 1)
    
    def _get_disease_description(self, disease: str) -> str:
        """Get disease description"""
        descriptions = {
            'common_cold': 'A viral infection of the upper respiratory tract',
            'flu': 'Influenza, a viral infection affecting the respiratory system',
            'gastroenteritis': 'Inflammation of the stomach and intestines',
            'pneumonia': 'Infection that inflames air sacs in one or both lungs',
            'migraine': 'A neurological condition causing severe headaches',
            'hypertension': 'High blood pressure, a common cardiovascular condition',
            'diabetes': 'A group of diseases that affect how the body uses blood sugar',
            'anxiety': 'A mental health disorder characterized by excessive worry',
            'depression': 'A mood disorder causing persistent sadness and loss of interest',
            'allergies': 'Immune system reactions to substances that are usually harmless',
            'asthma': 'A chronic respiratory condition causing breathing difficulties',
            'skin_condition': 'Various dermatological conditions affecting the skin',
            'arthritis': 'Inflammation of joints causing pain and stiffness',
            'muscle_strain': 'Injury to muscle or tendon from overuse or trauma'
        }
        return descriptions.get(disease, 'A medical condition requiring professional evaluation')
    
    def _get_disease_severity(self, disease: str) -> str:
        """Get disease severity level"""
        severity_map = {
            'common_cold': 'mild',
            'flu': 'moderate',
            'gastroenteritis': 'moderate',
            'pneumonia': 'severe',
            'migraine': 'moderate',
            'hypertension': 'moderate',
            'diabetes': 'severe',
            'anxiety': 'moderate',
            'depression': 'moderate',
            'allergies': 'mild',
            'asthma': 'moderate',
            'skin_condition': 'mild',
            'arthritis': 'moderate',
            'muscle_strain': 'mild'
        }
        return severity_map.get(disease, 'moderate')
    
    def _get_recommended_actions(self, disease: str) -> List[str]:
        """Get recommended actions for disease"""
        actions = {
            'common_cold': [
                'Rest and stay hydrated',
                'Use over-the-counter cold medications',
                'Gargle with salt water for sore throat'
            ],
            'flu': [
                'Rest and stay hydrated',
                'Consider antiviral medications if caught early',
                'Monitor for complications'
            ],
            'gastroenteritis': [
                'Stay hydrated with clear fluids',
                'Avoid solid foods until symptoms improve',
                'Rest and avoid dairy products'
            ],
            'pneumonia': [
                'Seek immediate medical attention',
                'Take prescribed antibiotics',
                'Get plenty of rest'
            ],
            'migraine': [
                'Rest in a dark, quiet room',
                'Apply cold compress to head',
                'Consider migraine medications'
            ],
            'hypertension': [
                'Monitor blood pressure regularly',
                'Follow a low-sodium diet',
                'Exercise regularly and maintain healthy weight'
            ],
            'diabetes': [
                'Monitor blood sugar levels',
                'Follow a diabetic diet',
                'Take prescribed medications as directed'
            ],
            'anxiety': [
                'Practice relaxation techniques',
                'Consider therapy or counseling',
                'Maintain regular sleep schedule'
            ],
            'depression': [
                'Seek professional help',
                'Maintain social connections',
                'Engage in regular physical activity'
            ],
            'allergies': [
                'Avoid known allergens',
                'Use antihistamines as needed',
                'Consider allergy testing'
            ],
            'asthma': [
                'Use prescribed inhaler as directed',
                'Avoid triggers like smoke and allergens',
                'Monitor breathing and seek help if worsening'
            ],
            'skin_condition': [
                'Keep affected area clean and dry',
                'Avoid scratching',
                'Use prescribed topical treatments',
                'Consult a dermatologist if persistent'
            ],
            'arthritis': [
                'Take anti-inflammatory medications as prescribed',
                'Apply heat or cold to affected joints',
                'Engage in gentle exercise',
                'Maintain healthy weight'
            ],
            'muscle_strain': [
                'Rest the affected muscle',
                'Apply ice for first 48 hours',
                'Use compression and elevation',
                'Take over-the-counter pain relievers'
            ]
        }
        return actions.get(disease, [
            'Consult with a healthcare professional',
            'Monitor symptoms closely',
            'Seek medical attention if symptoms worsen'
        ])
