'use client'

import { useState } from 'react'

export default function TestAuthPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testRegister = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      console.log('Testing registration endpoint...')
      
      const response = await fetch('https://healthpredict-production.up.railway.app/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test' + Date.now() + '@example.com',
          password: 'testpass123'
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        setResult('SUCCESS: Registration worked! ' + JSON.stringify(data))
      } else {
        setResult('ERROR: ' + JSON.stringify(data))
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      setResult('NETWORK ERROR: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testHealth = async () => {
    setLoading(true)
    setResult('Testing health...')
    
    try {
      const response = await fetch('https://healthpredict-production.up.railway.app/health')
      const data = await response.json()
      setResult('Health check: ' + JSON.stringify(data))
    } catch (error) {
      setResult('Health check error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="space-y-4">
          <button
            onClick={testHealth}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Health Endpoint
          </button>
          
          <button
            onClick={testRegister}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            Test Registration
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Open browser console (F12) to see detailed logs</p>
        </div>
      </div>
    </div>
  )
}
