'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  Shield,
  Database,
  BarChart3,
  UserCheck,
  UserX,
  Calendar
} from 'lucide-react'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user && user.role !== 'admin') {
      router.push('/dashboard')
    } else if (user && user.role === 'admin') {
      fetchAdminDashboard()
    }
  }, [user, loading, router])

  const fetchAdminDashboard = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        setLoadingData(false)
        return
      }

      console.log('Fetching admin dashboard data...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Admin dashboard response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Admin dashboard data:', data)
        setDashboardData(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch admin dashboard:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
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
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-300">HealthPredict Management Panel</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => router.push('/admin/analytics')}
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.user_stats?.total_users || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData?.user_stats?.new_users_this_week || 0} new this week
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.user_stats?.active_users || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData?.user_stats?.new_users_today || 0} new today
              </p>
            </CardContent>
          </Card>

          {/* Total Predictions */}
          <Card className="border-l-4 border-l-purple-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.prediction_stats?.total_predictions || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData?.prediction_stats?.predictions_today || 0} today
              </p>
            </CardContent>
          </Card>

          {/* Average Confidence */}
          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((dashboardData?.prediction_stats?.average_confidence || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Model performance</p>
            </CardContent>
          </Card>
        </div>

        {/* System Health & Risk Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {dashboardData?.system_health?.status || 'Healthy'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-gray-600">
                  {dashboardData?.system_health?.database_status || 'Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ML Model</span>
                <span className="text-sm text-gray-600">
                  {dashboardData?.system_health?.ml_model_status || 'Loaded'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm text-gray-600">
                  {dashboardData?.system_health?.uptime || '99.9%'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Risk Level Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dashboardData?.prediction_stats?.risk_level_distribution || {}).map(([level, count]: [string, any]) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{level}</span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        level === 'high' ? 'bg-red-600' :
                        level === 'medium' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{
                        width: `${(count / (dashboardData?.prediction_stats?.total_predictions || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
            <CardDescription>Latest disease predictions across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Risk Level</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Confidence</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Diseases</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.recent_predictions?.map((pred: any) => (
                    <tr key={pred.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{pred.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{pred.user_id.substring(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                          pred.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {pred.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {(pred.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{pred.disease_count}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Admin Notice */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Admin Access</h4>
                <p className="text-sm text-blue-800">
                  You have full administrative access to the HealthPredict platform. 
                  Use this dashboard to monitor system health, user activity, and prediction analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
