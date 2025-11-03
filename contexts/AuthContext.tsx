"use client"

import { signOut, useSession } from 'next-auth/react'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  username: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const API_BASE_URL = 'https://eco-track-ai.onrender.com'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session?.user) {
      // User is signed in via NextAuth
      const userData: User = {
        id: (session.user as any).id || session.user.email || '',
        name: session.user.name || '',
        email: session.user.email || '',
        username: (session.user as any).username || session.user.email?.split('@')[0] || ''
      }
      setUser(userData)
      setIsLoading(false)
    } else {
      // Check if user is logged in via traditional auth
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
      }
      setIsLoading(false)
    }
  }, [session, status])

  const register = async (name: string, email: string, password: string) => {
    try {
      const username = email.split('@')[0] // Generate username from email
      
      // Register the user
      const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name,
          email,
          username,
          password,
        }),
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.detail || 'Registration failed')
      }

      const userData = await registerResponse.json()
      
      // Store user data (no token needed for registration)
      const user: User = {
        id: userData.id,
        name: userData.full_name,
        email: userData.email,
        username: userData.username
      }

      // Registration successful, now log the user in
      await login(email, password)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams()
      formData.append('email', email)
      formData.append('password', password)

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }

      const data = await response.json()
      
      // Extract user data from response
      const userData: User = {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        username: data.user.username
      }

      // Store token and user data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user_data', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    // Clear traditional auth
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
    
    // Sign out from NextAuth if applicable
    if (session) {
      signOut({ callbackUrl: '/login' })
    } else {
      window.location.href = '/login'
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
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
