'use client'

import { useState } from 'react'

export default function TestAuthPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testRegister = async () => {
    setLoading(true)
    setResult('Testing registration...')
    
    try {
      console.log('Testing registration endpoint...')
      
      // First test if we can reach the health endpoint
      const healthResponse = await fetch('https://healthpredict-production.up.railway.app/health')
      console.log('Health check status:', healthResponse.status)
      
      if (!healthResponse.ok) {
        setResult('BACKEND DOWN: Health check failed with status ' + healthResponse.status)
        return
      }
      
      // Now test registration
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
      
      console.log('Registration response status:', response.status)
      console.log('Registration response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers))
      
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { raw: responseText }
      }
      
      if (response.ok) {
        setResult('SUCCESS: Registration worked!\n' + JSON.stringify(data, null, 2))
      } else {
        setResult('ERROR (Status ' + response.status + '):\n' + JSON.stringify(data, null, 2))
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorType = error instanceof Error ? error.constructor.name : typeof error
      setResult('NETWORK ERROR: ' + errorMessage + '\nError type: ' + errorType)
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult('Health check error: ' + errorMessage)
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
