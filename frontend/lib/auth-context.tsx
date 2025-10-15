'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'
import { getApiUrl } from './api-config'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = Cookies.get('auth_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('https://healthpredict-production.up.railway.app/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        Cookies.remove('auth_token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      Cookies.remove('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = 'https://healthpredict-production.up.railway.app/auth/login';
      console.log('Login attempt - using URL:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Login successful, setting user:', data.user)
        Cookies.set('auth_token', data.access_token, { expires: 7 })
        setUser(data.user)
        setLoading(false) // Ensure loading is false
        toast.success('Login successful!')
        return true
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Login failed')
        return false
      }
    } catch (error) {
      console.error('Login error details:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error: Cannot reach server. Check if backend is running.')
      } else {
        toast.error('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const apiUrl = 'https://healthpredict-production.up.railway.app/auth/register';
      console.log('Register attempt - using URL:', apiUrl);
      console.log('Request payload:', { name, email, password: '***' });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json()
        console.log('Registration successful, setting user:', data.user)
        Cookies.set('auth_token', data.access_token, { expires: 7 })
        setUser(data.user)
        setLoading(false) // Ensure loading is false
        toast.success('Registration successful!')
        return true
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Registration failed')
        return false
      }
    } catch (error) {
      console.error('Registration error details:', error)
      console.error('Error type:', typeof error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error: Cannot reach server. Check if backend is running.')
      } else {
        toast.error('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
      return false
    }
  }

  const logout = () => {
    Cookies.remove('auth_token')
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
