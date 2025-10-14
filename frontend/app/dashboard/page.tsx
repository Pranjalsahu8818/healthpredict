'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  Stethoscope,
  LogOut,
  User,
  FileText,
  Settings,
  Home,
  Info,
  Phone,
  LayoutDashboard,
  Menu,
  X,
  Heart,
  Brain,
  Shield,
  RefreshCw
} from 'lucide-react'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [predictions, setPredictions] = useState([])
  const [stats, setStats] = useState({
    total_predictions: 0,
    predictions_this_month: 0,
    high_risk_alerts: 0,
    recent_predictions: []
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchPredictionStats()
    }
  }, [user])

  const fetchPredictionStats = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      console.log('Fetching stats with token:', token ? 'Token exists' : 'No token')

      if (!token) {
        console.error('No auth token found')
        setLoadingStats(false)
        return
      }

      // Fetch personal stats for all users (including admin)
      const url = `${process.env.NEXT_PUBLIC_API_URL}/predictions/stats/summary`
      console.log('Fetching from:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Stats data received:', data)
        setStats(data)
        setPredictions(data.recent_predictions)
      } else {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch prediction stats:', error)
    } finally {
      setLoadingStats(false)
    }
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

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', current: true },
    { name: 'New Prediction', icon: Activity, href: '/predict', current: false },
    { name: 'Analytics', icon: TrendingUp, href: '/analytics', current: false },
    { name: 'History', icon: FileText, href: '/history', current: false },
    { name: 'Profile', icon: User, href: '/profile', current: false },
    ...(user.role === 'admin' ? [{ name: 'Admin Panel', icon: Shield, href: '/admin', current: false }] : []),
    { name: 'About', icon: Info, href: '/about', current: false },
    { name: 'Contact', icon: Phone, href: '/contact', current: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">HealthPredict</h1>
                <p className="text-xs text-gray-500">AI Health Insights</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  item.current
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          onClick={() => setSidebarOpen(true)}
          size="sm"
          className="bg-white shadow-lg"
          variant="outline"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-600">Welcome back, {user.name.split(' ')[0]}!</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => {
                    setLoadingStats(true)
                    fetchPredictionStats()
                  }}
                  variant="outline"
                  size="sm"
                  disabled={loadingStats}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Health Score: 95%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Medical Banner with Images */}
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Welcome back, {user.name.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Here's an overview of your health predictions and insights.
                    </p>
                    <Button onClick={() => router.push('/predict')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Activity className="mr-2 h-5 w-5" />
                      Start New Prediction
                    </Button>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Status Card */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">AI Protection</h3>
                  <p className="text-sm text-gray-600 mb-2">95% Accuracy Rate</p>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Stats Grid - Same for all users */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats.total_predictions}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time predictions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats.predictions_this_month}
              </div>
              <p className="text-xs text-gray-500 mt-1">Predictions this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats.high_risk_alerts}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with health predictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/predict')}
              >
                <Activity className="mr-2 h-5 w-5" />
                New Health Prediction
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/history')}
              >
                <FileText className="mr-2 h-5 w-5" />
                View Prediction History
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => router.push('/profile')}
              >
                <User className="mr-2 h-5 w-5" />
                Update Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest health predictions</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading predictions...</p>
                </div>
              ) : predictions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No predictions yet</p>
                  <Button onClick={() => router.push('/predict')}>
                    Make Your First Prediction
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {predictions.map((prediction: any, index: number) => (
                    <div key={prediction.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{prediction.disease}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(prediction.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 font-medium">
                          {Math.round(prediction.confidence * 100)}%
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          prediction.risk === 'high' ? 'bg-red-100 text-red-700' :
                          prediction.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {prediction.risk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Health Tips & Recommendations</CardTitle>
            <CardDescription>Personalized health insights based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Stay Hydrated</h4>
                <p className="text-sm text-blue-700">Drink at least 8 glasses of water daily for optimal health.</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Regular Exercise</h4>
                <p className="text-sm text-green-700">Aim for 30 minutes of moderate activity most days.</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Quality Sleep</h4>
                <p className="text-sm text-purple-700">Get 7-9 hours of sleep each night for better health.</p>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Medical Disclaimer */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Medical Disclaimer</h4>
                <p className="text-sm text-yellow-800">
                  This platform provides AI-powered health predictions for informational purposes only. 
                  It is not a substitute for professional medical advice, diagnosis, or treatment. 
                  Always consult with qualified healthcare professionals for medical concerns.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
