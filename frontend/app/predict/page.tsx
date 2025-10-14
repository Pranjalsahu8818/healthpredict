'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2,
  Stethoscope,
  ArrowLeft,
  TrendingUp,
  Shield,
  User as UserIcon,
  FileText,
  X
} from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import toast from 'react-hot-toast'

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// Comprehensive symptoms list (100+ symptoms organized by category)
const SYMPTOMS = [
  // 🫁 Respiratory Symptoms (15)
  'Fever', 'Cough', 'Dry Cough', 'Productive Cough', 'Shortness of Breath', 
  'Chest Pain', 'Sore Throat', 'Runny Nose', 'Sneezing', 'Congestion', 
  'Wheezing', 'Difficulty Breathing', 'Rapid Breathing', 'Shallow Breathing', 'Coughing Blood',
  
  // ⚡ General & Systemic (12)
  'Fatigue', 'Weakness', 'Chills', 'Sweating', 'Night Sweats',
  'Loss of Appetite', 'Weight Loss', 'Weight Gain', 'Dehydration', 'Malaise',
  'Lethargy', 'General Discomfort',
  
  // 🩹 Pain & Discomfort (15)
  'Headache', 'Migraine', 'Muscle Pain', 'Joint Pain', 'Back Pain', 
  'Neck Pain', 'Shoulder Pain', 'Abdominal Pain', 'Pelvic Pain', 'Ear Pain', 
  'Tooth Pain', 'Jaw Pain', 'Knee Pain', 'Hip Pain', 'Ankle Pain',
  
  // 🍽️ Digestive & GI (15)
  'Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Bloating',
  'Heartburn', 'Acid Reflux', 'Blood in Stool', 'Black Stool', 'Difficulty Swallowing',
  'Loss of Bowel Control', 'Stomach Cramps', 'Gas', 'Indigestion', 'Rectal Bleeding',
  
  // 🧴 Skin & External (12)
  'Skin Rash', 'Itching', 'Hives', 'Dry Skin', 'Pale Skin',
  'Yellowing of Skin', 'Bruising', 'Swelling', 'Redness', 'Blisters',
  'Peeling Skin', 'Discoloration',
  
  // 🧠 Neurological (15)
  'Dizziness', 'Vertigo', 'Confusion', 'Memory Loss', 'Numbness', 
  'Tingling', 'Tremors', 'Seizures', 'Loss of Consciousness', 'Fainting',
  'Difficulty Concentrating', 'Slurred Speech', 'Loss of Balance', 'Coordination Problems', 'Brain Fog',
  
  // 💭 Mental Health & Cognitive (10)
  'Anxiety', 'Depression', 'Mood Swings', 'Irritability', 'Insomnia',
  'Restlessness', 'Panic Attacks', 'Stress', 'Nervousness', 'Emotional Instability',
  
  // ❤️ Cardiovascular (10)
  'Irregular Heartbeat', 'Rapid Heartbeat', 'Slow Heartbeat', 'Chest Tightness',
  'High Blood Pressure', 'Low Blood Pressure', 'Palpitations', 'Heart Flutters',
  'Chest Pressure', 'Racing Heart',
  
  // 👁️ Sensory & Vision (12)
  'Blurred Vision', 'Double Vision', 'Sensitivity to Light', 'Eye Pain',
  'Ringing in Ears', 'Hearing Loss', 'Loss of Smell', 'Loss of Taste',
  'Watery Eyes', 'Dry Eyes', 'Eye Redness', 'Floaters in Vision',
  
  // 🚽 Urinary & Reproductive (8)
  'Frequent Urination', 'Painful Urination', 'Blood in Urine',
  'Difficulty Urinating', 'Incontinence', 'Urgent Urination', 'Cloudy Urine', 'Dark Urine',
  
  // 🦴 Musculoskeletal (8)
  'Stiff Joints', 'Swollen Joints', 'Joint Stiffness', 'Muscle Cramps',
  'Leg Cramps', 'Muscle Weakness', 'Bone Pain', 'Limited Range of Motion',
  
  // 🌡️ Temperature & Circulation (6)
  'Hot Flashes', 'Cold Hands/Feet', 'Poor Circulation', 'Flushing',
  'Body Aches', 'Temperature Sensitivity',
  
  // 🔧 Other Common Symptoms (12)
  'Excessive Thirst', 'Dry Mouth', 'Bad Breath', 'Hair Loss',
  'Brittle Nails', 'Swollen Lymph Nodes', 'Stiff Neck', 'Hoarseness',
  'Voice Changes', 'Difficulty Speaking', 'Excessive Saliva', 'Mouth Sores'
]

interface PredictionResult {
  disease: string
  description: string
  precautions: string[]
  doctor_recommendation: string
  confidence: number
  alternative_diseases: { name: string; confidence: number }[]
}

export default function PredictPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const filteredSymptoms = SYMPTOMS.filter(symptom => 
    symptom.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSymptoms.includes(symptom)
  )

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
      setSearchTerm('')
      setShowDropdown(false)
    }
  }

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
  }

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select at least one symptom')
      return
    }

    setPredicting(true)
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        toast.error('Please login to make predictions')
        router.push('/auth/login')
        return
      }

      // Prepare symptoms data
      const symptomsData = selectedSymptoms.map(symptom => ({
        name: symptom,
        severity: 'moderate',
        duration: 'days'
      }))

      // Call backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictions/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: symptomsData,
          additional_info: ''
        })
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const data = await response.json()
      
      // Format the result
      const topDisease = data.predicted_diseases[0]
      const mockResult: PredictionResult = {
        disease: topDisease.disease_name,
        description: topDisease.description || 'A medical condition that requires attention.',
        precautions: topDisease.recommended_actions || [
          'Consult with a healthcare professional',
          'Monitor your symptoms',
          'Get adequate rest',
          'Stay hydrated',
          'Follow medical advice'
        ],
        doctor_recommendation: 'General Physician or Specialist',
        confidence: Math.round(data.overall_confidence * 100),
        alternative_diseases: data.predicted_diseases.slice(1, 5).map((d: any) => ({
          name: d.disease_name,
          confidence: Math.round(d.confidence_score * 100)
        }))
      }
      
      setResult(mockResult)
      toast.success('Prediction completed successfully!')
    } catch (error) {
      toast.error('Prediction failed. Please try again.')
      console.error('Prediction error:', error)
    } finally {
      setPredicting(false)
    }
  }

  const resetPrediction = () => {
    setResult(null)
    setSelectedSymptoms([])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Chart data for confidence visualization
  const pieChartData = result ? {
    labels: [result.disease, ...result.alternative_diseases.map(d => d.name)],
    datasets: [{
      data: [result.confidence, ...result.alternative_diseases.map(d => d.confidence)],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(168, 85, 247, 1)'
      ],
      borderWidth: 2
    }]
  } : null

  const barChartData = result ? {
    labels: [result.disease, ...result.alternative_diseases.map(d => d.name)],
    datasets: [{
      label: 'Confidence (%)',
      data: [result.confidence, ...result.alternative_diseases.map(d => d.confidence)],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Disease Prediction Confidence'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Disease Prediction</h1>
                <p className="text-xs text-gray-600">AI-Powered Health Analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!result ? (
          // Symptom Selection View
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  <span>Select Your Symptoms</span>
                </CardTitle>
                <CardDescription>
                  Choose all symptoms you're currently experiencing for accurate prediction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multi-select Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search and Select Symptoms
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Type to search symptoms..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  {/* Dropdown List */}
                  {showDropdown && filteredSymptoms.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSymptoms.map((symptom) => (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                        >
                          {symptom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Symptoms */}
                {selectedSymptoms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Symptoms ({selectedSymptoms.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {symptom}
                          <button
                            onClick={() => removeSymptom(symptom)}
                            className="ml-2 hover:text-blue-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predict Button */}
                <Button
                  onClick={handlePredict}
                  disabled={selectedSymptoms.length === 0 || predicting}
                  className="w-full"
                  size="lg"
                >
                  {predicting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Predict Disease
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">How it works</h4>
                    <p className="text-sm text-blue-800">
                      Our AI model analyzes your symptoms using machine learning algorithms trained on 
                      thousands of medical cases. Select all relevant symptoms for the most accurate prediction.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Results View
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-2xl">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <span>Prediction Result</span>
                  </CardTitle>
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Disease Name */}
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{result.disease}</h3>
                  <p className="text-gray-600 leading-relaxed">{result.description}</p>
                </div>

                {/* Precautions */}
                <div>
                  <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <Shield className="h-5 w-5 text-orange-600 mr-2" />
                    Precautions & Care
                  </h4>
                  <ul className="space-y-2">
                    {result.precautions.map((precaution, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{precaution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Doctor Recommendation */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="flex items-center text-lg font-semibold text-purple-900 mb-2">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Recommended Doctor
                  </h4>
                  <p className="text-purple-800 font-medium">{result.doctor_recommendation}</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Please consult with a qualified healthcare professional for proper diagnosis and treatment.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Confidence Distribution</CardTitle>
                  <CardDescription>Visual breakdown of prediction probabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {pieChartData && <Pie data={pieChartData} options={chartOptions} />}
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Diagnoses</CardTitle>
                  <CardDescription>Other possible conditions based on symptoms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {barChartData && <Bar data={barChartData} options={chartOptions} />}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alternative Diseases List */}
            <Card>
              <CardHeader>
                <CardTitle>Other Possible Conditions</CardTitle>
                <CardDescription>Alternative diagnoses to consider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.alternative_diseases.map((disease, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{disease.name}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${disease.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                          {disease.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button onClick={resetPrediction} variant="outline" size="lg">
                <Activity className="mr-2 h-5 w-5" />
                New Prediction
              </Button>
              <Button onClick={() => {
                toast.success('Prediction saved to your history!')
                router.push('/dashboard')
              }} size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Button>
            </div>

            {/* Medical Disclaimer */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Important Medical Disclaimer</h4>
                    <p className="text-sm text-yellow-800">
                      This AI prediction is for informational purposes only and should not replace professional 
                      medical advice, diagnosis, or treatment. Always seek the advice of your physician or other 
                      qualified health provider with any questions you may have regarding a medical condition.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
