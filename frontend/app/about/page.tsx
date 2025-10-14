'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Stethoscope, 
  Target, 
  Eye, 
  Brain,
  Database,
  TrendingUp,
  CheckCircle2,
  Users,
  Award,
  Heart,
  Shield,
  Zap,
  ArrowRight,
  Home
} from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HealthPredict</h1>
                <p className="text-sm text-gray-600">About Us</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About HealthPredict
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering individuals with AI-driven health insights for better, 
            more informed healthcare decisions.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Mission */}
          <Card className="border-2 border-blue-200 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <Target className="h-8 w-8 text-blue-600" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                To democratize healthcare by providing accessible, AI-powered disease prediction 
                tools that help individuals make informed decisions about their health.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Make healthcare insights accessible to everyone</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Reduce healthcare costs through early detection</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Empower users with knowledge about their health</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="border-2 border-purple-200 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <Eye className="h-8 w-8 text-purple-600" />
                <span>Our Vision</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                To become the world's most trusted AI-powered health companion, helping millions 
                of people take proactive control of their health and well-being.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Global reach with localized healthcare insights</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Continuous AI improvement and accuracy</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Partnership with healthcare providers worldwide</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* AI Working Process */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              How Our AI Works
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced machine learning system analyzes symptoms using a multi-step process 
              to provide accurate health predictions.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600 text-white flex items-center justify-center text-2xl font-bold rounded-bl-3xl">
                1
              </div>
              <CardHeader className="pt-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">Data Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You input your symptoms through our intuitive interface. Our system captures 
                  detailed information about your health concerns.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-600 text-white flex items-center justify-center text-2xl font-bold rounded-bl-3xl">
                2
              </div>
              <CardHeader className="pt-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Database className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">Data Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your symptoms are preprocessed and normalized. Our system cleans and structures 
                  the data for optimal analysis.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-600 text-white flex items-center justify-center text-2xl font-bold rounded-bl-3xl">
                3
              </div>
              <CardHeader className="pt-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our machine learning model, trained on thousands of medical cases, analyzes 
                  symptom patterns to identify potential diseases.
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-600 text-white flex items-center justify-center text-2xl font-bold rounded-bl-3xl">
                4
              </div>
              <CardHeader className="pt-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">Results Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You receive a detailed report with disease predictions, confidence scores, 
                  precautions, and doctor recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Technology Details */}
        <Card className="mb-16 border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="text-2xl flex items-center space-x-3">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span>Our AI Technology</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Machine Learning</h4>
                <p className="text-gray-600 text-sm">
                  Advanced algorithms trained on extensive medical datasets for accurate predictions
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-lg mb-2">95% Accuracy</h4>
                <p className="text-gray-600 text-sm">
                  Validated against medical databases with high precision and recall rates
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Continuous Learning</h4>
                <p className="text-gray-600 text-sm">
                  Our AI improves over time with new data and medical research updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Our Core Values
            </h3>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-10 w-10 text-red-600" />
                </div>
                <h4 className="text-xl font-bold mb-3">Patient First</h4>
                <p className="text-gray-600">
                  Every decision we make prioritizes the health and well-being of our users
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-10 w-10 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold mb-3">Privacy & Security</h4>
                <p className="text-gray-600">
                  Your health data is encrypted and protected with industry-leading security
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold mb-3">Innovation</h4>
                <p className="text-gray-600">
                  We continuously improve our AI to provide the most accurate health insights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of users who trust HealthPredict for their health insights
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="text-lg">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-lg bg-white text-blue-600 hover:bg-blue-50">
                  Contact Us
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
