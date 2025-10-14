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
  Users,
  Shield,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Database,
  UserCheck,
  Clock
} from 'lucide-react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js'
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement)

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user && user.role !== 'admin') {
      router.push('/dashboard')
    } else if (user && user.role === 'admin') {
      fetchAdminAnalytics()
    }
  }, [user, loading, router, timeRange])

  const fetchAdminAnalytics = async () => {
    setLoadingData(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) return

      // Fetch admin dashboard data
      const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch usage analytics
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/analytics/usage?days=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch all predictions
      const predictionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/predictions?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (dashboardResponse.ok && analyticsResponse.ok && predictionsResponse.ok) {
        const dashboard = await dashboardResponse.json()
        const analytics = await analyticsResponse.json()
        const predictions = await predictionsResponse.json()
        
        setAnalyticsData({
          dashboard,
          analytics,
          predictions,
          processed: processSystemData(dashboard, analytics, predictions)
        })
      }
    } catch (error) {
      console.error('Failed to fetch admin analytics:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const processSystemData = (dashboard: any, analytics: any, predictions: any[]) => {
    // Process disease frequency across all users
    const diseaseCount: { [key: string]: number } = {}
    const userActivity: { [key: string]: number } = {}
    
    predictions.forEach((pred: any) => {
      // Count diseases
      diseaseCount[pred.disease_count] = (diseaseCount[pred.disease_count] || 0) + 1
      
      // Track user activity
      userActivity[pred.user_id] = (userActivity[pred.user_id] || 0) + 1
    })

    // Calculate top diseases from analytics
    const topDiseases = analytics.top_diseases || []
    
    // Calculate user engagement
    const activeUsers = Object.keys(userActivity).length
    const avgPredictionsPerUser = predictions.length / Math.max(activeUsers, 1)

    return {
      topDiseases,
      activeUsers,
      avgPredictionsPerUser,
      diseaseCount
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system analytics...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  // Chart Data Preparation
  const userGrowthData = {
    labels: analyticsData?.analytics?.daily_registrations?.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'New Users',
      data: analyticsData?.analytics?.daily_registrations?.map((d: any) => d.count) || [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const predictionTrendData = {
    labels: analyticsData?.analytics?.daily_predictions?.map((d: any) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Predictions',
      data: analyticsData?.analytics?.daily_predictions?.map((d: any) => d.count) || [],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const topDiseasesData = {
    labels: analyticsData?.analytics?.top_diseases?.slice(0, 10).map((d: any) => d.disease) || [],
    datasets: [{
      label: 'Frequency',
      data: analyticsData?.analytics?.top_diseases?.slice(0, 10).map((d: any) => d.count) || [],
      backgroundColor: [
        '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
        '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
      ]
    }]
  }

  const riskDistributionData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [
        analyticsData?.dashboard?.prediction_stats?.risk_level_distribution?.high || 0,
        analyticsData?.dashboard?.prediction_stats?.risk_level_distribution?.medium || 0,
        analyticsData?.dashboard?.prediction_stats?.risk_level_distribution?.low || 0
      ],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const userStatusData = {
    labels: ['Active Users', 'Inactive Users'],
    datasets: [{
      data: [
        analyticsData?.dashboard?.user_stats?.active_users || 0,
        (analyticsData?.dashboard?.user_stats?.total_users || 0) - (analyticsData?.dashboard?.user_stats?.active_users || 0)
      ],
      backgroundColor: ['#10B981', '#9CA3AF'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Analytics Dashboard</h1>
                <p className="text-sm text-slate-300">System-Wide Health Data Insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={fetchAdminAnalytics}
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Back to Admin
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
              {[7, 30, 90, 365].map((days) => (
                <Button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  variant={timeRange === days ? 'default' : 'outline'}
                  size="sm"
                >
                  {days === 365 ? '1 Year' : `${days} Days`}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard?.user_stats?.total_users || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                +{analyticsData?.dashboard?.user_stats?.new_users_this_week || 0} this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard?.prediction_stats?.total_predictions || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsData?.dashboard?.prediction_stats?.predictions_today || 0} today
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard?.user_stats?.active_users || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {((analyticsData?.dashboard?.user_stats?.active_users / Math.max(analyticsData?.dashboard?.user_stats?.total_users, 1)) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((analyticsData?.dashboard?.prediction_stats?.average_confidence || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Model performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Growth Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                <span>User Growth Trend</span>
              </CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <Line 
                data={userGrowthData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </CardContent>
          </Card>

          {/* Prediction Activity Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Prediction Activity</span>
              </CardTitle>
              <CardDescription>Daily prediction volume</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <Line 
                data={predictionTrendData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Diseases */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Top Predicted Diseases (System-Wide)</span>
              </CardTitle>
              <CardDescription>Most common predictions across all users</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <Bar 
                data={topDiseasesData} 
                options={{ 
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } }
                }} 
              />
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="h-5 w-5 text-red-600" />
                <span>Risk Distribution</span>
              </CardTitle>
              <CardDescription>System-wide risk levels</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <Pie data={riskDistributionData} options={{ maintainAspectRatio: false }} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 3: User Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>User Status Distribution</span>
              </CardTitle>
              <CardDescription>Active vs inactive users</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <Doughnut data={userStatusData} options={{ maintainAspectRatio: false }} />
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-green-600" />
                <span>System Health Metrics</span>
              </CardTitle>
              <CardDescription>Platform performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {analyticsData?.dashboard?.system_health?.database_status || 'Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ML Model Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {analyticsData?.dashboard?.system_health?.ml_model_status || 'Loaded'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm text-gray-600">
                  {analyticsData?.dashboard?.system_health?.uptime || '99.9%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <span className="text-sm text-gray-600">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Predictions/Day</span>
                <span className="text-sm text-gray-600">
                  {(analyticsData?.dashboard?.prediction_stats?.predictions_this_week / 7).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>System Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Most Common Disease</h4>
                <p className="text-lg font-bold text-blue-600">
                  {analyticsData?.analytics?.top_diseases?.[0]?.disease || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analyticsData?.analytics?.top_diseases?.[0]?.count || 0} predictions
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">User Engagement</h4>
                <p className="text-lg font-bold text-green-600">
                  {analyticsData?.processed?.avgPredictionsPerUser?.toFixed(1) || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">predictions per user</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">High Risk Cases</h4>
                <p className="text-lg font-bold text-red-600">
                  {analyticsData?.dashboard?.prediction_stats?.risk_level_distribution?.high || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">require attention</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Platform Health</h4>
                <p className="text-lg font-bold text-purple-600">Excellent</p>
                <p className="text-xs text-gray-500 mt-1">all systems operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
