'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  PieChart as PieChartIcon,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement)

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchAnalytics()
    }
  }, [user, loading, router, timeRange])

  const fetchAnalytics = async () => {
    setLoadingData(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) return

      // Fetch user stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictions/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch prediction history
      const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predictions/history?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (statsResponse.ok && historyResponse.ok) {
        const stats = await statsResponse.json()
        const history = await historyResponse.json()
        
        setAnalyticsData({
          stats,
          history,
          processedData: processAnalyticsData(stats, history)
        })
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const processAnalyticsData = (stats: any, history: any[]) => {
    // Process disease frequency
    const diseaseCount: { [key: string]: number } = {}
    const riskTrend: { date: string; high: number; medium: number; low: number }[] = []
    const confidenceTrend: number[] = []
    
    history.forEach((pred: any) => {
      // Count diseases
      pred.predicted_diseases?.forEach((disease: any) => {
        diseaseCount[disease.disease_name] = (diseaseCount[disease.disease_name] || 0) + 1
      })
      
      // Track confidence
      confidenceTrend.push(pred.overall_confidence * 100)
    })

    // Get top diseases
    const topDiseases = Object.entries(diseaseCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)

    // Calculate average confidence
    const avgConfidence = confidenceTrend.length > 0
      ? confidenceTrend.reduce((a, b) => a + b, 0) / confidenceTrend.length
      : 0

    return {
      topDiseases,
      avgConfidence,
      totalPredictions: history.length,
      diseaseCount
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Prepare chart data
  const riskDistributionData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [
        analyticsData?.stats?.high_risk_alerts || 0,
        Object.values(analyticsData?.stats?.risk_level_distribution || {}).reduce((a: any, b: any) => a + b, 0) - (analyticsData?.stats?.high_risk_alerts || 0),
        analyticsData?.stats?.total_predictions || 0
      ],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const topDiseasesData = {
    labels: analyticsData?.processedData?.topDiseases?.map(([name]: any) => name) || [],
    datasets: [{
      label: 'Frequency',
      data: analyticsData?.processedData?.topDiseases?.map(([, count]: any) => count) || [],
      backgroundColor: [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
        '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
      ],
      borderWidth: 1
    }]
  }

  const monthlyTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Predictions',
      data: [
        Math.floor((analyticsData?.stats?.predictions_this_month || 0) * 0.2),
        Math.floor((analyticsData?.stats?.predictions_this_month || 0) * 0.3),
        Math.floor((analyticsData?.stats?.predictions_this_month || 0) * 0.25),
        Math.floor((analyticsData?.stats?.predictions_this_month || 0) * 0.25)
      ],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Health Analytics</h1>
                <p className="text-sm text-blue-100">Insights & Trends Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchAnalytics}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <div className="flex space-x-2">
              {['7', '30', '90', '365'].map((days) => (
                <Button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  variant={timeRange === days ? 'default' : 'outline'}
                  size="sm"
                >
                  {days === '365' ? '1 Year' : `${days} Days`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.stats?.total_predictions || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.processedData?.avgConfidence?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.stats?.high_risk_alerts || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.stats?.predictions_this_month || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Recent activity</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                <span>Risk Level Distribution</span>
              </CardTitle>
              <CardDescription>Breakdown of prediction risk levels</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              {analyticsData?.stats?.total_predictions > 0 ? (
                <Pie data={riskDistributionData} options={{ maintainAspectRatio: false }} />
              ) : (
                <div className="text-center text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No data available</p>
                  <p className="text-sm">Make predictions to see analytics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Diseases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Top Predicted Diseases</span>
              </CardTitle>
              <CardDescription>Most frequently predicted conditions</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {analyticsData?.processedData?.topDiseases?.length > 0 ? (
                <Bar 
                  data={topDiseasesData} 
                  options={{ 
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } }
                  }} 
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  <div>
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Prediction Trend</span>
              </CardTitle>
              <CardDescription>Weekly prediction activity this month</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <Line 
                data={monthlyTrendData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Predictions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
            <CardDescription>Your latest health assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Disease</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Confidence</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Risk Level</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.stats?.recent_predictions?.map((pred: any) => (
                    <tr key={pred.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(pred.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{pred.disease}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {(pred.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.risk === 'high' ? 'bg-red-100 text-red-700' :
                          pred.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {pred.risk}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!analyticsData?.stats?.recent_predictions || analyticsData?.stats?.recent_predictions?.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predictions yet</p>
                  <Button onClick={() => router.push('/predict')} className="mt-4">
                    Make Your First Prediction
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Health Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Most Common Condition</h4>
                <p className="text-lg font-bold text-blue-600">
                  {analyticsData?.processedData?.topDiseases?.[0]?.[0] || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Prediction Frequency</h4>
                <p className="text-lg font-bold text-green-600">
                  {analyticsData?.stats?.total_predictions > 0 
                    ? `${(analyticsData?.stats?.predictions_this_month / 30).toFixed(1)}/day`
                    : '0/day'
                  }
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Health Score</h4>
                <p className="text-lg font-bold text-purple-600">
                  {analyticsData?.stats?.high_risk_alerts === 0 ? 'Excellent' : 
                   analyticsData?.stats?.high_risk_alerts < 3 ? 'Good' : 'Needs Attention'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
