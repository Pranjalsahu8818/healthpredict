'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  History,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  ChevronRight,
  Activity
} from 'lucide-react'

interface Disease {
  disease_name: string
  confidence_score: number
  description: string
  severity: string
  recommended_actions: string[]
}

interface Prediction {
  id: string
  predicted_diseases: Disease[]
  overall_confidence: number
  risk_level: string
  created_at: string
  disclaimer: string
}

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchHistory()
    }
  }, [user, loading, router])

  const fetchHistory = async () => {
    setLoadingData(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictions/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPredictions(data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const downloadReport = (predictionId: string) => {
    setDownloading(predictionId)
    
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]

    if (!token) {
      alert('Please login to download reports')
      setDownloading(null)
      return
    }

    console.log('Downloading report for prediction:', predictionId)
    
    // Direct navigation approach - bypasses all CORS/fetch issues
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/predictions/${predictionId}/download-report?auth=${encodeURIComponent(token)}`
    
    console.log('Opening download URL:', downloadUrl)
    
    // Create a temporary anchor and click it
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `HealthPredict_Report_${predictionId}.pdf`
    link.target = '_blank'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link)
      setDownloading(null)
    }, 1000)
    
    console.log('✓ Download initiated')
  }

  const filteredPredictions = predictions.filter(pred => {
    const matchesSearch = pred.predicted_diseases.some(d => 
      d.disease_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    const matchesFilter = filterRisk === 'all' || pred.risk_level === filterRisk
    return matchesSearch && matchesFilter
  })

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="h-5 w-5" />
      case 'medium': return <Clock className="h-5 w-5" />
      case 'low': return <CheckCircle className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your history...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <History className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Prediction History</h1>
                <p className="text-sm text-blue-100">View your past health assessments</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Predictions</p>
                  <p className="text-2xl font-bold text-blue-600">{predictions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {predictions.filter(p => p.risk_level === 'high').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Medium Risk</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {predictions.filter(p => p.risk_level === 'medium').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600">
                    {predictions.filter(p => p.risk_level === 'low').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by disease name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predictions List */}
        {filteredPredictions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Predictions Found</h3>
              <p className="text-gray-500 mb-6">
                {predictions.length === 0 
                  ? "You haven't made any predictions yet."
                  : "No predictions match your search criteria."}
              </p>
              {predictions.length === 0 && (
                <Button onClick={() => router.push('/predict')}>
                  Make Your First Prediction
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => (
              <Card key={prediction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg border ${getRiskColor(prediction.risk_level)}`}>
                          {getRiskIcon(prediction.risk_level)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {prediction.predicted_diseases[0]?.disease_name || 'Unknown'}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(prediction.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${prediction.overall_confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {(prediction.overall_confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(prediction.risk_level)}`}>
                            {getRiskIcon(prediction.risk_level)}
                            <span className="capitalize">{prediction.risk_level}</span>
                          </span>
                        </div>
                      </div>

                      {prediction.predicted_diseases.length > 1 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Other Possible Conditions:</p>
                          <div className="flex flex-wrap gap-2">
                            {prediction.predicted_diseases.slice(1, 4).map((disease, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {disease.disease_name} ({(disease.confidence_score * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>{prediction.predicted_diseases.length} conditions analyzed</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => downloadReport(prediction.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                            disabled={downloading === prediction.id}
                          >
                            {downloading === prediction.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                <span>Download Report</span>
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setSelectedPrediction(prediction)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prediction Details</CardTitle>
                  <CardDescription>
                    {new Date(selectedPrediction.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => downloadReport(selectedPrediction.id)}
                    variant="default"
                    size="sm"
                    disabled={downloading === selectedPrediction.id}
                    className="flex items-center space-x-1"
                  >
                    {downloading === selectedPrediction.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setSelectedPrediction(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Info */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Confidence</span>
                    <span className="text-lg font-bold text-blue-600">
                      {(selectedPrediction.overall_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Risk Level</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selectedPrediction.risk_level)}`}>
                      {selectedPrediction.risk_level.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Predicted Diseases */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Predicted Conditions</h3>
                  <div className="space-y-4">
                    {selectedPrediction.predicted_diseases.map((disease, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{disease.disease_name}</h4>
                          <span className="text-sm font-medium text-blue-600">
                            {(disease.confidence_score * 100).toFixed(1)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{disease.description}</p>
                        <div className="mb-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            disease.severity === 'severe' ? 'bg-red-100 text-red-700' :
                            disease.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {disease.severity} severity
                          </span>
                        </div>
                        {disease.recommended_actions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {disease.recommended_actions.map((action, actionIdx) => (
                                <li key={actionIdx} className="text-sm text-gray-600">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-gray-600">{selectedPrediction.disclaimer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
